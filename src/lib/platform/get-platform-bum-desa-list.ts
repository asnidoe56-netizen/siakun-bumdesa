import { db } from "@/lib/db/pool";

export type PlatformBumDesaRow = {
  nomor: number;
  id: string;
  kode: string;
  nama: string;
  alamat: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  provinsi: string | null;
  nib: string | null;
  is_active: boolean;
  created_at: string;
};

export type PlatformBumDesaSummary = {
  total: number;
  active: number;
  suspended: number;
};

export type PlatformBumDesaListData = {
  summary: PlatformBumDesaSummary;
  bumDesa: PlatformBumDesaRow[];
};

const INITIAL_BUM_DESA_LIMIT = 50;

export async function getPlatformBumDesaList(): Promise<PlatformBumDesaListData> {
  const [listResult, summaryResult] = await Promise.all([
    db.query<PlatformBumDesaRow>(
      `
        SELECT
          ROW_NUMBER() OVER (ORDER BY created_at DESC)::int AS nomor,
          id::text,
          kode,
          nama,
          alamat,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          nib,
          is_active,
          created_at::text
        FROM bum_desa
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [INITIAL_BUM_DESA_LIMIT]
    ),
    db.query<{
      total: string;
      active: string;
      suspended: string;
    }>(
      `
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE is_active = TRUE)::text AS active,
          COUNT(*) FILTER (WHERE is_active = FALSE)::text AS suspended
        FROM bum_desa
        WHERE deleted_at IS NULL
      `
    ),
  ]);

  const summary = summaryResult.rows[0];

  return {
    summary: {
      total: Number(summary?.total ?? 0),
      active: Number(summary?.active ?? 0),
      suspended: Number(summary?.suspended ?? 0),
    },
    bumDesa: listResult.rows,
  };
}
