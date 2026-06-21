import { db } from "@/lib/db/pool";

export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type BumDesaRegistrationRow = {
  id: string;
  kode_pendaftaran: string;
  nama_bum_desa: string;
  nama_pendaftar: string;
  email_pendaftar: string;
  nomor_hp_pendaftar: string | null;
  jabatan_pendaftar: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  provinsi: string | null;
  status: RegistrationStatus;
  created_at: string;
  reviewed_at: string | null;
};

export type BumDesaRegistrationSummary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

export type BumDesaRegistrationListData = {
  summary: BumDesaRegistrationSummary;
  registrations: BumDesaRegistrationRow[];
};

export async function getBumDesaRegistrations(): Promise<BumDesaRegistrationListData> {
  const [registrationsResult, summaryResult] = await Promise.all([
    db.query<BumDesaRegistrationRow>(
      `
        SELECT
          id::text,
          kode_pendaftaran,
          nama_bum_desa,
          nama_pendaftar,
          email_pendaftar,
          nomor_hp_pendaftar,
          jabatan_pendaftar,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          status,
          created_at::text,
          reviewed_at::text
        FROM bum_desa_registration
        ORDER BY created_at DESC
        LIMIT 50
      `
    ),
    db.query<{
      total: string;
      pending: string;
      approved: string;
      rejected: string;
    }>(
      `
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE status = 'PENDING')::text AS pending,
          COUNT(*) FILTER (WHERE status = 'APPROVED')::text AS approved,
          COUNT(*) FILTER (WHERE status = 'REJECTED')::text AS rejected
        FROM bum_desa_registration
      `
    ),
  ]);

  const summary = summaryResult.rows[0];

  return {
    summary: {
      total: Number(summary?.total ?? 0),
      pending: Number(summary?.pending ?? 0),
      approved: Number(summary?.approved ?? 0),
      rejected: Number(summary?.rejected ?? 0),
    },
    registrations: registrationsResult.rows,
  };
}
