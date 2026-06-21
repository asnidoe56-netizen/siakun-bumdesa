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

    IF v_rule.amount_formula <> 'nominal' THEN
      RAISE EXCEPTION 'Formula nominal belum didukung: %', v_rule.amount_formula;
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
      CASE WHEN v_rule.side = 'DEBIT' THEN v_nominal ELSE 0 END,
      CASE WHEN v_rule.side = 'KREDIT' THEN v_nominal ELSE 0 END,
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