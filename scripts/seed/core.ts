import { config } from "dotenv";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

async function main() {
  const { db } = await import("../../src/lib/db/pool");

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  const userResult = await db.query(
    `
    INSERT INTO app_user (nama_lengkap, email, password_hash)
    VALUES ($1, $2, $3)
    ON CONFLICT (email)
    DO UPDATE SET
      nama_lengkap = EXCLUDED.nama_lengkap,
      password_hash = EXCLUDED.password_hash,
      updated_at = NOW()
    RETURNING id, email
    `,
    ["Super Admin SiAkun", "admin@siakun.local", passwordHash]
  );

  const userId = userResult.rows[0].id;

  await db.query(
    `
    INSERT INTO user_bum_desa_role (user_id, bum_desa_id, role)
    SELECT $1, NULL, 'super_admin_platform'
    WHERE NOT EXISTS (
      SELECT 1
      FROM user_bum_desa_role
      WHERE user_id = $1
        AND bum_desa_id IS NULL
        AND role = 'super_admin_platform'
    )
    `,
    [userId]
  );

  const bumdesaResult = await db.query(
    `
    INSERT INTO bum_desa (
      nama, kode, alamat, desa, kecamatan, kabupaten, provinsi, nib
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    )
    ON CONFLICT (kode)
    DO UPDATE SET
      nama = EXCLUDED.nama,
      alamat = EXCLUDED.alamat,
      desa = EXCLUDED.desa,
      kecamatan = EXCLUDED.kecamatan,
      kabupaten = EXCLUDED.kabupaten,
      provinsi = EXCLUDED.provinsi,
      nib = EXCLUDED.nib,
      updated_at = NOW()
    RETURNING id, nama
    `,
    [
      "BUM Desa Contoh",
      "BUMDES-CONTOH",
      "Alamat contoh",
      "Desa Contoh",
      "Kecamatan Contoh",
      "Kabupaten Contoh",
      "Provinsi Contoh",
      "NIB-CONTOH",
    ]
  );

  const bumDesaId = bumdesaResult.rows[0].id;

  const pusatResult = await db.query(
    `
    INSERT INTO unit_usaha (bum_desa_id, nama, kode, jenis, deskripsi)
    VALUES ($1, $2, $3, 'kantor_pusat', $4)
    ON CONFLICT (bum_desa_id, kode)
    DO UPDATE SET
      nama = EXCLUDED.nama,
      jenis = EXCLUDED.jenis,
      deskripsi = EXCLUDED.deskripsi,
      updated_at = NOW()
    RETURNING id, nama
    `,
    [bumDesaId, "Kantor Pusat", "PUSAT", "Unit khusus untuk pembukuan kantor pusat BUM Desa"]
  );

  await db.query(
    `
    INSERT INTO periode_akuntansi (
      bum_desa_id, nama, tanggal_mulai, tanggal_selesai, status
    )
    VALUES ($1, $2, $3, $4, 'OPEN')
    ON CONFLICT (bum_desa_id, nama)
    DO UPDATE SET
      tanggal_mulai = EXCLUDED.tanggal_mulai,
      tanggal_selesai = EXCLUDED.tanggal_selesai,
      status = EXCLUDED.status,
      updated_at = NOW()
    `,
    [bumDesaId, "Tahun Buku 2026", "2026-01-01", "2026-12-31"]
  );

  const templates = [
    ["T01", "Terima Pendapatan Tunai", "Pendapatan", "Mencatat penerimaan pendapatan tunai tanpa menampilkan debit/kredit"],
    ["T02", "Setor Tunai dari Kas ke Bank", "Kas dan Bank", "Memindahkan uang dari kas tunai ke rekening bank"],
    ["T05", "Unit Usaha Menyetor Pendapatan ke Kantor Pusat", "Penyetoran ke Pusat", "Mencatat penyetoran kas atau bank dari unit usaha ke kantor pusat melalui akun RK"],
    ["T06", "Beli Barang/Jasa Tunai", "Pengeluaran", "Mencatat pembayaran barang atau jasa tunai yang langsung menjadi beban"],
    ["T08", "Bayar/Lunasi Utang Usaha", "Pengeluaran", "Mencatat pembayaran atau pelunasan utang usaha menggunakan kas atau bank"],
    ["T09", "Bayar Gaji dan Tunjangan", "Pengeluaran", "Mencatat pembayaran gaji dan tunjangan karyawan"],
    ["T17", "Beli Alat Tulis atau Barang Pakai Habis", "Pengeluaran", "Mencatat pembelian perlengkapan habis pakai"],
    ["T19", "Terima Modal dari Desa atau Masyarakat", "Modal", "Mencatat penyertaan modal masuk ke BUM Desa"],
  ];

  for (const template of templates) {
    await db.query(
      `
      INSERT INTO template_transaksi (kode, nama, kategori, deskripsi)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (kode)
      DO UPDATE SET
        nama = EXCLUDED.nama,
        kategori = EXCLUDED.kategori,
        deskripsi = EXCLUDED.deskripsi,
        updated_at = NOW()
      `,
      template
    );
  }

  console.log("Seed data awal berhasil dibuat.");
  console.table([
    {
      email_admin: "admin@siakun.local",
      password_admin: "Admin123!",
      bum_desa: bumdesaResult.rows[0].nama,
      kantor_pusat: pusatResult.rows[0].nama,
    },
  ]);

  await db.end();
}

main().catch((error) => {
  console.error("Seed gagal:");
  console.error(error);
  process.exit(1);
});

