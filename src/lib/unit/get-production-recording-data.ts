import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";
import type { ProductionMaterialType } from "@/lib/unit/get-production-material-data";

export type ProductionRecordingFormulaLine = {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  materialType: ProductionMaterialType;
  unitOfMeasure: string;
  formulaQuantity: string;
  unitCost: string;
  notes: string | null;
  sortOrder: number;
};

export type ProductionRecordingFormulaOption = {
  id: string;
  code: string;
  name: string;
  productId: string;
  productCode: string;
  productName: string;
  productUnitOfMeasure: string;
  outputQuantity: string;
  isDefault: boolean;
  lines: ProductionRecordingFormulaLine[];
};

export type ProductionBatchListItem = {
  id: string;
  code: string;
  productionDate: string;
  productName: string;
  outputQuantity: string;
  outputUnitOfMeasure: string;
  totalMaterialCost: string;
  materialCount: number;
  status: string;
};

type FormulaRow = {
  formula_id: string;
  formula_code: string;
  formula_name: string;
  product_id: string;
  product_code: string;
  product_name: string;
  product_unit_of_measure: string;
  output_quantity: string;
  is_default: boolean;
  line_id: string | null;
  material_id: string | null;
  material_code: string | null;
  material_name: string | null;
  material_type: ProductionMaterialType | null;
  material_unit_of_measure: string | null;
  formula_quantity: string | null;
  unit_cost: string | null;
  line_notes: string | null;
  sort_order: number | null;
};

type BatchRow = {
  id: string;
  code: string;
  production_date: string;
  product_name: string;
  output_quantity: string;
  output_unit_of_measure: string;
  total_material_cost: string;
  material_count: string;
  status: string;
};

export async function getProductionRecordingFormulaOptions(
  context: UnitWorkContext
): Promise<ProductionRecordingFormulaOption[]> {
  const result = await db.query<FormulaRow>(
    `
      SELECT
        pf.id::text AS formula_id,
        pf.code AS formula_code,
        pf.name AS formula_name,
        pp.id::text AS product_id,
        pp.code AS product_code,
        pp.name AS product_name,
        pp.unit_of_measure AS product_unit_of_measure,
        pf.output_quantity::text AS output_quantity,
        pf.is_default,
        pfl.id::text AS line_id,
        pm.id::text AS material_id,
        pm.code AS material_code,
        pm.name AS material_name,
        pm.material_type,
        pm.unit_of_measure AS material_unit_of_measure,
        pfl.quantity::text AS formula_quantity,
        pm.default_unit_cost::text AS unit_cost,
        pfl.notes AS line_notes,
        pfl.sort_order
      FROM production_formula pf
      JOIN production_product pp
        ON pp.id = pf.product_id
      LEFT JOIN production_formula_line pfl
        ON pfl.formula_id = pf.id
      LEFT JOIN production_material pm
        ON pm.id = pfl.material_id
      WHERE pf.bum_desa_id = $1::uuid
        AND pf.unit_usaha_id = $2::uuid
        AND pf.is_active = TRUE
      ORDER BY
        pf.is_default DESC,
        pf.name ASC,
        pfl.sort_order ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  const formulaMap = new Map<string, ProductionRecordingFormulaOption>();

  for (const row of result.rows) {
    const existingFormula = formulaMap.get(row.formula_id);

    const formula =
      existingFormula ??
      {
        id: row.formula_id,
        code: row.formula_code,
        name: row.formula_name,
        productId: row.product_id,
        productCode: row.product_code,
        productName: row.product_name,
        productUnitOfMeasure: row.product_unit_of_measure,
        outputQuantity: row.output_quantity,
        isDefault: row.is_default,
        lines: [],
      };

    if (!existingFormula) {
      formulaMap.set(row.formula_id, formula);
    }

    if (
      row.line_id &&
      row.material_id &&
      row.material_code &&
      row.material_name &&
      row.material_type &&
      row.material_unit_of_measure &&
      row.formula_quantity &&
      row.unit_cost
    ) {
      formula.lines.push({
        id: row.line_id,
        materialId: row.material_id,
        materialCode: row.material_code,
        materialName: row.material_name,
        materialType: row.material_type,
        unitOfMeasure: row.material_unit_of_measure,
        formulaQuantity: row.formula_quantity,
        unitCost: row.unit_cost,
        notes: row.line_notes,
        sortOrder: row.sort_order ?? 0,
      });
    }
  }

  return Array.from(formulaMap.values());
}

export async function getProductionBatchList(
  context: UnitWorkContext
): Promise<ProductionBatchListItem[]> {
  const result = await db.query<BatchRow>(
    `
      SELECT
        pb.id::text AS id,
        pb.code,
        pb.production_date::text AS production_date,
        pp.name AS product_name,
        pb.output_quantity::text AS output_quantity,
        pb.output_unit_of_measure,
        COALESCE(SUM(pbm.total_cost), 0)::text AS total_material_cost,
        COUNT(pbm.id)::text AS material_count,
        pb.status
      FROM production_batch pb
      JOIN production_product pp
        ON pp.id = pb.product_id
      LEFT JOIN production_batch_material pbm
        ON pbm.production_batch_id = pb.id
      WHERE pb.bum_desa_id = $1::uuid
        AND pb.unit_usaha_id = $2::uuid
      GROUP BY
        pb.id,
        pb.code,
        pb.production_date,
        pp.name,
        pb.output_quantity,
        pb.output_unit_of_measure,
        pb.status
      ORDER BY pb.production_date DESC, pb.created_at DESC
      LIMIT 30
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    productionDate: row.production_date,
    productName: row.product_name,
    outputQuantity: row.output_quantity,
    outputUnitOfMeasure: row.output_unit_of_measure,
    totalMaterialCost: row.total_material_cost,
    materialCount: Number(row.material_count),
    status: row.status,
  }));
}