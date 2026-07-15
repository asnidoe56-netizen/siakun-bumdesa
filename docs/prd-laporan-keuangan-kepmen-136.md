# PRD Modul Laporan Keuangan SiAkun BUM Desa

## Status Dokumen

- Project: SiAkun BUM Desa
- Modul: Laporan Keuangan Unit Usaha
- Acuan utama: Kepmendesa 136 Tahun 2022
- Status: Aktif
- Update terakhir: 2026-07-15
- Tujuan: Menjadi panduan kerja dan checklist progres implementasi laporan.

---

## 1. Prinsip Utama

Laporan formal harus bersumber dari jurnal yang sudah diposting, bukan langsung dari tabel transaksi operasional.

Alur data:

Transaksi operasional
→ Jurnal otomatis / manual
→ journal_header + journal_line
→ Buku Besar
→ Neraca Saldo
→ Laporan formal

Sumber data utama:

- journal_header
- journal_line
- akun
- periode_akuntansi

Aturan laporan:

- Hanya membaca jurnal dengan status POSTED.
- Hanya memakai akun aktif.
- Untuk laporan formal, akun yang dipakai adalah akun detail.
- Saldo akun mengikuti normal_balance.

Aturan saldo:

- Akun normal DEBIT: debit - kredit
- Akun normal KREDIT: kredit - debit

---

## 2. Route Modul Laporan

Route utama:

- /unit/dashboard/laporan

Sub-route laporan:

- /unit/dashboard/laporan/buku-besar
- /unit/dashboard/laporan/neraca-saldo
- /unit/dashboard/laporan/laba-rugi
- /unit/dashboard/laporan/neraca
- /unit/dashboard/laporan/perubahan-ekuitas
- /unit/dashboard/laporan/arus-kas
- /unit/dashboard/laporan/calk

---

## 3. Checklist Utama Modul Laporan

- [x] Buku Besar tahap awal
- [x] Neraca Saldo
- [x] Laporan Laba Rugi
- [x] Neraca / Laporan Posisi Keuangan
- [x] Laporan Perubahan Ekuitas
- [x] Laporan Arus Kas
- [ ] Catatan atas Laporan Keuangan / CaLK
- [ ] Export PDF
- [ ] Export Excel

---

## 4. Buku Besar

Status: Selesai tahap awal.

Checklist:

- [x] Helper data Buku Besar dibuat
- [x] Halaman Buku Besar dibuat
- [x] Route /unit/dashboard/laporan/buku-besar aktif
- [x] Filter periode tersedia
- [x] Filter tanggal awal tersedia
- [x] Filter tanggal akhir tersedia
- [x] Filter akun tersedia
- [x] Saldo awal tampil
- [x] Total debit tampil
- [x] Total kredit tampil
- [x] Saldo akhir tampil
- [x] Mutasi jurnal posted tampil
- [x] Saldo berjalan tampil
- [x] Shortcut dari halaman Laporan Unit tersedia
- [x] npm run lint berhasil
- [x] npm run build berhasil
- [x] Commit berhasil
- [x] Push GitHub berhasil

File:

- src/lib/unit/get-general-ledger-report-data.ts
- src/app/unit/dashboard/laporan/buku-besar/page.tsx

Catatan lanjutan:

- [ ] Export Buku Besar PDF
- [ ] Export Buku Besar Excel
- [ ] Print layout Buku Besar
- [ ] Filter nomor jurnal
- [ ] Opsi tampilkan akun tanpa mutasi

---

## 5. Neraca Saldo

Status: Selesai tahap awal.

Tujuan:

Neraca Saldo menjadi kontrol keseimbangan debit dan kredit sebelum laporan Laba Rugi, Neraca, Perubahan Ekuitas, dan Arus Kas dibuat.

File target:

- src/lib/unit/get-trial-balance-report-data.ts
- src/app/unit/dashboard/laporan/neraca-saldo/page.tsx

Checklist:

- [x] Helper data Neraca Saldo dibuat
- [x] Halaman Neraca Saldo dibuat
- [x] Route /unit/dashboard/laporan/neraca-saldo aktif
- [x] Shortcut di halaman Laporan Unit ditambahkan
- [x] Filter periode tersedia
- [x] Filter tanggal akhir tersedia
- [x] Semua akun detail aktif tampil
- [x] Akun tanpa transaksi tetap tampil dengan saldo 0
- [x] Saldo debit dihitung otomatis
- [x] Saldo kredit dihitung otomatis
- [x] Total debit tampil
- [x] Total kredit tampil
- [x] Status Balance / Tidak Balance tampil
- [x] npm run lint berhasil
- [x] npm run build berhasil
- [x] Commit berhasil
- [x] Push GitHub berhasil

Acceptance criteria:

- [x] Hanya mengambil jurnal POSTED
- [x] Memakai akun detail aktif
- [x] Total debit dan total kredit dihitung otomatis
- [x] Sistem menampilkan Balance jika total debit sama dengan total kredit
- [x] Sistem menampilkan peringatan jika tidak balance

---

## 6. Laporan Laba Rugi

Status: Selesai tahap awal.

File target:

- src/lib/unit/get-income-statement-report-data.ts
- src/app/unit/dashboard/laporan/laba-rugi/page.tsx

Struktur awal:

- Pendapatan Usaha
- Harga Pokok Penjualan / Beban Pokok
- Laba Kotor
- Beban Usaha
- Laba Operasi
- Pendapatan dan Beban Lain-lain
- Laba/Rugi Bersih

Checklist:

- [x] Helper data Laba Rugi dibuat
- [x] Halaman Laba Rugi dibuat
- [x] Route /unit/dashboard/laporan/laba-rugi aktif
- [x] Shortcut di halaman Laporan Unit ditambahkan
- [x] Filter periode tersedia
- [x] Pendapatan usaha tampil
- [x] HPP / beban pokok tampil
- [x] Laba kotor tampil
- [x] Beban usaha tampil
- [x] Laba operasi tampil
- [x] Laba/rugi bersih tampil
- [x] npm run lint berhasil
- [x] npm run build berhasil
- [x] Commit berhasil
- [x] Push GitHub berhasil

Acceptance criteria:

- [x] Hanya mengambil jurnal POSTED
- [x] Mengambil akun pendapatan dan beban
- [x] Laba/rugi bersih bisa dipakai oleh Laporan Perubahan Ekuitas

---

## 7. Neraca / Laporan Posisi Keuangan

Status: Selesai tahap awal.

File target:

- src/lib/unit/get-balance-sheet-report-data.ts
- src/app/unit/dashboard/laporan/neraca/page.tsx

Formula kontrol:

Aset = Kewajiban + Ekuitas

Checklist:

- [x] Helper data Neraca dibuat
- [x] Halaman Neraca dibuat
- [x] Route /unit/dashboard/laporan/neraca aktif
- [x] Shortcut di halaman Laporan Unit ditambahkan
- [x] Filter periode tersedia
- [x] Aset tampil
- [x] Kewajiban tampil
- [x] Ekuitas tampil
- [x] Total aset tampil
- [x] Total kewajiban tampil
- [x] Total ekuitas tampil
- [x] Status seimbang / tidak seimbang tampil
- [x] npm run lint berhasil
- [x] npm run build berhasil
- [x] Commit berhasil
- [x] Push GitHub berhasil

Acceptance criteria:

- [x] Akun 1.x masuk Aset
- [x] Akun 2.x masuk Kewajiban
- [x] Akun 3.x masuk Ekuitas
- [x] Nilai ekuitas konsisten dengan Laporan Perubahan Ekuitas

---

## 8. Laporan Perubahan Ekuitas

Status: Selesai tahap awal dan sudah terintegrasi.

Commit implementasi: fb0f710 - feat: add equity changes report.

File target:

- src/lib/unit/get-equity-changes-report-data.ts
- src/app/unit/dashboard/laporan/perubahan-ekuitas/page.tsx

Struktur implementasi:

- Ekuitas Awal
- Penyertaan Modal
- Tambahan Modal / Hibah
- Laba Bersih Periode Berjalan
- Distribusi / Pembagian Hasil Usaha
- Koreksi Ekuitas
- Ekuitas Akhir

Checklist:

- [x] Helper data Perubahan Ekuitas dibuat
- [x] Halaman Perubahan Ekuitas dibuat
- [x] Route /unit/dashboard/laporan/perubahan-ekuitas aktif
- [x] Shortcut di halaman Laporan Unit ditambahkan
- [x] Filter periode tersedia
- [x] Ekuitas awal tampil
- [x] Penambahan modal tampil
- [x] Laba/rugi bersih periode berjalan tampil
- [x] Distribusi / pembagian hasil usaha tampil
- [x] Koreksi ekuitas tampil
- [x] Ekuitas akhir tampil
- [x] npm run lint berhasil
- [x] npm run build berhasil
- [x] Commit berhasil
- [x] Push GitHub berhasil

Acceptance criteria:

- [x] Laba/rugi bersih tersambung dari Laporan Laba Rugi
- [x] Ekuitas akhir sama dengan nilai ekuitas di Neraca

---

## 9. Laporan Arus Kas

Status: Selesai tahap awal dengan metode langsung dan format penyajian Kepmendesa 136 Tahun 2022.

Commit implementasi: 2d5b50c - feat: add Kepmendesa 136 cash flow report.

Catatan implementasi:

- Laporan utama memakai kolom No., Uraian, dan Jumlah (Rp).
- Arus kas dikelompokkan menjadi aktivitas operasi, investasi, dan pendanaan.
- Saldo awal, kenaikan atau penurunan kas, dan saldo akhir direkonsiliasi.
- Rincian jurnal tetap tersedia sebagai audit trail.
- Transfer internal antar-akun kas dikeluarkan dari arus kas eksternal.
- Alokasi kas antarunit disajikan pada laporan unit dan harus dieliminasi pada laporan gabungan BUM Desa.

File target:

- src/lib/unit/get-cash-flow-report-data.ts
- src/app/unit/dashboard/laporan/arus-kas/page.tsx

Struktur implementasi:

- Arus Kas dari Aktivitas Operasi
- Arus Kas dari Aktivitas Investasi
- Arus Kas dari Aktivitas Pendanaan
- Kenaikan / Penurunan Kas Bersih
- Kas dan Setara Kas Awal
- Kas dan Setara Kas Akhir

Sumber akun kas:

- 1.1.01.xx Kas dan Bank
- 1.1.02.xx Setara Kas

Checklist:

- [x] Helper data Arus Kas dibuat
- [x] Halaman Arus Kas dibuat
- [x] Route /unit/dashboard/laporan/arus-kas aktif
- [x] Shortcut di halaman Laporan Unit ditambahkan
- [x] Filter periode tersedia
- [x] Arus kas operasi tampil
- [x] Arus kas investasi tampil
- [x] Arus kas pendanaan tampil
- [x] Kenaikan / penurunan kas bersih tampil
- [x] Kas awal tampil
- [x] Kas akhir tampil
- [x] npm run lint berhasil
- [x] npm run build berhasil
- [x] Commit berhasil
- [x] Push GitHub berhasil

Acceptance criteria:

- [x] Tidak hanya membaca Kas Tunai 1.1.01.01
- [x] Membaca seluruh akun kas, bank, dan setara kas aktif
- [x] Saldo kas akhir sama dengan kas dan setara kas di Neraca
- [x] Arus kas memakai metode langsung

---

## 10. Catatan atas Laporan Keuangan / CaLK

Status: Belum dibuat.

File target:

- src/lib/unit/get-financial-statement-notes-data.ts
- src/app/unit/dashboard/laporan/calk/page.tsx

Checklist:

- [ ] Helper data CaLK dibuat
- [ ] Halaman CaLK dibuat
- [ ] Route /unit/dashboard/laporan/calk aktif
- [ ] Shortcut di halaman Laporan Unit ditambahkan
- [ ] Identitas BUMDes tampil
- [ ] Identitas unit usaha tampil
- [ ] Periode laporan tampil
- [ ] Basis penyusunan laporan tampil
- [ ] Ringkasan kebijakan akuntansi tampil
- [ ] Rincian kas dan bank tampil
- [ ] Rincian piutang tampil
- [ ] Rincian persediaan tampil
- [ ] Rincian aset tetap tampil
- [ ] Rincian utang tampil
- [ ] Rincian ekuitas tampil
- [ ] Rincian pendapatan dan beban tampil
- [ ] npm run lint berhasil
- [ ] npm run build berhasil
- [ ] Commit berhasil
- [ ] Push GitHub berhasil

---

## 11. Export PDF dan Excel

Status: Belum dibuat.

Checklist:

- [ ] Desain print layout dibuat
- [ ] Export Buku Besar PDF
- [ ] Export Buku Besar Excel
- [ ] Export Neraca Saldo PDF
- [ ] Export Neraca Saldo Excel
- [ ] Export Laba Rugi PDF
- [ ] Export Laba Rugi Excel
- [ ] Export Neraca PDF
- [ ] Export Neraca Excel
- [ ] Export Perubahan Ekuitas PDF
- [ ] Export Perubahan Ekuitas Excel
- [ ] Export Arus Kas PDF
- [ ] Export Arus Kas Excel
- [ ] Export CaLK PDF
- [ ] Export CaLK Excel

Catatan:

Export dibuat setelah struktur laporan stabil.

---

## 12. UI Standard Modul Laporan

Setiap halaman laporan harus memiliki:

- [ ] Tombol kembali ke Pusat Laporan
- [ ] PageHeader
- [ ] Filter periode / tanggal
- [ ] Kartu ringkasan
- [ ] Tabel laporan utama
- [ ] Empty state jika data belum ada
- [ ] Status validasi laporan
- [ ] Tombol export jika sudah tersedia

Komponen prioritas:

- PageContainer
- PageHeader
- Card
- KpiCard
- Button
- Input
- Label
- Table pattern
- Empty state

---

## 13. Definition of Done Per Laporan

Satu laporan dianggap selesai jika:

- [ ] Helper data dibuat
- [ ] Halaman route dibuat
- [ ] Shortcut halaman Laporan Unit ditambahkan
- [ ] Filter periode berfungsi
- [ ] Data hanya memakai jurnal POSTED
- [ ] Empty state tersedia
- [ ] Validasi angka tersedia
- [ ] npm run lint berhasil
- [ ] npm run build berhasil
- [ ] git diff --check bersih
- [ ] Commit dibuat
- [ ] Push ke GitHub berhasil

---

## 14. Urutan Resmi Pengerjaan

- [x] Buku Besar
- [x] Neraca Saldo
- [x] Laporan Laba Rugi
- [x] Neraca / Laporan Posisi Keuangan
- [x] Laporan Perubahan Ekuitas
- [x] Laporan Arus Kas
- [ ] CaLK
- [ ] Export PDF / Excel

Catatan penting:

Laporan Arus Kas tahap awal sudah selesai dan sudah memakai format penyajian Kepmendesa 136 Tahun 2022. Lanjut berikutnya ke Catatan atas Laporan Keuangan / CaLK.
