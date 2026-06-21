# WORKFLOW KLASIFIKASI UNIT USAHA BERBASIS COA KEPMEN 136

<!-- Paste dokumen workflow di bawah bagian ini. -->
# WORKFLOW KLASIFIKASI UNIT USAHA BERBASIS COA KEPMEN 136

## 1. Tujuan Dokumen

Dokumen ini menjadi acuan kerja dalam pengembangan SiAkun BUM Desa agar implementasi modul unit usaha berjalan terstruktur, bertahap, dan tetap sesuai COA Kepmen 136.

Tujuan utama:

1. COA Kepmen 136 menjadi sumber kebenaran akuntansi.
2. Operator unit tidak dibebani memilih akun COA mentah.
3. Operator bekerja dengan istilah bisnis sesuai jenis unit usaha.
4. Sistem menerjemahkan pilihan bisnis menjadi akun COA Kepmen 136.
5. Journal Engine membuat jurnal otomatis.
6. Laporan tetap mengikuti struktur Kepmen 136.

---

## 2. Prinsip Utama

Aplikasi tidak menyederhanakan Kepmen 136 dengan menghapus COA.

Aplikasi menyederhanakan pengalaman operator melalui layer mapping:

```text
Bahasa Unit Usaha
→ Mapping Bisnis
→ COA Kepmen 136
→ Journal Engine
→ Laporan Kepmen 136
```

Operator tidak perlu melihat debit/kredit.

Operator juga tidak ideal jika harus memilih akun seperti:

```text
4.1.01.01 Pendapatan Tiket
4.1.01.02 Pendapatan Wahana
4.2.01.01 Pendapatan Penjualan Makanan/Minuman
```

Yang seharusnya dilihat operator adalah istilah bisnis:

```text
Tiket Masuk
Wahana
Paket Wisata
Penjualan Makanan/Minuman
Penjualan Suvenir
Katering
Restoran
```

---

## 3. Alur Arsitektur Unit Usaha

```text
Unit Usaha
→ Kategori Unit Usaha
→ Sidebar Unit
→ Menu Transaksi
→ Form Bisnis
→ Mapping Bisnis ke Akun Kepmen 136
→ Journal Engine
→ Laporan Unit
→ Konsolidasi BUMDes
```

Setiap jenis unit usaha dapat memiliki sidebar, menu, rules, dan form berbeda.

---

## 4. Klasifikasi Kategori Unit Usaha

### 4.1 JASA_WISATA

Contoh usaha:

* Objek wisata desa
* Tiket masuk
* Wahana
* Paket wisata
* Outbound
* Pemandian
* Pantai
* Wisata alam

Mapping pendapatan:

```text
Tiket Masuk   → 4.1.01.01 Pendapatan Tiket
Wahana        → 4.1.01.02 Pendapatan Wahana
Paket Wisata  → 4.1.01.03 Pendapatan Paket Wisata
```

Sidebar awal:

```text
Dashboard
Catat Pendapatan
Setor Kas/Bank
Biaya Operasional
Laporan Unit
```

Rules awal:

```text
Terima Pendapatan Tiket Tunai
Terima Pendapatan Wahana Tunai
Terima Pendapatan Paket Wisata Tunai
Setor Kas ke Bank
Beli Perlengkapan / ATK
Biaya Operasional Wisata
```

---

### 4.2 JASA_AIR_BERSIH

Contoh usaha:

* Air bersih desa
* PAM desa
* Distribusi air

Mapping pendapatan:

```text
Pendapatan Air Bersih → 4.1.02.01 Pendapatan Pengelolaan Air Bersih
```

Sidebar awal:

```text
Dashboard
Pelanggan
Tagihan Air
Pembayaran
Piutang
Operasional
Laporan Unit
```

Rules awal:

```text
Catat Tagihan Pelanggan
Terima Pembayaran Tunai
Terima Pembayaran Bank
Catat Piutang Pelanggan
Biaya Operasional Air Bersih
```

---

### 4.3 JASA_SAMPAH

Contoh usaha:

* Iuran sampah
* Pengangkutan sampah
* Pengelolaan kebersihan

Mapping pendapatan:

```text
Iuran Sampah → 4.1.03.01 Pendapatan Pengelolaan Sampah
```

Sidebar awal:

```text
Dashboard
Pelanggan
Iuran Sampah
Pembayaran
Operasional
Laporan Unit
```

---

### 4.4 JASA_SEWA_ASET

Contoh usaha:

* Gedung serbaguna
* Sewa kios
* Sewa mobil
* Sewa peralatan
* Sewa tempat outbound

Mapping pendapatan:

```text
Sewa Tempat Outbound       → 4.1.04.01 Pendapatan Sewa Tempat Outbound
Sewa Kios / Toko           → 4.1.04.02 Pendapatan Sewa Tempat untuk Toko/Kios
Sewa Gedung                → 4.1.04.03 Pendapatan Sewa Gedung
Sewa Mobil                 → 4.1.04.04 Pendapatan Sewa Mobil
Sewa Peralatan Gedung      → 4.1.04.05 Pendapatan Sewa Peralatan Gedung
Sewa Lainnya               → 4.1.04.99 Pendapatan Sewa Lainnya
```

Sidebar awal:

```text
Dashboard
Aset Disewakan
Booking / Sewa
Penerimaan Sewa
Piutang Sewa
Operasional
Laporan Unit
```

---

### 4.5 JASA_PELAYANAN

Contoh usaha:

* PPOB
* Jasa pembayaran listrik
* Jasa administrasi
* Komisi layanan

Mapping pendapatan:

```text
Jasa Pembayaran Listrik → 4.1.05.01 Pendapatan Jasa Pembayaran Listrik
Jasa Pelayanan Lainnya  → 4.1.05.99 Pendapatan Jasa Pelayanan lainnya
Komisi                  → 4.1.11.01 Pendapatan Komisi
```

Sidebar awal:

```text
Dashboard
Catat Layanan
Penerimaan Jasa
Komisi
Operasional
Laporan Unit
```

---

### 4.6 JASA_TRANSPORTASI_PARKIR

Contoh usaha:

* Parkir motor
* Parkir mobil
* Shuttle wisata
* Transportasi desa

Mapping pendapatan:

```text
Transportasi  → 4.1.06.01 Pendapatan Transportasi
Parkir Mobil  → 4.1.07.01 Pendapatan Parkir Mobil
Parkir Motor  → 4.1.07.02 Pendapatan Parkir Motor
```

Sidebar awal:

```text
Dashboard
Karcis / Tiket
Penerimaan Transportasi
Penerimaan Parkir
Operasional
Laporan Unit
```

---

### 4.7 JASA_SIMPAN_PINJAM

Contoh usaha:

* Simpan pinjam
* Pembiayaan
* Dana bergulir

Mapping pendapatan:

```text
Pendapatan Simpan Pinjam → 4.1.08.01 Pendapatan Simpan Pinjam
```

Sidebar awal:

```text
Dashboard
Anggota / Nasabah
Pinjaman
Angsuran
Jasa / Denda
Piutang
Laporan Unit
```

Catatan:

Unit simpan pinjam harus dipisahkan dari unit jasa biasa karena memiliki piutang, angsuran, jasa pinjaman, denda, dan risiko kredit.

---

### 4.8 JASA_PELATIHAN

Contoh usaha:

* Pelatihan
* Kursus
* Workshop
* Bimbingan

Mapping pendapatan:

```text
Pendapatan Pelatihan → 4.1.09.01 Pendapatan Pelatihan
```

Sidebar awal:

```text
Dashboard
Kegiatan Pelatihan
Pendaftaran Peserta
Penerimaan Pelatihan
Operasional
Laporan Unit
```

---

### 4.9 JASA_HOMESTAY

Contoh usaha:

* Homestay
* Penginapan
* Kamar wisata

Mapping pendapatan:

```text
Pendapatan Homestay → 4.1.10.01 Pendapatan Homestay
```

Sidebar awal:

```text
Dashboard
Data Kamar
Booking
Check-in / Check-out
Penerimaan Homestay
Deposit
Operasional
Laporan Unit
```

---

### 4.10 PERDAGANGAN

Contoh usaha:

* Minimart desa
* Toko desa
* BUM Desa Mart
* Suvenir
* Bensin
* Kopi dagang
* Buku
* Makanan/minuman dagangan

Mapping pendapatan:

```text
Makanan/Minuman       → 4.2.01.01 Pendapatan Penjualan Makanan/Minuman
Pakaian/Kaos/Jaket    → 4.2.01.02 Pendapatan Penjualan Pakaian/Kaos/Jaket
Kerajinan/Suvenir     → 4.2.01.03 Pendapatan Penjualan Hasil Kerajinan/Suvenir
Buku                  → 4.2.01.04 Pendapatan Penjualan Buku
Biji Kopi             → 4.2.01.05 Pendapatan Penjualan Biji Kopi
Bensin                → 4.2.01.06 Pendapatan Penjualan Bensin
Diskon Penjualan      → 4.2.01.99 Diskon Penjualan Barang Dagangan
```

Sidebar awal:

```text
Dashboard
Barang
Pembelian
Penjualan
Persediaan
Harga Pokok Penjualan
Kas/Bank
Laporan Unit
```

Rules awal:

```text
Beli Barang Dagangan Tunai
Beli Barang Dagangan Kredit
Jual Barang Dagangan Tunai
Jual Barang Dagangan Kredit
Catat HPP Barang Dagangan
Retur Pembelian
Retur Penjualan
Diskon Penjualan
Stok Opname
```

Catatan:

Unit perdagangan wajib memiliki modul persediaan dan HPP.

---

### 4.11 PRODUKSI_BARANG_JADI

Kategori ini dipakai untuk unit usaha yang menghasilkan atau mengolah sesuatu menjadi barang jadi, lalu menjual hasil produksinya. Kategori ini tidak hanya untuk kuliner, tetapi juga mencakup produksi agro/peternakan, manufaktur ringan, kerajinan, dan olahan pangan.


Contoh usaha:

* Katering
* Restoran
* Produksi kopi
* Produk olahan desa
* Barang jadi

Mapping pendapatan:

```text
Katering              → 4.3.01.01 Pendapatan Katering
Restoran              → 4.3.01.02 Pendapatan Restoran
Kopi                  → 4.3.01.03 Pendapatan Kopi
Diskon Barang Jadi    → 4.3.01.04 Diskon Penjualan Barang Jadi
```

Sidebar awal:

```text
Dashboard
Bahan Baku
Produksi
Barang Jadi
Penjualan Produk
Harga Pokok Produksi
Persediaan
Laporan Unit
```

Rules awal:

```text
Beli Bahan Baku
Pemakaian Bahan Baku
Produksi Barang Jadi
Jual Barang Jadi Tunai
Jual Barang Jadi Kredit
Catat HPP Barang Jadi
Diskon Penjualan Barang Jadi
```

Catatan:

Unit produksi berbeda dari unit perdagangan. Perdagangan menjual barang dagangan yang dibeli untuk dijual kembali, sedangkan produksi mengolah bahan baku atau sumber daya menjadi barang jadi.

Ayam petelur masuk PRODUKSI_BARANG_JADI jika BUMDes memelihara ayam, membeli pakan/obat, menghasilkan telur, lalu menjual telur. Jika BUMDes hanya membeli telur dari pihak lain lalu menjual kembali, maka masuk PERDAGANGAN.

Es kristal masuk PRODUKSI_BARANG_JADI jika BUMDes memproduksi es dari bahan baku, listrik, kemasan, dan proses produksi sendiri. Jika BUMDes hanya membeli es kristal dari pemasok lalu menjual kembali, maka masuk PERDAGANGAN.

---

## 5. Struktur Database yang Perlu Dibangun

### 5.1 business_unit_category

Tujuan:

Menyimpan kategori bisnis unit usaha.

Kolom awal:

```text
id
code
name
description
is_active
sort_order
created_at
updated_at
```

Contoh data:

```text
JASA_WISATA
JASA_AIR_BERSIH
JASA_SAMPAH
JASA_SEWA_ASET
JASA_PELAYANAN
JASA_TRANSPORTASI_PARKIR
JASA_SIMPAN_PINJAM
JASA_PELATIHAN
JASA_HOMESTAY
PERDAGANGAN
PRODUKSI_BARANG_JADI
```

---

### 5.2 unit_usaha.business_category_id

Tujuan:

Menghubungkan unit usaha dengan kategori bisnis.

Setiap unit usaha harus memiliki kategori agar sistem dapat menentukan:

```text
sidebar
menu transaksi
form transaksi
mapping pendapatan
mapping kas/bank
rules transaksi
laporan unit
```

---

### 5.3 business_revenue_mapping

Tujuan:

Menerjemahkan pilihan bisnis operator menjadi akun pendapatan Kepmen 136.

Kolom awal:

```text
id
business_category_id
label
account_code
is_active
sort_order
metadata
created_at
updated_at
```

Contoh:

```text
JASA_WISATA:
Tiket Masuk  → 4.1.01.01
Wahana       → 4.1.01.02
Paket Wisata → 4.1.01.03

PERDAGANGAN:
Makanan/Minuman    → 4.2.01.01
Pakaian/Kaos/Jaket → 4.2.01.02
Suvenir            → 4.2.01.03
Buku               → 4.2.01.04
Biji Kopi          → 4.2.01.05
Bensin             → 4.2.01.06

PRODUKSI_BARANG_JADI:
Katering → 4.3.01.01
Restoran → 4.3.01.02
Kopi     → 4.3.01.03
```

---

### 5.4 business_cash_mapping

Tujuan:

Menerjemahkan lokasi kas/bank operator menjadi akun kas/bank Kepmen 136.

Kolom awal:

```text
id
bum_desa_id
unit_usaha_id
label
account_code
is_default
is_active
sort_order
created_at
updated_at
```

Contoh:

```text
Kas Tunai Loket → 1.1.01.01
Bank BSI        → 1.1.01.02
Bank Mandiri    → 1.1.01.03
Bank BRI        → 1.1.01.04
Bank BPD        → 1.1.01.05
```

---

### 5.5 business_template_mapping

Tujuan:

Menentukan template transaksi yang tersedia untuk kategori unit tertentu.

Kolom awal:

```text
id
business_category_id
template_transaksi_id
label
route_path
is_active
sort_order
created_at
updated_at
```

Contoh:

```text
JASA_WISATA:
Terima Pendapatan Tunai
Setor Kas ke Bank
Biaya Operasional
Beli ATK / Perlengkapan

PERDAGANGAN:
Pembelian Barang Dagangan
Penjualan Barang Dagangan
Stok Opname
HPP Barang Dagangan

PRODUKSI_BARANG_JADI:
Pembelian Bahan Baku
Produksi Barang Jadi
Penjualan Barang Jadi
HPP Barang Jadi
```

---

## 6. Workflow Implementasi Bertahap

### Tahap 1 — Finalisasi COA Kepmen 136

Status:

Sudah mulai dikerjakan.

Checklist:

```text
[ ] COA Kepmen 136 masuk database
[ ] Akun detail aktif dan bisa dipakai Journal Engine
[ ] Template rule lama tidak salah akun
[ ] T01 divalidasi
[ ] T17 divalidasi
[ ] Semua template inti dicek ulang
```

---

### Tahap 2 — Klasifikasi Kategori Unit Usaha

Checklist:

```text
[ ] Buat tabel business_unit_category
[ ] Seed kategori unit usaha
[ ] Tambah business_category_id ke unit_usaha
[ ] Set kategori default untuk unit development
[ ] Buat helper getUnitBusinessCategory()
```

---

### Tahap 3 — Mapping Pendapatan Bisnis ke COA Kepmen 136

Checklist:

```text
[ ] Buat tabel business_revenue_mapping
[ ] Seed mapping pendapatan per kategori
[ ] Validasi setiap mapping mengarah ke akun detail Kepmen 136
[ ] Buat helper getRevenueOptionsByUnit()
[ ] Refactor form T01 agar memakai mapping bisnis
```

---

### Tahap 4 — Mapping Kas/Bank Bisnis

Checklist:

```text
[ ] Buat tabel business_cash_mapping
[ ] Seed kas/bank default untuk unit development
[ ] Validasi setiap mapping mengarah ke akun detail Kepmen 136
[ ] Buat helper getCashOptionsByUnit()
[ ] Refactor form T01 agar memakai kas/bank bisnis
```

---

### Tahap 5 — Refactor Form T01

Field akhir:

```text
Tanggal Transaksi
Jenis Penerimaan
Nominal
Diterima di
Keterangan
```

Checklist:

```text
[ ] Tidak ada dropdown akun COA mentah
[ ] Tidak ada debit/kredit di UI
[ ] Server action menerjemahkan mapping bisnis ke account_code
[ ] Journal Engine tetap menerima account_code resmi
[ ] Transaksi berhasil membuat jurnal
[ ] Nomor jurnal/bukti tampil setelah posting
```

---

### Tahap 6 — Sidebar Dinamis Berdasarkan Kategori Unit

Checklist:

```text
[ ] Buat konfigurasi sidebar per kategori
[ ] Buat helper getUnitNavigation()
[ ] UnitShell membaca kategori unit
[ ] Sidebar JASA_WISATA berbeda dari PERDAGANGAN
[ ] Sidebar PERDAGANGAN memiliki menu persediaan dan HPP
[ ] Sidebar PRODUKSI memiliki menu produksi dan HPP produksi
```

---

### Tahap 7 — Template Rules per Kategori Unit

Checklist:

```text
[ ] Buat mapping template per kategori
[ ] Tampilkan hanya template yang relevan bagi unit
[ ] Unit jasa tidak melihat menu persediaan perdagangan
[ ] Unit perdagangan melihat pembelian, penjualan, persediaan, HPP
[ ] Unit produksi melihat bahan baku, produksi, barang jadi, HPP produksi
[ ] Unit simpan pinjam memiliki rules khusus pinjaman/angsuran
```

---

### Tahap 8 — Laporan Unit Sesuai Kepmen 136

Checklist:

```text
[ ] Laporan unit membaca journal_line
[ ] Pendapatan jasa terpisah dari penjualan barang dagangan
[ ] Penjualan barang jadi terpisah dari barang dagangan
[ ] HPP barang dagangan terpisah dari HPP produksi
[ ] Beban usaha dikelompokkan sesuai COA
[ ] Laporan dapat dilihat per unit
[ ] Laporan dapat dikonsolidasi di level BUMDes
```

---

## 7. Acceptance Criteria Setiap Tahap

Satu tahap dianggap selesai jika:

```text
[ ] Migration berhasil
[ ] Data seed tervalidasi di database
[ ] Tidak ada hardcoded UUID di production code
[ ] Tidak ada operator-facing debit/kredit
[ ] Tidak ada operator-facing COA mentah sebagai pilihan utama
[ ] Journal Engine tetap membuat jurnal otomatis
[ ] Halaman awal tidak load data besar
[ ] Lint bersih
[ ] Build berhasil
[ ] Git commit dibuat setelah stabil
```

---

## 8. Aturan Saat Bekerja

Setiap kali mengerjakan modul unit usaha, cek pertanyaan berikut:

```text
1. Apakah ini mengikuti COA Kepmen 136?
2. Apakah operator masih dipaksa memilih akun mentah?
3. Apakah pilihan di UI sudah memakai bahasa bisnis unit?
4. Apakah mapping bisnis ke account_code dilakukan di backend?
5. Apakah Journal Engine tetap menjadi satu-satunya pembuat jurnal?
6. Apakah sidebar/menu sudah sesuai kategori unit?
7. Apakah halaman awal ringan dan tidak load data besar?
8. Apakah lint dan build bersih sebelum commit?
```

Jika salah satu jawabannya “belum”, jangan lanjut ke modul berikutnya sebelum fondasi diperbaiki.

---

## 9. Keputusan Arsitektur Final

```text
Unit Usaha memilih kategori bisnis
→ Kategori menentukan sidebar
→ Kategori menentukan menu transaksi
→ Menu transaksi menentukan form bisnis
→ Form bisnis mengirim pilihan bisnis
→ Backend menerjemahkan ke COA Kepmen 136
→ Journal Engine membuat jurnal
→ Laporan mengikuti Kepmen 136
```

Keputusan:

```text
COA Kepmen 136 tetap utuh.
UI operator tetap sederhana.
Mapping bisnis menjadi jembatan antara keduanya.
```
