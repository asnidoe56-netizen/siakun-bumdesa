-- Seed akun sistem minimal untuk Template Transaksi Inti Fase 1.
-- Catatan: PRD menyebut bagan akun lengkap ada di Lampiran A terpisah.
-- Migration ini hanya menyiapkan akun inti agar rule template MVP tidak menggantung.

INSERT INTO akun (kode, nama, level, normal_balance, is_system)
SELECT '1', 'Aset', 'H', 'DEBIT', TRUE
WHERE NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '1');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '1.1', 'Aset Lancar', 'H', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '1'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '1.1');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '1.1.01', 'Kas dan Bank', 'H', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '1.1'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '1.1.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '1.1.01.01', 'Kas Tunai', 'D', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '1.1.01'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '1.1.01.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '1.1.01.02', 'Kas di Bank', 'D', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '1.1.01'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '1.1.01.02');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '1.1.99', 'Rekening Koran Antar Unit', 'H', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '1.1'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '1.1.99');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '1.1.99.01', 'RK Pusat', 'D', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '1.1.99'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '1.1.99.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '1.1.99.02', 'RK Unit', 'D', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '1.1.99'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '1.1.99.02');

INSERT INTO akun (kode, nama, level, normal_balance, is_system)
SELECT '2', 'Kewajiban', 'H', 'KREDIT', TRUE
WHERE NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '2');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '2.1', 'Kewajiban Jangka Pendek', 'H', 'KREDIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '2'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '2.1');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '2.1.01', 'Utang Usaha', 'H', 'KREDIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '2.1'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '2.1.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '2.1.01.01', 'Utang Usaha', 'D', 'KREDIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '2.1.01'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '2.1.01.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system)
SELECT '3', 'Ekuitas', 'H', 'KREDIT', TRUE
WHERE NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '3');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '3.1', 'Modal', 'H', 'KREDIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '3'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '3.1');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '3.1.01', 'Modal Desa atau Masyarakat', 'H', 'KREDIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '3.1'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '3.1.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '3.1.01.01', 'Penyertaan Modal Desa atau Masyarakat', 'D', 'KREDIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '3.1.01'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '3.1.01.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system)
SELECT '4', 'Pendapatan Usaha', 'H', 'KREDIT', TRUE
WHERE NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '4');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '4.1', 'Pendapatan Operasional', 'H', 'KREDIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '4'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '4.1');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '4.1.01', 'Pendapatan Usaha Unit', 'H', 'KREDIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '4.1'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '4.1.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '4.1.01.01', 'Pendapatan Usaha', 'D', 'KREDIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '4.1.01'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '4.1.01.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system)
SELECT '6', 'Beban-Beban Usaha', 'H', 'DEBIT', TRUE
WHERE NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '6');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '6.1', 'Beban Operasional', 'H', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '6'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '6.1');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '6.1.01', 'Beban Operasional Umum', 'H', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '6.1'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '6.1.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '6.1.01.01', 'Beban Operasional', 'D', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '6.1.01'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '6.1.01.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '6.1.02', 'Beban Gaji dan Tunjangan', 'H', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '6.1'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '6.1.02');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '6.1.02.01', 'Beban Gaji dan Tunjangan', 'D', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '6.1.02'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '6.1.02.01');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '6.1.03', 'Beban Perlengkapan', 'H', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '6.1'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '6.1.03');

INSERT INTO akun (kode, nama, level, normal_balance, is_system, parent_id)
SELECT '6.1.03.01', 'Beban Perlengkapan', 'D', 'DEBIT', TRUE, id
FROM akun
WHERE bum_desa_id IS NULL AND kode = '6.1.03'
  AND NOT EXISTS (SELECT 1 FROM akun WHERE bum_desa_id IS NULL AND kode = '6.1.03.01');

INSERT INTO template_transaksi (
  kode,
  nama,
  user_facing_name,
  business_event_code,
  kategori,
  deskripsi,
  input_schema,
  sumber_regulasi,
  versi,
  sort_order,
  status,
  is_system_template
)
VALUES
(
  'T01',
  'Terima Pendapatan Tunai',
  'Terima Pendapatan Tunai',
  'CASH_INCOME_RECEIPT',
  'Pendapatan',
  'Mencatat penerimaan pendapatan tunai tanpa menampilkan debit/kredit kepada operator.',
  $json$[
    {"key":"tanggal","label":"Tanggal","type":"date","required":true},
    {"key":"cash_account_code","label":"Kas/Bank Tujuan","type":"account_select","required":true,"account_prefix":"1.1.01","normal_balance":"DEBIT"},
    {"key":"income_account_code","label":"Jenis Pendapatan","type":"account_select","required":true,"account_prefix":"4","normal_balance":"KREDIT"},
    {"key":"nominal","label":"Nominal","type":"money","required":true},
    {"key":"keterangan","label":"Keterangan","type":"textarea","required":false}
  ]$json$::jsonb,
  'Bab IV.B.1',
  1,
  10,
  'ACTIVE',
  TRUE
),
(
  'T02',
  'Setor Tunai dari Kas ke Bank',
  'Setor Tunai dari Kas ke Bank',
  'CASH_TO_BANK_TRANSFER',
  'Kas dan Bank',
  'Memindahkan uang dari kas tunai ke rekening bank tanpa memengaruhi pendapatan atau beban.',
  $json$[
    {"key":"tanggal","label":"Tanggal","type":"date","required":true},
    {"key":"bank_account_code","label":"Rekening Bank Tujuan","type":"account_select","required":true,"account_prefix":"1.1.01","normal_balance":"DEBIT"},
    {"key":"cash_account_code","label":"Kas Tunai Sumber","type":"account_select","required":true,"account_prefix":"1.1.01","normal_balance":"DEBIT"},
    {"key":"nominal","label":"Nominal","type":"money","required":true},
    {"key":"keterangan","label":"Keterangan","type":"textarea","required":false}
  ]$json$::jsonb,
  'Bab IV.B.1',
  1,
  20,
  'ACTIVE',
  TRUE
),
(
  'T05',
  'Unit Usaha Menyetor Pendapatan ke Kantor Pusat',
  'Setor Pendapatan ke Kantor Pusat',
  'UNIT_REMIT_TO_CENTER',
  'Penyetoran ke Pusat',
  'Mencatat penyetoran kas atau bank dari unit usaha ke kantor pusat melalui akun RK.',
  $json$[
    {"key":"tanggal","label":"Tanggal","type":"date","required":true},
    {"key":"rk_pusat_account_code","label":"Akun RK Pusat","type":"account_select","required":true,"account_prefix":"1.1.99","normal_balance":"DEBIT"},
    {"key":"cash_or_bank_account_code","label":"Kas/Bank Sumber Unit","type":"account_select","required":true,"account_prefix":"1.1.01","normal_balance":"DEBIT"},
    {"key":"nominal","label":"Nominal","type":"money","required":true},
    {"key":"keterangan","label":"Keterangan","type":"textarea","required":false}
  ]$json$::jsonb,
  'Bab IV.B.3',
  1,
  50,
  'ACTIVE',
  TRUE
),
(
  'T06',
  'Beli Barang/Jasa Tunai',
  'Beli Barang/Jasa Tunai',
  'CASH_EXPENSE_PAYMENT',
  'Pengeluaran',
  'Mencatat pembayaran barang atau jasa tunai yang langsung menjadi beban.',
  $json$[
    {"key":"tanggal","label":"Tanggal","type":"date","required":true},
    {"key":"expense_account_code","label":"Jenis Beban","type":"account_select","required":true,"account_prefix":"6","normal_balance":"DEBIT"},
    {"key":"cash_or_bank_account_code","label":"Kas/Bank Sumber Dana","type":"account_select","required":true,"account_prefix":"1.1.01","normal_balance":"DEBIT"},
    {"key":"nominal","label":"Nominal","type":"money","required":true},
    {"key":"keterangan","label":"Keterangan","type":"textarea","required":false}
  ]$json$::jsonb,
  'Bab IV.C.1',
  1,
  60,
  'ACTIVE',
  TRUE
),
(
  'T08',
  'Bayar/Lunasi Utang Usaha',
  'Bayar/Lunasi Utang Usaha',
  'PAY_TRADE_PAYABLE',
  'Pengeluaran',
  'Mencatat pembayaran atau pelunasan utang usaha menggunakan kas atau bank.',
  $json$[
    {"key":"tanggal","label":"Tanggal","type":"date","required":true},
    {"key":"debt_account_code","label":"Utang yang Dibayar","type":"account_select","required":true,"account_prefix":"2","normal_balance":"KREDIT"},
    {"key":"cash_or_bank_account_code","label":"Kas/Bank Sumber Dana","type":"account_select","required":true,"account_prefix":"1.1.01","normal_balance":"DEBIT"},
    {"key":"nominal","label":"Nominal","type":"money","required":true},
    {"key":"keterangan","label":"Keterangan","type":"textarea","required":false}
  ]$json$::jsonb,
  'Bab IV.C.3',
  1,
  80,
  'ACTIVE',
  TRUE
),
(
  'T09',
  'Bayar Gaji dan Tunjangan',
  'Bayar Gaji dan Tunjangan',
  'PAY_SALARY_ALLOWANCE',
  'Pengeluaran',
  'Mencatat pembayaran gaji dan tunjangan karyawan menggunakan kas atau bank.',
  $json$[
    {"key":"tanggal","label":"Tanggal","type":"date","required":true},
    {"key":"salary_expense_account_code","label":"Jenis Beban Gaji","type":"account_select","required":true,"account_prefix":"6.1.02","normal_balance":"DEBIT"},
    {"key":"cash_or_bank_account_code","label":"Kas/Bank Sumber Dana","type":"account_select","required":true,"account_prefix":"1.1.01","normal_balance":"DEBIT"},
    {"key":"nominal","label":"Nominal","type":"money","required":true},
    {"key":"keterangan","label":"Keterangan","type":"textarea","required":false}
  ]$json$::jsonb,
  'Bab IV.D.1',
  1,
  90,
  'ACTIVE',
  TRUE
),
(
  'T17',
  'Beli Alat Tulis atau Barang Pakai Habis',
  'Beli Alat Tulis / Barang Pakai Habis',
  'BUY_CONSUMABLE_SUPPLIES',
  'Pengeluaran',
  'Mencatat pembelian perlengkapan atau barang pakai habis.',
  $json$[
    {"key":"tanggal","label":"Tanggal","type":"date","required":true},
    {"key":"cash_or_bank_account_code","label":"Kas/Bank Sumber Dana","type":"account_select","required":true,"account_prefix":"1.1.01","normal_balance":"DEBIT"},
    {"key":"nominal","label":"Nominal","type":"money","required":true},
    {"key":"keterangan","label":"Keterangan","type":"textarea","required":false}
  ]$json$::jsonb,
  'Bab IV.D.4',
  1,
  170,
  'ACTIVE',
  TRUE
),
(
  'T19',
  'Terima Modal dari Desa atau Masyarakat',
  'Terima Modal dari Desa atau Masyarakat',
  'CAPITAL_CONTRIBUTION_RECEIPT',
  'Modal',
  'Mencatat penerimaan penyertaan modal dari desa atau masyarakat.',
  $json$[
    {"key":"tanggal","label":"Tanggal","type":"date","required":true},
    {"key":"cash_or_bank_account_code","label":"Kas/Bank Tujuan","type":"account_select","required":true,"account_prefix":"1.1.01","normal_balance":"DEBIT"},
    {"key":"capital_account_code","label":"Sumber Modal","type":"account_select","required":true,"account_prefix":"3","normal_balance":"KREDIT"},
    {"key":"nominal","label":"Nominal","type":"money","required":true},
    {"key":"keterangan","label":"Keterangan","type":"textarea","required":false}
  ]$json$::jsonb,
  'Implikasi Bab III',
  1,
  190,
  'ACTIVE',
  TRUE
)
ON CONFLICT (kode)
DO UPDATE SET
  nama = EXCLUDED.nama,
  user_facing_name = EXCLUDED.user_facing_name,
  business_event_code = EXCLUDED.business_event_code,
  kategori = EXCLUDED.kategori,
  deskripsi = EXCLUDED.deskripsi,
  input_schema = EXCLUDED.input_schema,
  sumber_regulasi = EXCLUDED.sumber_regulasi,
  versi = EXCLUDED.versi,
  sort_order = EXCLUDED.sort_order,
  status = EXCLUDED.status,
  is_system_template = EXCLUDED.is_system_template,
  updated_at = NOW();

DELETE FROM template_jurnal_rule
WHERE template_transaksi_id IN (
  SELECT id
  FROM template_transaksi
  WHERE kode IN ('T01', 'T02', 'T05', 'T06', 'T08', 'T09', 'T17', 'T19')
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
SELECT id, 'DEBIT'::rule_side, NULL, TRUE, 'nominal', 1, 'Kas/Bank bertambah', 'INPUT_ACCOUNT', 'cash_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T01'
UNION ALL
SELECT id, 'KREDIT'::rule_side, NULL, TRUE, 'nominal', 2, 'Pendapatan bertambah', 'INPUT_ACCOUNT', 'income_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T01'
UNION ALL
SELECT id, 'DEBIT'::rule_side, NULL, TRUE, 'nominal', 1, 'Bank bertambah', 'INPUT_ACCOUNT', 'bank_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T02'
UNION ALL
SELECT id, 'KREDIT'::rule_side, NULL, TRUE, 'nominal', 2, 'Kas tunai berkurang', 'INPUT_ACCOUNT', 'cash_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T02'
UNION ALL
SELECT id, 'DEBIT'::rule_side, NULL, TRUE, 'nominal', 1, 'RK Pusat bertambah di buku unit', 'INPUT_ACCOUNT', 'rk_pusat_account_code', NULL, '{"requires_mirror_entry":true}'::jsonb
FROM template_transaksi WHERE kode = 'T05'
UNION ALL
SELECT id, 'KREDIT'::rule_side, NULL, TRUE, 'nominal', 2, 'Kas/Bank unit berkurang', 'INPUT_ACCOUNT', 'cash_or_bank_account_code', NULL, '{"requires_mirror_entry":true}'::jsonb
FROM template_transaksi WHERE kode = 'T05'
UNION ALL
SELECT id, 'DEBIT'::rule_side, NULL, TRUE, 'nominal', 1, 'Beban bertambah', 'INPUT_ACCOUNT', 'expense_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T06'
UNION ALL
SELECT id, 'KREDIT'::rule_side, NULL, TRUE, 'nominal', 2, 'Kas/Bank berkurang', 'INPUT_ACCOUNT', 'cash_or_bank_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T06'
UNION ALL
SELECT id, 'DEBIT'::rule_side, NULL, TRUE, 'nominal', 1, 'Utang usaha berkurang', 'INPUT_ACCOUNT', 'debt_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T08'
UNION ALL
SELECT id, 'KREDIT'::rule_side, NULL, TRUE, 'nominal', 2, 'Kas/Bank berkurang', 'INPUT_ACCOUNT', 'cash_or_bank_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T08'
UNION ALL
SELECT id, 'DEBIT'::rule_side, NULL, TRUE, 'nominal', 1, 'Beban gaji bertambah', 'INPUT_ACCOUNT', 'salary_expense_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T09'
UNION ALL
SELECT id, 'KREDIT'::rule_side, NULL, TRUE, 'nominal', 2, 'Kas/Bank berkurang', 'INPUT_ACCOUNT', 'cash_or_bank_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T09'
UNION ALL
SELECT id, 'DEBIT'::rule_side, '6.1.03.01', TRUE, 'nominal', 1, 'Beban perlengkapan bertambah', 'FIXED_CODE', NULL, NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T17'
UNION ALL
SELECT id, 'KREDIT'::rule_side, NULL, TRUE, 'nominal', 2, 'Kas/Bank berkurang', 'INPUT_ACCOUNT', 'cash_or_bank_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T17'
UNION ALL
SELECT id, 'DEBIT'::rule_side, NULL, TRUE, 'nominal', 1, 'Kas/Bank bertambah', 'INPUT_ACCOUNT', 'cash_or_bank_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T19'
UNION ALL
SELECT id, 'KREDIT'::rule_side, NULL, TRUE, 'nominal', 2, 'Modal bertambah', 'INPUT_ACCOUNT', 'capital_account_code', NULL, '{}'::jsonb
FROM template_transaksi WHERE kode = 'T19';

