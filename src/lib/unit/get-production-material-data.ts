import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type ProductionMaterialType =
  | "BAHAN_BAKU"
  | "KEMASAN"
  | "BAHAN_PENDUKUNG"
  | "BARANG_PAKAI_HABIS";

export type ProductionMaterialTypeOption = {
  value: ProductionMaterialType;
  label: string;
  description: string;
};

export type ProductionMaterialListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  materialType: ProductionMaterialType;
  unitOfMeasure: string;
  defaultUnitCost: string;
  isStocked: boolean;
  isActive: boolean;
};

type ProductionMaterialListRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  material_type: ProductionMaterialType;
  unit_of_measure: string;
  default_unit_cost: string;
  is_stocked: boolean;
  is_active: boolean;
};

export const productionMaterialTypeOptions: ProductionMaterialTypeOption[] = [
  {
    value: "BAHAN_BAKU",
    label: "Bahan Baku",
    description: "Bahan utama yang dipakai untuk menghasilkan produk.",
  },
  {
    value: "KEMASAN",
    label: "Kemasan",
    description: "Bahan kemasan seperti plastik, botol, kardus, label, atau tray.",
  },
  {
    value: "BAHAN_PENDUKUNG",
    label: "Bahan Pendukung",
    description: "Bahan pendukung proses produksi seperti vitamin, obat, atau bahan tambahan.",
  },
  {
    value: "BARANG_PAKAI_HABIS",
    label: "Barang Pakai Habis",
    description: "Barang habis pakai yang menunjang produksi.",
  },
];

export function getProductionMaterialTypeLabel(type: ProductionMaterialType) {
  return (
    productionMaterialTypeOptions.find((option) => option.value === type)
      ?.label ?? type
  );
}

export async function getProductionMaterialList(
  context: UnitWorkContext
): Promise<ProductionMaterialListItem[]> {
  const result = await db.query<ProductionMaterialListRow>(
    `
      SELECT
        pm.id::text AS id,
        pm.code,
        pm.name,
        pm.description,
        pm.material_type,
        pm.unit_of_measure,
        pm.default_unit_cost::text AS default_unit_cost,
        pm.is_stocked,
        pm.is_active
      FROM production_material pm
      WHERE pm.bum_desa_id = $1::uuid
        AND pm.unit_usaha_id = $2::uuid
      ORDER BY pm.is_active DESC, pm.material_type ASC, pm.name ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    materialType: row.material_type,
    unitOfMeasure: row.unit_of_measure,
    defaultUnitCost: row.default_unit_cost,
    isStocked: row.is_stocked,
    isActive: row.is_active,
  }));
}