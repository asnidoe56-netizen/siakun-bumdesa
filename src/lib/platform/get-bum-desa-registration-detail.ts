import { db } from "@/lib/db/pool";
import type { RegistrationStatus } from "@/lib/platform/get-bum-desa-registrations";

export type BumDesaRegistrationDetail = {
  id: string;
  kode_pendaftaran: string;
  nama_bum_desa: string;
  nama_pendaftar: string;
  email_pendaftar: string;
  nomor_hp_pendaftar: string | null;
  jabatan_pendaftar: string | null;
  alamat: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  provinsi: string | null;
  nib: string | null;
  status: RegistrationStatus;
  catatan_review: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_bum_desa_id: string | null;
  approved_bum_desa_nama: string | null;
  approved_bum_desa_kode: string | null;
  created_at: string;
  updated_at: string;
};

export async function getBumDesaRegistrationDetail(
  id: string
): Promise<BumDesaRegistrationDetail | null> {
  const result = await db.query<BumDesaRegistrationDetail>(
    `
      SELECT
        r.id::text,
        r.kode_pendaftaran,
        r.nama_bum_desa,
        r.nama_pendaftar,
        r.email_pendaftar,
        r.nomor_hp_pendaftar,
        r.jabatan_pendaftar,
        r.alamat,
        r.desa,
        r.kecamatan,
        r.kabupaten,
        r.provinsi,
        r.nib,
        r.status,
        r.catatan_review,
        r.reviewed_by::text,
        r.reviewed_at::text,
        r.approved_bum_desa_id::text,
        b.nama AS approved_bum_desa_nama,
        b.kode AS approved_bum_desa_kode,
        r.created_at::text,
        r.updated_at::text
      FROM bum_desa_registration r
      LEFT JOIN bum_desa b ON b.id = r.approved_bum_desa_id
      WHERE r.id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}
