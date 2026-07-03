import { db } from "@/lib/db/pool";

export type UnitType = "kantor_pusat" | "unit_usaha";

export type UnitWorkContext = {
  bumDesaId: string;
  bumDesaName: string;
  unitUsahaId: string;
  unitUsahaName: string;
  unitCode: string;
  unitType: UnitType;
  unitTypeLabel: string;
  businessCategoryId: string | null;
  businessCategoryCode: string | null;
  businessCategoryName: string | null;
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
  unit_type: UnitType;
  business_category_id: string | null;
  business_category_code: string | null;
  business_category_name: string | null;
};

function getUnitTypeLabel(unitType: UnitType) {
  if (unitType === "kantor_pusat") {
    return "Kantor Pusat";
  }

  return "Unit Usaha";
}

export async function getUnitWorkContext(): Promise<UnitWorkContext> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Konteks kerja unit belum tersedia. Login/session pengguna wajib diaktifkan untuk production."
    );
  }

  const developmentUnitCode =
    process.env.DEV_UNIT_CODE?.trim().toUpperCase() || null;

  const result = await db.query<UnitWorkContextRow>(
    `
      SELECT
        b.id::text AS bum_desa_id,
        b.nama AS bum_desa_name,
        u.id::text AS unit_usaha_id,
        u.nama AS unit_usaha_name,
        u.kode AS unit_code,
        u.jenis::text AS unit_type,
        buc.id::text AS business_category_id,
        buc.code AS business_category_code,
        buc.name AS business_category_name
      FROM bum_desa b
      JOIN unit_usaha u ON u.bum_desa_id = b.id
      LEFT JOIN business_unit_category buc ON buc.id = u.business_category_id
      WHERE b.deleted_at IS NULL
        AND b.is_active = TRUE
        AND u.is_active = TRUE
        AND ($1::text IS NULL OR UPPER(u.kode) = $1::text)
      ORDER BY
        CASE
          WHEN u.jenis = 'kantor_pusat' THEN 0
          ELSE 1
        END,
        b.created_at ASC,
        u.created_at ASC
      LIMIT 1
    `,
    [developmentUnitCode]
  );

  const row = result.rows[0];

  if (!row) {
    if (developmentUnitCode) {
      throw new Error(
        `Unit kerja development dengan kode ${developmentUnitCode} tidak ditemukan atau tidak aktif.`
      );
    }

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
    unitType: row.unit_type,
    unitTypeLabel: getUnitTypeLabel(row.unit_type),
    businessCategoryId: row.business_category_id,
    businessCategoryCode: row.business_category_code,
    businessCategoryName: row.business_category_name,
    userId: null,
    userName: "Operator Unit Development",
    isDevelopmentFallback: true,
  };
}