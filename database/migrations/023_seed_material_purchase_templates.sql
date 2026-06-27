-- Seed accounting templates for material purchase.
-- T21: cash purchase of production material.
-- T22: credit purchase of production material.

DO $$
DECLARE
  v_t21_id uuid;
  v_t22_id uuid;
BEGIN
  SELECT id INTO v_t21_id
  FROM template_transaksi
  WHERE kode = 'T21'
  LIMIT 1;

  IF v_t21_id IS NULL THEN
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
      'T21',
      'Pembelian Bahan Produksi Tunai',
      'PRODUKSI',
      'Mencatat pembelian bahan baku atau komponen produksi secara tunai sehingga persediaan bahan bertambah dan kas/bank berkurang.',
      'ACTIVE',
      'Pembelian Bahan Produksi Tunai',
      'PRODUCTION_MATERIAL_CASH_PURCHASE',
      '[
        {"key":"tanggal","type":"date","label":"Tanggal","required":true},
        {"key":"inventory_account_code","type":"account_code","label":"Akun Persediaan Bahan","required":true},
        {"key":"cash_or_bank_account_code","type":"account_code","label":"Kas/Bank Sumber Dana","required":true},
        {"key":"nominal","type":"money","label":"Nilai Pembelian","required":true},
        {"key":"keterangan","type":"textarea","label":"Keterangan","required":false}
      ]'::jsonb,
      'Sistem ERP BUMDes',
      1,
      210,
      TRUE,
      'Template sistem untuk pembelian bahan produksi tunai.'
    )
    RETURNING id INTO v_t21_id;
  ELSE
    UPDATE template_transaksi
    SET
      nama = 'Pembelian Bahan Produksi Tunai',
      kategori = 'PRODUKSI',
      deskripsi = 'Mencatat pembelian bahan baku atau komponen produksi secara tunai sehingga persediaan bahan bertambah dan kas/bank berkurang.',
      status = 'ACTIVE',
      user_facing_name = 'Pembelian Bahan Produksi Tunai',
      business_event_code = 'PRODUCTION_MATERIAL_CASH_PURCHASE',
      sumber_regulasi = 'Sistem ERP BUMDes',
      sort_order = 210,
      is_system_template = TRUE,
      status_note = 'Template sistem untuk pembelian bahan produksi tunai.'
    WHERE id = v_t21_id;
  END IF;

  DELETE FROM template_jurnal_rule
  WHERE template_transaksi_id = v_t21_id;

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
  VALUES
    (
      v_t21_id,
      'DEBIT',
      NULL,
      TRUE,
      'nominal',
      1,
      'Persediaan bahan produksi bertambah',
      'INPUT_ACCOUNT',
      'inventory_account_code',
      NULL,
      '{}'::jsonb
    ),
    (
      v_t21_id,
      'KREDIT',
      NULL,
      TRUE,
      'nominal',
      2,
      'Kas/Bank berkurang untuk pembelian bahan',
      'INPUT_ACCOUNT',
      'cash_or_bank_account_code',
      NULL,
      '{}'::jsonb
    );

  SELECT id INTO v_t22_id
  FROM template_transaksi
  WHERE kode = 'T22'
  LIMIT 1;

  IF v_t22_id IS NULL THEN
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
      'T22',
      'Pembelian Bahan Produksi Kredit',
      'PRODUKSI',
      'Mencatat pembelian bahan baku atau komponen produksi secara kredit sehingga persediaan bahan bertambah dan utang usaha/supplier terbentuk.',
      'ACTIVE',
      'Pembelian Bahan Produksi Kredit',
      'PRODUCTION_MATERIAL_CREDIT_PURCHASE',
      '[
        {"key":"tanggal","type":"date","label":"Tanggal","required":true},
        {"key":"inventory_account_code","type":"account_code","label":"Akun Persediaan Bahan","required":true},
        {"key":"payable_account_code","type":"account_code","label":"Akun Utang Supplier","required":true},
        {"key":"nominal","type":"money","label":"Nilai Pembelian","required":true},
        {"key":"keterangan","type":"textarea","label":"Keterangan","required":false}
      ]'::jsonb,
      'Sistem ERP BUMDes',
      1,
      220,
      TRUE,
      'Template sistem untuk pembelian bahan produksi kredit.'
    )
    RETURNING id INTO v_t22_id;
  ELSE
    UPDATE template_transaksi
    SET
      nama = 'Pembelian Bahan Produksi Kredit',
      kategori = 'PRODUKSI',
      deskripsi = 'Mencatat pembelian bahan baku atau komponen produksi secara kredit sehingga persediaan bahan bertambah dan utang usaha/supplier terbentuk.',
      status = 'ACTIVE',
      user_facing_name = 'Pembelian Bahan Produksi Kredit',
      business_event_code = 'PRODUCTION_MATERIAL_CREDIT_PURCHASE',
      sumber_regulasi = 'Sistem ERP BUMDes',
      sort_order = 220,
      is_system_template = TRUE,
      status_note = 'Template sistem untuk pembelian bahan produksi kredit.'
    WHERE id = v_t22_id;
  END IF;

  DELETE FROM template_jurnal_rule
  WHERE template_transaksi_id = v_t22_id;

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
  VALUES
    (
      v_t22_id,
      'DEBIT',
      NULL,
      TRUE,
      'nominal',
      1,
      'Persediaan bahan produksi bertambah',
      'INPUT_ACCOUNT',
      'inventory_account_code',
      NULL,
      '{}'::jsonb
    ),
    (
      v_t22_id,
      'KREDIT',
      NULL,
      TRUE,
      'nominal',
      2,
      'Utang supplier bertambah dari pembelian bahan',
      'INPUT_ACCOUNT',
      'payable_account_code',
      NULL,
      '{}'::jsonb
    );
END $$;