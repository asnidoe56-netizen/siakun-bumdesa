-- 010_align_template_rules_with_kepmen136_coa.sql
-- Menyelaraskan rule template transaksi inti setelah COA Kepmen 136 dimasukkan.

UPDATE template_jurnal_rule r
SET
  account_code = '6.1.02.01',
  rule_label = 'Beban Alat Tulis Kantor bertambah',
  metadata = COALESCE(r.metadata, '{}'::jsonb) || jsonb_build_object(
    'kepmen_136_account_name',
    'Beban Alat Tulis Kantor (ATK)'
  )
FROM template_transaksi t
WHERE r.template_transaksi_id = t.id
  AND t.kode = 'T17'
  AND r.urutan = 1
  AND r.side = 'DEBIT'
  AND r.account_source = 'FIXED_CODE';

UPDATE template_transaksi
SET
  user_facing_name = 'Beli Alat Tulis atau Barang Pakai Habis',
  business_event_code = 'BUY_CONSUMABLE_SUPPLIES',
  sumber_regulasi = 'Kepmendesa PDTT No. 136 Tahun 2022 - Bab IV.D.4',
  status_note = 'Diselaraskan dengan COA Kepmen 136: 6.1.02.01 Beban Alat Tulis Kantor (ATK).',
  updated_at = NOW()
WHERE kode = 'T17';