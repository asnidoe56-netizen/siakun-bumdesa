import { db } from "@/lib/db/pool";

export type UnitWorkContext = {
  bumDesaId: string;
  bumDesaName: string;
  unitUsahaId: string;
  unitUsahaName: string;
  unitCode: string;
  userId: string | null;
  userName: string;
  isDevelopmentFallback: boolean;
};

type UnitWorkContextRow = {
  bum_desa_id: string;
  bum_desa_name: string;
  unit_usaha_id: string;
  unit_usaha_name: string;
  unit_code: string;
};

export async function getUnitWorkContext(): Promise<UnitWorkContext> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Konteks kerja unit belum tersedia. Login/session pengguna wajib diaktifkan untuk production."
    );
  }

  const result = await db.query<UnitWorkContextRow>(
    `
      SELECT
        b.id::text AS bum_desa_id,
        b.nama AS bum_desa_name,
        u.id::text AS unit_usaha_id,
        u.nama AS unit_usaha_name,
        u.kode AS unit_code
      FROM bum_desa b
      JOIN unit_usaha u ON u.bum_desa_id = b.id
      WHERE b.deleted_at IS NULL
        AND b.is_active = TRUE
        AND u.is_active = TRUE
      ORDER BY b.created_at ASC, u.created_at ASC
      LIMIT 1
    `
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error(
      "Tidak ada BUMDes dan unit usaha aktif yang tersedia untuk konteks kerja unit."
    );
  }

  return {
    bumDesaId: row.bum_desa_id,
    bumDesaName: row.bum_desa_name,
    unitUsahaId: row.unit_usaha_id,
    unitUsahaName: row.unit_usaha_name,
    unitCode: row.unit_code,
    userId: null,
    userName: "Operator Unit Development",
    isDevelopmentFallback: true,
  };
}