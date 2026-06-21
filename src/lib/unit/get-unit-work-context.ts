import { db } from "@/lib/db/pool";

export type UnitWorkContext = {
  bumDesaId: string;
  bumDesaName: string;
  unitUsahaId: string;
  unitUsahaName: string;
  unitCode: string;
  businessCategoryId: string | null;
  businessCategoryCode: string;
  businessCategoryName: string;
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
  business_category_id: string | null;
  business_category_code: string | null;
  business_category_name: string | null;
};

const developmentDefaultBusinessCategory = {
  code: "PRODUKSI_BARANG_JADI",
  name: "Produksi Barang Jadi",
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
        u.kode AS unit_code,
        buc.id::text AS business_category_id,
        buc.code AS business_category_code,
        buc.name AS business_category_name
      FROM bum_desa b
      JOIN unit_usaha u ON u.bum_desa_id = b.id
      LEFT JOIN business_unit_category buc ON buc.id = u.business_category_id
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
    businessCategoryId: row.business_category_id,
    businessCategoryCode:
      row.business_category_code ?? developmentDefaultBusinessCategory.code,
    businessCategoryName:
      row.business_category_name ?? developmentDefaultBusinessCategory.name,
    userId: null,
    userName: "Operator Unit Development",
    isDevelopmentFallback: true,
  };
}