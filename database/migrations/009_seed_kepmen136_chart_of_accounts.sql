-- 009_seed_kepmen136_chart_of_accounts.sql
-- Menyelaraskan chart of accounts dengan Bagan Akun Kepmendesa 136 Tahun 2022.
-- Catatan:
-- 1. Kepmen 136 memakai format kode X.X.XX.XX.
-- 2. Beberapa kode header dapat berulang pada level berbeda, sehingga unique constraint lama (bum_desa_id, kode)
--    tidak dapat dipertahankan untuk seluruh akun.
-- 3. Akun detail tetap dijaga unik per scope agar Journal Engine tidak ambigu.

ALTER TABLE akun
ADD COLUMN IF NOT EXISTS account_depth SMALLINT;

ALTER TABLE akun
ADD COLUMN IF NOT EXISTS is_kepmen_136 BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE akun
DROP CONSTRAINT IF EXISTS akun_bum_desa_id_kode_key;

DROP INDEX IF EXISTS akun_global_detail_kode_unique;
DROP INDEX IF EXISTS akun_tenant_detail_kode_unique;

CREATE INDEX IF NOT EXISTS idx_akun_scope_kode
ON akun (bum_desa_id, kode);

CREATE UNIQUE INDEX akun_global_detail_kode_unique
ON akun (kode)
WHERE bum_desa_id IS NULL
  AND level = 'D'
  AND is_active = TRUE;

CREATE UNIQUE INDEX akun_tenant_detail_kode_unique
ON akun (bum_desa_id, kode)
WHERE bum_desa_id IS NOT NULL
  AND level = 'D'
  AND is_active = TRUE;

DO $$
DECLARE
  account_row RECORD;
  existing_account_id UUID;
  mapped_level account_level;
  mapped_normal_balance normal_balance;
BEGIN
  FOR account_row IN
    SELECT *
    FROM (
      VALUES
        ('1.0.00.00', 'ASET', 'H', 1),
        ('1.1.01.00', 'Aset Lancar', 'H', 2),
        ('1.1.01.00', 'Kas', 'H', 3),
        ('1.1.01.01', 'Kas Tunai', 'D', 4),
        ('1.1.01.02', 'Kas di Bank BSI', 'D', 4),
        ('1.1.01.03', 'Kas di Bank Mandiri', 'D', 4),
        ('1.1.01.04', 'Kas di Bank BRI', 'D', 4),
        ('1.1.01.05', 'Kas di Bank BPD', 'D', 4),
        ('1.1.01.98', 'Kas Kecil (Petty Cash)', 'D', 4),
        ('1.1.02.00', 'Setara Kas', 'H', 3),
        ('1.1.02.01', 'Deposito <= 3 bulan', 'D', 4),
        ('1.1.02.99', 'Setara Kas Lainnya', 'D', 4),
        ('1.1.03.00', 'Piutang', 'H', 3),
        ('1.1.03.01', 'Piutang Usaha', 'D', 4),
        ('1.1.03.02', 'Piutang kepada Pegawai', 'D', 4),
        ('1.1.03.99', 'Piutang Lainnya', 'D', 4),
        ('1.1.04.00', 'Penyisihan Piutang', 'H', 3),
        ('1.1.04.01', 'Penyisihan Piutang Usaha Tak Tertagih', 'K', 4),
        ('1.1.04.02', 'Penyisihan Piutang kepada Pegawai Tak Tertagih', 'K', 4),
        ('1.1.04.99', 'Penyisihan Piutang Lainnya Tak Tertagih', 'D', 4),
        ('1.1.05.00', 'Persediaan', 'H', 3),
        ('1.1.05.01', 'Persediaan Barang Dagangan', 'D', 4),
        ('1.1.05.02', 'Persediaan Bahan Baku', 'D', 4),
        ('1.1.05.03', 'Persediaan Barang Dalam Proses', 'D', 4),
        ('1.1.05.04', 'Persediaan Barang Jadi', 'D', 4),
        ('1.1.06.00', 'Perlengkapan', 'H', 3),
        ('1.1.06.01', 'Alat Tulis Kantor (ATK)', 'D', 4),
        ('1.1.07.00', 'Pembayaran Dimuka', 'H', 3),
        ('1.1.07.01', 'Sewa Dibayar Dimuka', 'D', 4),
        ('1.1.07.02', 'Asuransi Dibayar Dimuka', 'D', 4),
        ('1.1.07.03', 'PPh 25', 'D', 4),
        ('1.1.07.04', 'PPN Masukan', 'D', 4),
        ('1.1.98.00', 'Aset Lancar Lainnya', 'H', 3),
        ('1.1.98.99', 'Aset Lancar Lainnya', 'D', 4),
        ('1.1.99.00', 'RK Unit Usaha', 'H', 3),
        ('1.1.99.01', 'RK Unit Wisata', 'K', 4),
        ('1.1.99.02', 'RK Unit Restoran', 'K', 4),
        ('1.1.99.03', 'RK Unit Minimart Desa', 'K', 4),
        ('1.1.99.04', 'RK Unit Gedung Serbaguna', 'K', 4),
        ('1.1.99.05', 'RK Unit Simpan Pinjam', 'K', 4),
        ('1.1.99.06', 'RK Unit Pengelolaan Air Bersih', 'K', 4),
        ('1.1.99.07', 'RK Unit Pengelolaan Sampah', 'K', 4),
        ('1.2.00.00', 'Investasi', 'H', 2),
        ('1.2.01.00', 'Investasi', 'H', 3),
        ('1.2.01.01', 'Deposito > 3 bulan', 'D', 4),
        ('1.2.01.99', 'Investasi Lainnya', 'D', 4),
        ('1.3.00.00', 'Aset Tetap', 'H', 2),
        ('1.3.01.00', 'Tanah', 'H', 3),
        ('1.3.01.01', 'Tanah', 'D', 4),
        ('1.3.02.00', 'Kendaraan', 'H', 3),
        ('1.3.02.01', 'Kendaraan', 'D', 4),
        ('1.3.03.00', 'Peralatan dan Mesin', 'H', 3),
        ('1.3.03.01', 'Peralatan dan Mesin', 'D', 4),
        ('1.3.04.00', 'Meubelair', 'H', 3),
        ('1.3.04.01', 'Meubelair', 'D', 4),
        ('1.3.05.00', 'Gedung dan Bangunan', 'H', 3),
        ('1.3.05.01', 'Gedung dan Bangunan', 'D', 4),
        ('1.3.06.00', 'Konstruksi Dalam Pengerjaan', 'H', 3),
        ('1.3.06.01', 'Konstruksi Dalam Pengerjaan', 'D', 4),
        ('1.3.07.00', 'Akumulasi Penyusutan Aset Tetap', 'H', 3),
        ('1.3.07.01', 'Akumulasi Penyusutan Kendaraan', 'K', 4),
        ('1.3.07.02', 'Akumulasi Penyusutan Peralatan dan Mesin', 'K', 4),
        ('1.3.07.03', 'Akumulasi Penyusutan Meubelair', 'K', 4),
        ('1.3.07.04', 'Akumulasi Penyusutan Gedung dan Bangunan', 'K', 4),
        ('1.3.99.00', 'Aset Tetap Lainnya', 'H', 3),
        ('1.3.99.99', 'Aset Tetap Lainnya', 'D', 4),
        ('1.4.00.00', 'Aset takberwujud', 'H', 2),
        ('1.4.01.00', 'Aset takberwujud', 'H', 3),
        ('1.4.01.01', 'Software', 'D', 4),
        ('1.4.01.02', 'Patent', 'D', 4),
        ('1.4.01.03', 'Trademark', 'D', 4),
        ('1.4.02.00', 'Amortisasi Aset takberwujud', 'H', 3),
        ('1.4.02.01', 'Amortisasi Aset takberwujud', 'D', 4),
        ('1.9.00.00', 'Aset Lain-lain', 'H', 2),
        ('1.90.1.00', 'Aset Lain-lain', 'H', 3),
        ('1.9.01.01', 'Aset Lain-lain', 'D', 4),
        ('1.9.02.00', 'Akumulasi Penyusutan Aset Lain-lain', 'H', 3),
        ('1.9.02.01', 'Akumulasi Penyusutan Aset Lain-lain', 'D', 4),
        ('2.0.00.00', 'KEWAJIBAN', 'H', 1),
        ('2.1.00.00', 'Kewajiban Jangka Pendek', 'H', 2),
        ('2.1.01.00', 'Utang Usaha', 'H', 3),
        ('2.1.01.01', 'Utang Usaha', 'K', 4),
        ('2.1.02.00', 'Utang Pajak', 'H', 3),
        ('2.1.02.01', 'PPN Keluaran', 'K', 4),
        ('2.1.02.02', 'PPh 21', 'K', 4),
        ('2.1.02.03', 'PPh 23', 'K', 4),
        ('2.1.02.04', 'PPh 29', 'K', 4),
        ('2.1.03.00', 'Utang Gaji/Upah dan Tunjangan', 'H', 3),
        ('2.1.03.01', 'Utang Gaji dan Tunjangan', 'K', 4),
        ('2.1.03.02', 'Utang Gaji/Upah Karyawan', 'K', 4),
        ('2.1.04.00', 'Utang Utilitas', 'H', 3),
        ('2.1.04.01', 'Utang Listrik', 'K', 4),
        ('2.1.04.02', 'Utang Telepon/Internet', 'K', 4),
        ('2.1.04.93', 'Utang Utilitas Lainnya', 'K', 4),
        ('2.1.05.00', 'Utang kepada Pihak Ketiga Jk. Pendek', 'H', 3),
        ('2.1.05.01', 'Utang kepada Pihak Ketiga Jk. Pendek', 'K', 4),
        ('2.1.05.99', 'Utang kepada Pihak Ketiga Jk. Pendek Lainnya', 'K', 4),
        ('2.1.99.00', 'Utang Jangka Pendek Lainnya', 'H', 3),
        ('2.1.09.99', 'Utang Jangka Pendek Lainnya', 'K', 4),
        ('2.2.00.00', 'Kewajiban Jangka Panjang', 'H', 2),
        ('2.2.01.00', 'Utang Ke Bank', 'H', 3),
        ('2.2.01.01', 'Utang Ke Bank', 'K', 4),
        ('2.2.02.00', 'Utang kepada Pihak Ketiga Jk. Panjang', 'H', 3),
        ('2.2.02.01', 'Utang kepada Pihak Ketiga Jk. Panjang', 'K', 4),
        ('2.2.99.00', 'Utang Jangka Panjang Lainnya', 'H', 3),
        ('2.2.99.99', 'Utang Jangka Panjang Lainnya', 'K', 4),
        ('3.0.00.00', 'EKUITAS', 'H', 1),
        ('3.1.00.00', 'Modal Pemilik', 'H', 2),
        ('3.1.01.00', 'Penyertaan Modal Desa', 'H', 3),
        ('3.1.01.01', 'Penyertaan Modal Desa A', 'K', 4),
        ('3.1.01.02', 'Penyertaan Modal Desa B', 'K', 4),
        ('3.1.01.03', 'Penyertaan Modal Desa C', 'K', 4),
        ('3.1.01.04', 'Penyertaan Modal Desa D', 'K', 4),
        ('3.1.02.00', 'Penyertaan Modal Masyarakat', 'H', 3),
        ('3.1.02.01', 'Penyertaan Modal Masyarakat Desa A', 'K', 4),
        ('3.1.02.02', 'Penyertaan Modal Masyarakat Desa B', 'K', 4),
        ('3.1.02.03', 'Penyertaan Modal Masyarakat Desa C', 'K', 4),
        ('3.1.02.04', 'Penyertaan Modal Masyarakat Desa D', 'K', 4),
        ('3.2.00.00', 'Pengambilan oleh Pemilik', 'H', 2),
        ('3.2.01.00', 'Bagi Hasil Penyertaan Modal Desa', 'H', 3),
        ('3.2.01.01', 'Bagi Hasil Penyertaan Modal Desa', 'D', 4),
        ('3.2.01.02', 'Bagi Hasil Penyertaan Modal Desa A', 'D', 4),
        ('3.2.01.03', 'Bagi Hasil Penyertaan Modal Desa B', 'D', 4),
        ('3.2.01.04', 'Bagi Hasil Penyertaan Modal Desa C', 'D', 4),
        ('3.2.02.00', 'Bagi Hasil Penyertaan Modal Masyarakat', 'H', 3),
        ('3.2.02.01', 'Bagi Hasil Penyertaan Modal Masyarakat', 'D', 4),
        ('3.2.02.02', 'Bagi Hasil Penyertaan Modal Masyarakat Desa A', 'D', 4),
        ('3.2.02.03', 'Bagi Hasil Penyertaan Modal Masyarakat Desa B', 'D', 4),
        ('3.2.02.04', 'Bagi Hasil Penyertaan Modal Masyarakat Desa C', 'D', 4),
        ('3.3.00.00', 'Saldo Laba', 'H', 2),
        ('3.3.01.00', 'Saldo Laba', 'H', 3),
        ('3.3.01.01', 'Saldo Laba Tidak Dicadangkan', 'K', 4),
        ('3.3.01.02', 'Saldo Laba Dicadangkan untuk Pembelian Aset Tetap', 'K', 4),
        ('3.3.01.03', 'Saldo Laba Dicadangkan untuk Pembayaran Utang Jangka Panjang', 'K', 4),
        ('3.4.00.00', 'Modal Donasi/Sumbangan', 'H', 2),
        ('3.4.01.00', 'Modal Donasi/Sumbangan', 'H', 3),
        ('3.4.01.01', 'Modal Donasi/Sumbangan', 'K', 4),
        ('3.8.00.00', 'RK Pusat', 'H', 3),
        ('3.8.01.01', 'RK Pusat', 'D', 4),
        ('3.9.00.00', 'Ikhtisar Laba Rugi', 'H', 2),
        ('3.9.01.00', 'Ikhtisar Laba Rugi', 'H', 3),
        ('3.9.01.01', 'Ikhtisar Laba Rugi', 'K', 4),
        ('4.0.00.00', 'PENDAPATAN USAHA', 'H', 1),
        ('4.1.00.00', 'Pendapatan Jasa', 'H', 2),
        ('4.1.01.00', 'Pendapatan Wisata', 'H', 3),
        ('4.1.01.01', 'Pendapatan Tiket', 'K', 4),
        ('4.1.01.02', 'Pendapatan Wahana', 'K', 4),
        ('4.1.01.03', 'Pendapatan Paket Wisata', 'K', 4),
        ('4.1.02.00', 'Pendapatan Pengelolaan Air Bersih', 'H', 3),
        ('4.1.02.01', 'Pendapatan Pengelolaan Air Bersih', 'K', 4),
        ('4.1.03.00', 'Pendapatan Pengelolaan Sampah', 'H', 3),
        ('4.1.03.01', 'Pendapatan Pengelolaan Sampah', 'K', 4),
        ('4.1.04.00', 'Pendapatan Sewa', 'H', 3),
        ('4.1.04.01', 'Pendapatan Sewa Tempat Outbound', 'K', 4),
        ('4.1.04.02', 'Pendapatan Sewa Tempat untuk Toko/Kios', 'K', 4),
        ('4.1.04.03', 'Pendapatan Sewa Gedung', 'K', 4),
        ('4.1.04.04', 'Pendapatan Sewa Mobil', 'K', 4),
        ('4.1.04.05', 'Pendapatan Sewa Peralatan Gedung', 'K', 4),
        ('4.1.04.99', 'Pendapatan Sewa Lainnya', 'K', 4),
        ('4.1.05.00', 'Pendapatan Jasa Pelayanan', 'H', 3),
        ('4.1.05.01', 'Pendapatan Jasa Pembayaran Listrik', 'K', 4),
        ('4.1.05.99', 'Pendapatan Jasa Pelayanan lainnya', 'K', 4),
        ('4.1.06.00', 'Pendapatan Transportasi', 'H', 3),
        ('4.1.06.01', 'Pendapatan Transportasi', 'K', 4),
        ('4.1.07.00', 'Pendapatan Parkir', 'H', 3),
        ('4.1.07.01', 'Pendapatan Parkir Mobil', 'K', 4),
        ('4.1.07.02', 'Pendapatan Parkir Motor', 'K', 4),
        ('4.1.08.00', 'Pendapatan Simpan Pinjam', 'H', 3),
        ('4.1.08.01', 'Pendapatan Simpan Pinjam', 'K', 4),
        ('4.1.09.00', 'Pendapatan Pelatihan', 'H', 3),
        ('4.1.09.01', 'Pendapatan Pelatihan', 'K', 4),
        ('4.1.10.00', 'Pendapatan Penginapan/Homestay', 'H', 3),
        ('4.1.10.01', 'Pendapatan Homestay', 'K', 4),
        ('4.1.11.00', 'Pendapatan Komisi', 'H', 3),
        ('4.1.11.01', 'Pendapata Komisi', 'K', 4),
        ('4.2.00.00', 'Pendapatan Penjualan Barang Dagangan', 'H', 2),
        ('4.2.01.00', 'Pendapatan Penjualan Barang Dagangan', 'H', 3),
        ('4.2.01.01', 'Pendapatan Penjualan Makanan/Minuman', 'K', 4),
        ('4.2.01.02', 'Pendapatan Penjualan Pakaian/Kaos/Jaket', 'K', 4),
        ('4.2.01.03', 'Pendapatan Penjualan Hasil Kerajinan/Suvenir', 'K', 4),
        ('4.2.01.04', 'Pendapatan Penjualan Buku', 'K', 4),
        ('4.2.01.05', 'Pendapatan Penjualan Biji Kopi', 'K', 4),
        ('4.2.01.06', 'Pendapatan Penjualan Bensin', 'K', 4),
        ('4.2.01.99', 'Diskon Penjualan Barang Dagangan', 'K', 4),
        ('4.3.00.00', 'Pendapatan Penjualan Barang Jadi', 'H', 2),
        ('4.3.01.00', 'Pendapatan Penjualan Barang Jadi', 'H', 3),
        ('4.3.01.01', 'Pendapatan Katering', 'K', 4),
        ('4.3.01.02', 'Pendapatan Restoran', 'K', 4),
        ('4.3.01.03', 'Pendapatan Kopi', 'K', 4),
        ('4.3.01.04', 'Diskon Penjualan Barang Jadi', 'K', 4),
        ('5.0.00.00', 'HARGA POKOK PRODUKSI DAN PENJUALAN', 'H', 1),
        ('5.1.00.00', 'Harga Pokok Penjualan Barang Dagangan', 'H', 2),
        ('5.1.01.00', 'Harga Pokok Penjualan Barang Dagangan', 'H', 3),
        ('5.1.01.01', 'Harga Pokok Penjualan Barang Dagangan', 'D', 4),
        ('5.2.00.00', 'Harga Pokok Penjualan Barang Jadi', 'H', 2),
        ('5.2.01.00', 'Harga Pokok Penjualan Barang Jadi', 'H', 3),
        ('5.2.01.01', 'Harga Pokok Penjualan Barang Jadi', 'D', 4),
        ('5.3.00.00', 'Harga Pokok Produksi', 'H', 2),
        ('5.3.01.00', 'Harga Pokok Produksi', 'H', 3),
        ('5.3.01.01', 'Harga Pokok Produksi', 'D', 4),
        ('6.0.00.00', 'BEBAN-BEBAN USAHA', 'H', 1),
        ('6.1.00.00', 'Beban Administrasi dan Umum', 'H', 2),
        ('6.1.01.00', 'Beban Pegawai Bagian Administrasi Umum', 'H', 3),
        ('6.1.01.01', 'Beban Gaji dan Tunjangan Bag. Adum', 'D', 4),
        ('6.1.01.02', 'Beban Honor Lembur Bag. Adum', 'D', 4),
        ('6.1.01.03', 'Beban Honor Narasumber', 'D', 4),
        ('6.1.01.04', 'Beban Insentif (Bonus) Bag. Adum', 'D', 4),
        ('6.1.01.05', 'Beban Komisi Bag. Adum', 'D', 4),
        ('6.1.01.06', 'Beban Seragam Pegawai Bag. Adum', 'D', 4),
        ('6.1.01.07', 'Beban Penguatan SDM', 'D', 4),
        ('6.1.01.99', 'Beban Pegawai Bag. Adum Lainnya', 'D', 4),
        ('6.1.02.00', 'Beban Perlengkapan', 'H', 3),
        ('6.1.02.01', 'Beban Alat Tulis Kantor (ATK)', 'D', 4),
        ('6.1.02.02', 'Beban Foto Copy', 'D', 4),
        ('6.1.02.03', 'Beban Konsumsi Rapat', 'D', 4),
        ('6.1.02.04', 'Beban Cetak dan Dekorasi', 'D', 4),
        ('6.1.02.99', 'Beban Perlengkapan Lainnya', 'D', 4),
        ('6.1.03.00', 'Beban Pemeliharaan dan Perbaikan', 'H', 3),
        ('6.1.03.01', 'Beban Pemeliharaan dan Perbaikan', 'D', 4),
        ('6.1.04.00', 'Beban Utilitas', 'H', 3),
        ('6.1.04.01', 'Beban Listrik', 'D', 4),
        ('6.1.04.02', 'Beban Telepon/Internet', 'D', 4),
        ('6.1.04.99', 'Beban Utilitas Lainnya', 'D', 4),
        ('6.1.05.00', 'Beban Sewa dan Asuransi', 'H', 3),
        ('6.1.05.01', 'Beban Sewa', 'D', 4),
        ('6.1.05.02', 'Beban Asuransi', 'D', 4),
        ('6.1.06.00', 'Beban Kebersihan dan Keamanan', 'H', 3),
        ('6.1.06.01', 'Beban Kebersihan', 'D', 4),
        ('6.1.06.02', 'Beban Keamanan', 'D', 4),
        ('6.1.07.00', 'Beban Penyisihan dan Penyusutan/Amortisasi', 'H', 3),
        ('6.1.07.01', 'Beban Penyisihan Piutang Tak Tertagih', 'D', 4),
        ('6.1.07.02', 'Beban Penyusutan Kendaraan', 'D', 4),
        ('6.1.07.03', 'Beban Penyusutan Peralatan dan Mesin', 'D', 4),
        ('6.1.07.04', 'Beban Penyusutan Meubelair', 'D', 4),
        ('6.1.07.05', 'Beban Penyusutan Gedung dan Bangunan', 'D', 4),
        ('6.1.07.06', 'Beban Amortisasi Aset takberwujud', 'D', 4),
        ('6.1.99.00', 'Beban Administrasi dan Umum Lainnya', 'H', 3),
        ('6.1.99.01', 'Beban Parkir', 'D', 4),
        ('6.1.99.02', 'Beban Audit', 'D', 4),
        ('6.1.99.03', 'Beban Perjalanan Dinas', 'D', 4),
        ('6.1.99.04', 'Beban Transportasi', 'D', 4),
        ('6.1.99.05', 'Beban Jamuan Tamu', 'D', 4),
        ('6.1.99.99', 'Beban Administrasi dan Umum Lainnya', 'D', 4),
        ('6.2.00.00', 'Beban Operasional', 'H', 2),
        ('6.2.01.00', 'Beban Pegawai Bagian Operasional', 'H', 3),
        ('6.2.01.01', 'Beban Gaji/Upah Bag. Operasional', 'D', 4),
        ('6.2.01.02', 'Beban Uang Makan Bag. Operasional', 'D', 4),
        ('6.2.02.00', 'Beban Pemeliharaan dan Perbaikan', 'H', 3),
        ('6.2.02.01', 'Beban Pemeliharaan Wahana', 'D', 4),
        ('6.2.02.02', 'Beban Perbaikan dan Renovasi', 'D', 4),
        ('6.2.03.00', 'Beban Keamanan', 'H', 3),
        ('6.2.03.01', 'Beban Tim SAR', 'D', 4),
        ('6.2.03.02', 'Beban P3K', 'D', 4),
        ('6.2.99.00', 'Beban Operasional Lainnya', 'H', 3),
        ('6.2.99.01', 'Beban Komunikasi', 'D', 4),
        ('6.2.99.02', 'Beban Sewa Lokasi', 'D', 4),
        ('6.2.99.03', 'Beban Pakan Ikan', 'D', 4),
        ('6.2.99.99', 'Beban Operasional Lainnya', 'D', 4),
        ('6.3.00.00', 'Beban Pemasaran', 'H', 2),
        ('6.3.01.00', 'Beban Pegawai Bagian Pemasaran', 'H', 3),
        ('6.3.01.01', 'Beban Gaji/Upah Bag. Pemasaran', 'D', 4),
        ('6.3.01.02', 'Beban Insentif (Bonus) Bag. Pemasaran', 'D', 4),
        ('6.3.01.03', 'Beban Seragam Pegawai Bag. Pemasaran', 'D', 4),
        ('6.3.02.00', 'Beban Iklan dan Promosi', 'H', 3),
        ('6.3.02.01', 'Beban Iklan', 'D', 4),
        ('6.3.02.02', 'Beban Promosi wartawan', 'D', 4),
        ('6.3.02.03', 'Beban Dana Sosial', 'D', 4),
        ('6.3.99.00', 'Beban Pemasaran Lainnya', 'H', 3),
        ('6.3.99.99', 'Beban Pemasaran Lainnya', 'D', 4),
        ('7.0.00.00', 'PENDAPATAN DAN BEBAN LAIN-LAIN', 'H', 1),
        ('7.1.00.00', 'Pendapatan Lain-lain', 'H', 2),
        ('7.1.01.00', 'Pendapatan dari Bank', 'H', 3),
        ('7.1.01.01', 'Pendapatan Bunga Bank', 'K', 4),
        ('7.1.01.02', 'Pendapatan Fee Agen BNI 46', 'K', 4),
        ('7.1.02.00', 'Pendapatan Dividen', 'H', 3),
        ('7.1.02.01', 'Pendapatan Dividen', 'K', 4),
        ('7.1.03.00', 'Pendapatan Denda', 'H', 3),
        ('7.1.03.01', 'Pendapatan Denda', 'K', 4),
        ('7.1.04.00', 'Pendapatan Iklan', 'H', 3),
        ('7.1.04.01', 'Pendapatan Iklan', 'K', 4),
        ('7.1.05.00', 'Pendapatan Penjualan Aset Tetap', 'H', 3),
        ('7.1.05.01', 'Keuntungan Penjualan Aset Tetap', 'K', 4),
        ('7.1.99.00', 'Pendapatan Lain-lain lainnya', 'H', 3),
        ('7.1.99.99', 'Pendapatan Lain-lain lainnya', 'K', 4),
        ('7.2.00.00', 'Beban Lain-lain', 'H', 2),
        ('7.2.01.00', 'Beban Bank', 'H', 3),
        ('7.2.01.01', 'Beban Administrasi Bank', 'D', 4),
        ('7.2.02.00', 'Beban Bunga', 'H', 3),
        ('7.2.02.01', 'Beban Bunga', 'D', 4),
        ('7.2.03.00', 'Beban Denda', 'H', 3),
        ('7.2.03.01', 'Beban Denda', 'D', 4),
        ('7.2.04.00', 'Beban Penjualan Aset Tetap', 'H', 3),
        ('7.2.04.01', 'Kerugian Penjualan Aset Tetap', 'D', 4),
        ('7.2.99.00', 'Beban Lain-lain Lainnya', 'H', 3),
        ('7.2.99.99', 'Beban Lain-lain lainnya', 'D', 4),
        ('7.3.00.00', 'Beban Pajak', 'H', 2),
        ('7.3.01.00', 'Beban Pajak', 'H', 3),
        ('7.3.01.01', 'Beban Pajak Air Permukaan', 'D', 4),
        ('7.3.01.02', 'Beban Pajak Bunga Bank', 'D', 4),
        ('7.3.01.03', 'Beban Pajak Daerah', 'D', 4),
        ('7.3.01.04', 'Beban Pajak Hiburan', 'D', 4),
        ('7.3.01.05', 'Beban Pajak Reklame', 'D', 4),
        ('7.3.01.06', 'Beban PPh 21', 'D', 4),
        ('7.3.01.07', 'Beban PPh 23', 'D', 4),
        ('7.3.01.08', 'Beban PPh 25', 'D', 4),
        ('7.3.01.09', 'Beban PPh 29', 'D', 4),
        ('7.3.01.10', 'Beban PPh Final', 'D', 4),
        ('7.3.01.99', 'Beban Pajak Lainnya', 'D', 4)
    ) AS source_accounts(kode, nama, hd_marker, depth)
  LOOP
    mapped_level :=
      CASE
        WHEN account_row.hd_marker = 'H' THEN 'H'::account_level
        ELSE 'D'::account_level
      END;

    mapped_normal_balance :=
      CASE
        WHEN account_row.hd_marker = 'K' THEN 'KREDIT'::normal_balance
        WHEN account_row.hd_marker = 'D' THEN 'DEBIT'::normal_balance
        WHEN account_row.kode LIKE '1.%'
          OR account_row.kode LIKE '5.%'
          OR account_row.kode LIKE '6.%'
          OR account_row.kode LIKE '7.2.%'
          OR account_row.kode LIKE '7.3.%'
        THEN 'DEBIT'::normal_balance
        ELSE 'KREDIT'::normal_balance
      END;

    existing_account_id := NULL;

    IF mapped_level = 'D' THEN
      SELECT id
      INTO existing_account_id
      FROM akun
      WHERE bum_desa_id IS NULL
        AND kode = account_row.kode
        AND level = 'D'
      ORDER BY is_kepmen_136 DESC, created_at ASC
      LIMIT 1;
    ELSE
      SELECT id
      INTO existing_account_id
      FROM akun
      WHERE bum_desa_id IS NULL
        AND kode = account_row.kode
        AND account_depth = account_row.depth
        AND nama = account_row.nama
        AND level = 'H'
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;

    IF existing_account_id IS NULL THEN
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
        NULL,
        account_row.kode,
        account_row.nama,
        mapped_level,
        mapped_normal_balance,
        TRUE,
        TRUE,
        account_row.depth,
        TRUE
      );
    ELSE
      UPDATE akun
      SET
        nama = account_row.nama,
        level = mapped_level,
        normal_balance = mapped_normal_balance,
        is_system = TRUE,
        is_active = TRUE,
        account_depth = account_row.depth,
        is_kepmen_136 = TRUE,
        updated_at = NOW()
      WHERE id = existing_account_id;
    END IF;
  END LOOP;

  UPDATE akun
  SET
    is_active = FALSE,
    updated_at = NOW()
  WHERE bum_desa_id IS NULL
    AND is_system = TRUE
    AND is_kepmen_136 = FALSE;
END;
$$;