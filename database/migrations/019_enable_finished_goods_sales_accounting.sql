-- Enable finished goods sales accounting without hardcoding product-specific accounts into the journal engine.

-- 1. Add a detail revenue account for egg sales.
DO $$
DECLARE
  v_parent_id uuid;
BEGIN
  SELECT id
  INTO v_parent_id
  FROM akun
  WHERE bum_desa_id IS NULL
    AND kode = '4.3.01.00'
    AND level = 'H'
    AND is_active = true
  LIMIT 1;

  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Parent account 4.3.01.00 Pendapatan Penjualan Barang Jadi tidak ditemukan.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM akun
    WHERE bum_desa_id IS NULL
      AND kode = '4.3.01.05'
  ) THEN
    INSERT INTO akun (
      bum_desa_id,
      parent_id,
      kode,
      nama,
      level,
      normal_balance,
      is_system,
      is_active,
      account_depth,
      is_kepmen_136
    )
    VALUES (
      NULL,
      v_parent_id,
      '4.3.01.05',
      'Pendapatan Penjualan Telur Ayam',
      'D',
      'KREDIT',
      true,
      true,
      4,
      false
    );
  END IF;
END $$;

-- 2. Point the existing Telur revenue mapping to the new detail account.
UPDATE business_revenue_mapping brm
SET
  account_mapping_strategy = 'FIXED_CODE',
  account_code = '4.3.01.05',
  account_code_prefix = NULL,
  metadata = brm.metadata || jsonb_build_object(
    'updated_by_migration', '019_enable_finished_goods_sales_accounting',
    'default_revenue_account_code', '4.3.01.05'
  )
FROM business_unit_category buc
WHERE brm.business_category_id = buc.id
  AND buc.code = 'PRODUKSI_BARANG_JADI'
  AND brm.label = 'Telur';

-- 3. Allow product stock movement from sales.
ALTER TABLE production_stock_movement
  DROP CONSTRAINT IF EXISTS production_stock_movement_source_check;

ALTER TABLE production_stock_movement
  ADD CONSTRAINT production_stock_movement_source_check
  CHECK (
    movement_source IN (
      'PRODUCTION_OUTPUT',
      'PRODUCTION_MATERIAL_USAGE',
      'ADJUSTMENT',
      'PRODUCT_SALE'
    )
  );

-- 4. Strengthen journal engine so each journal rule can use a different payload amount.
CREATE OR REPLACE FUNCTION post_template_transaction(
  _bum_desa_id UUID,
  _unit_usaha_id UUID,
  _template_code TEXT,
  _tanggal DATE,
  _payload JSONB,
  _created_by UUID DEFAULT NULL,
  _keterangan TEXT DEFAULT NULL
)
RETURNS TABLE (
  journal_header_id UUID,
  nomor_jurnal TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload JSONB;
  v_nominal NUMERIC(18,2);
  v_line_amount NUMERIC(18,2);
  v_template RECORD;
  v_rule RECORD;
  v_period_id UUID;
  v_journal_header_id UUID;
  v_nomor_jurnal TEXT;
  v_account_code TEXT;
  v_akun_id UUID;
  v_account_level account_level;
  v_rule_count INTEGER := 0;
  v_total_debit NUMERIC(18,2);
  v_total_kredit NUMERIC(18,2);
BEGIN
  v_payload := COALESCE(_payload, '{}'::jsonb);

  IF _bum_desa_id IS NULL THEN
    RAISE EXCEPTION 'BUMDes wajib diisi.';
  END IF;

  IF _unit_usaha_id IS NULL THEN
    RAISE EXCEPTION 'Unit usaha wajib diisi.';
  END IF;

  IF _template_code IS NULL OR BTRIM(_template_code) = '' THEN
    RAISE EXCEPTION 'Kode template wajib diisi.';
  END IF;

  IF _tanggal IS NULL THEN
    RAISE EXCEPTION 'Tanggal transaksi wajib diisi.';
  END IF;

  v_nominal := NULLIF(v_payload->>'nominal', '')::numeric;

  IF COALESCE(v_nominal, 0) <= 0 THEN
    v_nominal := NULLIF(v_payload->>'nominal_penjualan', '')::numeric;
  END IF;

  IF COALESCE(v_nominal, 0) <= 0 THEN
    RAISE EXCEPTION 'Nominal transaksi harus lebih besar dari 0.';
  END IF;

  PERFORM 1
  FROM bum_desa
  WHERE id = _bum_desa_id
    AND is_active = TRUE
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BUMDes tidak aktif, tidak ditemukan, atau sudah dihapus.';
  END IF;

  PERFORM 1
  FROM unit_usaha
  WHERE id = _unit_usaha_id
    AND bum_desa_id = _bum_desa_id
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit usaha tidak aktif atau tidak sesuai dengan BUMDes.';
  END IF;

  SELECT id
  INTO v_period_id
  FROM periode_akuntansi
  WHERE bum_desa_id = _bum_desa_id
    AND status = 'OPEN'
    AND _tanggal BETWEEN tanggal_mulai AND tanggal_selesai
  ORDER BY tanggal_mulai DESC
  LIMIT 1;

  IF v_period_id IS NULL THEN
    RAISE EXCEPTION 'Periode akuntansi terbuka untuk tanggal transaksi tidak ditemukan.';
  END IF;

  SELECT *
  INTO v_template
  FROM template_transaksi
  WHERE kode = _template_code
    AND status = 'ACTIVE'
  LIMIT 1;

  IF v_template.id IS NULL THEN
    RAISE EXCEPTION 'Template transaksi aktif tidak ditemukan.';
  END IF;

  v_nomor_jurnal :=
    'JT/' ||
    v_template.kode ||
    '/' ||
    TO_CHAR(CLOCK_TIMESTAMP(), 'YYYYMMDDHH24MISSMS') ||
    '/' ||
    UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6));

  INSERT INTO journal_header (
    bum_desa_id,
    unit_usaha_id,
    periode_akuntansi_id,
    template_transaksi_id,
    nomor_jurnal,
    tanggal,
    sumber,
    status,
    keterangan,
    created_by
  )
  VALUES (
    _bum_desa_id,
    _unit_usaha_id,
    v_period_id,
    v_template.id,
    v_nomor_jurnal,
    _tanggal,
    'TEMPLATE',
    'POSTED',
    COALESCE(_keterangan, v_payload->>'keterangan'),
    _created_by
  )
  RETURNING id INTO v_journal_header_id;

  FOR v_rule IN
    SELECT *
    FROM template_jurnal_rule
    WHERE template_transaksi_id = v_template.id
    ORDER BY urutan ASC, created_at ASC
  LOOP
    v_account_code := NULL;
    v_akun_id := NULL;
    v_account_level := NULL;
    v_line_amount := NULL;

    IF v_rule.amount_formula IS NULL OR BTRIM(v_rule.amount_formula) = '' THEN
      RAISE EXCEPTION 'Formula nominal belum tersedia untuk rule urutan %.', v_rule.urutan;
    END IF;

    IF v_rule.amount_formula !~ '^[A-Za-z_][A-Za-z0-9_]*$' THEN
      RAISE EXCEPTION 'Formula nominal tidak valid: %', v_rule.amount_formula;
    END IF;

    IF v_rule.amount_formula = 'nominal' THEN
      v_line_amount := v_nominal;
    ELSE
      v_line_amount := NULLIF(v_payload->>v_rule.amount_formula, '')::numeric;
    END IF;

    IF COALESCE(v_line_amount, 0) <= 0 THEN
      RAISE EXCEPTION 'Nilai untuk formula % harus lebih besar dari 0.', v_rule.amount_formula;
    END IF;

    IF v_rule.account_source = 'FIXED_CODE' THEN
      v_account_code := v_rule.account_code;
    ELSIF v_rule.account_source = 'INPUT_ACCOUNT' THEN
      v_account_code := v_payload->>v_rule.account_input_key;
    ELSIF v_rule.account_source = 'ACCOUNT_PREFIX' THEN
      RAISE EXCEPTION 'ACCOUNT_PREFIX membutuhkan resolver lanjutan dan belum bisa diposting langsung.';
    ELSE
      RAISE EXCEPTION 'Sumber akun tidak valid: %', v_rule.account_source;
    END IF;

    IF v_account_code IS NULL OR BTRIM(v_account_code) = '' THEN
      RAISE EXCEPTION 'Kode akun belum tersedia untuk rule urutan %.', v_rule.urutan;
    END IF;

    SELECT a.id, a.level
    INTO v_akun_id, v_account_level
    FROM akun a
    WHERE a.kode = v_account_code
      AND a.is_active = TRUE
      AND (a.bum_desa_id = _bum_desa_id OR a.bum_desa_id IS NULL)
    ORDER BY
      CASE
        WHEN a.bum_desa_id = _bum_desa_id THEN 0
        ELSE 1
      END
    LIMIT 1;

    IF v_akun_id IS NULL THEN
      RAISE EXCEPTION 'Akun % tidak ditemukan atau tidak aktif.', v_account_code;
    END IF;

    IF v_rule.account_must_be_detail = TRUE AND v_account_level <> 'D' THEN
      RAISE EXCEPTION 'Akun % harus berupa akun detail.', v_account_code;
    END IF;

    INSERT INTO journal_line (
      journal_header_id,
      akun_id,
      unit_usaha_id,
      debit,
      kredit,
      keterangan
    )
    VALUES (
      v_journal_header_id,
      v_akun_id,
      _unit_usaha_id,
      CASE WHEN v_rule.side = 'DEBIT' THEN v_line_amount ELSE 0 END,
      CASE WHEN v_rule.side = 'KREDIT' THEN v_line_amount ELSE 0 END,
      v_rule.rule_label
    );

    v_rule_count := v_rule_count + 1;
  END LOOP;

  IF v_rule_count = 0 THEN
    RAISE EXCEPTION 'Template % belum memiliki rule jurnal.', _template_code;
  END IF;

  SELECT
    COALESCE(SUM(debit), 0),
    COALESCE(SUM(kredit), 0)
  INTO v_total_debit, v_total_kredit
  FROM journal_line
  WHERE journal_line.journal_header_id = v_journal_header_id;

  IF v_total_debit <> v_total_kredit THEN
    RAISE EXCEPTION 'Jurnal tidak seimbang. Debit %, Kredit %.', v_total_debit, v_total_kredit;
  END IF;

  INSERT INTO audit_log (
    bum_desa_id,
    user_id,
    table_name,
    record_id,
    action,
    before_data,
    after_data
  )
  VALUES (
    _bum_desa_id,
    _created_by,
    'journal_header',
    v_journal_header_id,
    'POST_TEMPLATE_TRANSACTION',
    NULL,
    jsonb_build_object(
      'journal_header_id', v_journal_header_id,
      'nomor_jurnal', v_nomor_jurnal,
      'template_code', _template_code,
      'payload', v_payload,
      'total_debit', v_total_debit,
      'total_kredit', v_total_kredit
    )
  );

  RETURN QUERY
  SELECT v_journal_header_id, v_nomor_jurnal;
END;
$$;

-- 5. Create a reusable finished goods cash sale template.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM template_transaksi
    WHERE kode = 'T20'
      AND COALESCE(business_event_code, '') <> 'PRODUCTION_FINISHED_GOODS_CASH_SALE'
  ) THEN
    RAISE EXCEPTION 'Kode template T20 sudah dipakai untuk event lain.';
  END IF;
END $$;

INSERT INTO template_transaksi (
  kode,
  nama,
  kategori,
  deskripsi,
  status,
  user_facing_name,
  business_event_code,
  input_schema,
  sumber_regulasi,
  versi,
  sort_order,
  is_system_template,
  status_note
)
VALUES (
  'T20',
  'Penjualan Barang Jadi Tunai',
  'PENDAPATAN',
  'Mencatat penjualan tunai barang jadi sekaligus HPP dan pengurangan persediaan barang jadi.',
  'ACTIVE',
  'Penjualan Barang Jadi Tunai',
  'PRODUCTION_FINISHED_GOODS_CASH_SALE',
  '[
    {"key":"nominal_penjualan","label":"Nilai Penjualan","type":"number","required":true},
    {"key":"hpp","label":"Harga Pokok Penjualan","type":"number","required":true},
    {"key":"cash_account_code","label":"Akun Penerimaan","type":"account_code","required":true},
    {"key":"sales_revenue_account_code","label":"Akun Pendapatan Produk","type":"account_code","required":true}
  ]'::jsonb,
  'Sistem ERP BUMDes',
  1,
  200,
  true,
  NULL
)
ON CONFLICT (kode) DO UPDATE
SET
  nama = EXCLUDED.nama,
  kategori = EXCLUDED.kategori,
  deskripsi = EXCLUDED.deskripsi,
  status = EXCLUDED.status,
  user_facing_name = EXCLUDED.user_facing_name,
  business_event_code = EXCLUDED.business_event_code,
  input_schema = EXCLUDED.input_schema,
  sumber_regulasi = EXCLUDED.sumber_regulasi,
  versi = EXCLUDED.versi,
  sort_order = EXCLUDED.sort_order,
  is_system_template = EXCLUDED.is_system_template,
  status_note = EXCLUDED.status_note;

DELETE FROM template_jurnal_rule
WHERE template_transaksi_id = (
  SELECT id FROM template_transaksi WHERE kode = 'T20'
);

INSERT INTO template_jurnal_rule (
  template_transaksi_id,
  side,
  account_code,
  account_must_be_detail,
  amount_formula,
  urutan,
  rule_label,
  account_source,
  account_input_key,
  account_code_prefix,
  metadata
)
SELECT
  t.id,
  rule.side,
  rule.account_code,
  true,
  rule.amount_formula,
  rule.urutan,
  rule.rule_label,
  rule.account_source,
  rule.account_input_key,
  NULL,
  '{}'::jsonb
FROM template_transaksi t
CROSS JOIN (
  VALUES
    ('DEBIT'::rule_side, NULL::text, 'nominal_penjualan'::text, 1, 'Kas diterima dari penjualan barang jadi', 'INPUT_ACCOUNT'::text, 'cash_account_code'::text),
    ('KREDIT'::rule_side, NULL::text, 'nominal_penjualan'::text, 2, 'Pendapatan penjualan barang jadi', 'INPUT_ACCOUNT'::text, 'sales_revenue_account_code'::text),
    ('DEBIT'::rule_side, '5.2.01.01'::text, 'hpp'::text, 3, 'Harga pokok penjualan barang jadi', 'FIXED_CODE'::text, NULL::text),
    ('KREDIT'::rule_side, '1.1.05.04'::text, 'hpp'::text, 4, 'Persediaan barang jadi berkurang', 'FIXED_CODE'::text, NULL::text)
) AS rule(side, account_code, amount_formula, urutan, rule_label, account_source, account_input_key)
WHERE t.kode = 'T20';
