import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";
import type { ProductionMaterialType } from "@/lib/unit/get-production-material-data";

export type ProductionFormulaProductOption = {
  id: string;
  code: string;
  name: string;
  unitOfMeasure: string;
};

export type ProductionFormulaMaterialOption = {
  id: string;
  code: string;
  name: string;
  materialType: ProductionMaterialType;
  unitOfMeasure: string;
};

export type ProductionFormulaListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  productName: string;
  productUnitOfMeasure: string;
  outputQuantity: string;
  materialCount: number;
  isDefault: boolean;
  isActive: boolean;
};

type ProductOptionRow = {
  id: string;
  code: string;
  name: string;
  unit_of_measure: string;
};

type MaterialOptionRow = {
  id: string;
  code: string;
  name: string;
  material_type: ProductionMaterialType;
  unit_of_measure: string;
};

type FormulaListRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  product_name: string;
  product_unit_of_measure: string;
  output_quantity: string;
  material_count: string;
  is_default: boolean;
  is_active: boolean;
};

export async function getProductionFormulaProductOptions(
  context: UnitWorkContext
): Promise<ProductionFormulaProductOption[]> {
  const result = await db.query<ProductOptionRow>(
    `
      SELECT
        pp.id::text AS id,
        pp.code,
        pp.name,
        pp.unit_of_measure
      FROM production_product pp
      WHERE pp.bum_desa_id = $1::uuid
        AND pp.unit_usaha_id = $2::uuid
        AND pp.is_active = TRUE
      ORDER BY pp.name ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    unitOfMeasure: row.unit_of_measure,
  }));
}

export async function getProductionFormulaMaterialOptions(
  context: UnitWorkContext
): Promise<ProductionFormulaMaterialOption[]> {
  const result = await db.query<MaterialOptionRow>(
    `
      SELECT
        pm.id::text AS id,
        pm.code,
        pm.name,
        pm.material_type,
        pm.unit_of_measure
      FROM production_material pm
      WHERE pm.bum_desa_id = $1::uuid
        AND pm.unit_usaha_id = $2::uuid
        AND pm.is_active = TRUE
      ORDER BY pm.material_type ASC, pm.name ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    materialType: row.material_type,
    unitOfMeasure: row.unit_of_measure,
  }));
}

export async function getProductionFormulaList(
  context: UnitWorkContext
): Promise<ProductionFormulaListItem[]> {
  const result = await db.query<FormulaListRow>(
    `
      SELECT
        pf.id::text AS id,
        pf.code,
        pf.name,
        pf.description,
        pp.name AS product_name,
        pp.unit_of_measure AS product_unit_of_measure,
        pf.output_quantity::text AS output_quantity,
        COUNT(pfl.id)::text AS material_count,
        pf.is_default,
        pf.is_active
      FROM production_formula pf
      JOIN production_product pp ON pp.id = pf.product_id
      LEFT JOIN production_formula_line pfl ON pfl.formula_id = pf.id
      WHERE pf.bum_desa_id = $1::uuid
        AND pf.unit_usaha_id = $2::uuid
      GROUP BY
        pf.id,
        pf.code,
        pf.name,
        pf.description,
        pp.name,
        pp.unit_of_measure,
        pf.output_quantity,
        pf.is_default,
        pf.is_active
      ORDER BY pf.is_active DESC, pf.name ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    productName: row.product_name,
    productUnitOfMeasure: row.product_unit_of_measure,
    outputQuantity: row.output_quantity,
    materialCount: Number(row.material_count),
    isDefault: row.is_default,
    isActive: row.is_active,
  }));
}