import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";
import type { ProductionMaterialType } from "@/lib/unit/get-production-material-data";

export type MaterialStockItem = {
  materialId: string;
  materialCode: string;
  materialName: string;
  materialType: ProductionMaterialType;
  unitOfMeasure: string;
  quantityOnHand: string;
  totalValue: string;
  averageUnitCost: string;
  isStocked: boolean;
};

export type MaterialMovementItem = {
  id: string;
  movementDate: string;
  batchCode: string | null;
  materialName: string;
  materialType: ProductionMaterialType;
  movementDirection: "IN" | "OUT";
  movementSource: string;
  quantity: string;
  unitOfMeasure: string;
  unitCost: string;
  totalAmount: string;
};

type MaterialStockRow = {
  material_id: string;
  material_code: string;
  material_name: string;
  material_type: ProductionMaterialType;
  unit_of_measure: string;
  quantity_on_hand: string;
  total_value: string;
  average_unit_cost: string;
  is_stocked: boolean;
};

type MaterialMovementRow = {
  id: string;
  movement_date: string;
  batch_code: string | null;
  material_name: string;
  material_type: ProductionMaterialType;
  movement_direction: "IN" | "OUT";
  movement_source: string;
  quantity: string;
  unit_of_measure: string;
  unit_cost: string;
  total_amount: string;
};

export async function getMaterialStockList(
  context: UnitWorkContext
): Promise<MaterialStockItem[]> {
  const result = await db.query<MaterialStockRow>(
    `
      WITH movement_summary AS (
        SELECT
          psm.material_id,
          SUM(
            CASE
              WHEN psm.movement_direction = 'IN' THEN psm.quantity
              WHEN psm.movement_direction = 'OUT' THEN -psm.quantity
              ELSE 0
            END
          ) AS quantity_on_hand,
          SUM(
            CASE
              WHEN psm.movement_direction = 'IN' THEN psm.total_amount
              WHEN psm.movement_direction = 'OUT' THEN -psm.total_amount
              ELSE 0
            END
          ) AS total_value
        FROM production_stock_movement psm
        WHERE psm.bum_desa_id = $1::uuid
          AND psm.unit_usaha_id = $2::uuid
          AND psm.item_type = 'MATERIAL'
        GROUP BY psm.material_id
      )
      SELECT
        pm.id::text AS material_id,
        pm.code AS material_code,
        pm.name AS material_name,
        pm.material_type,
        pm.unit_of_measure,
        COALESCE(ms.quantity_on_hand, 0)::text AS quantity_on_hand,
        COALESCE(ms.total_value, 0)::text AS total_value,
        CASE
          WHEN COALESCE(ms.quantity_on_hand, 0) <> 0
          THEN (COALESCE(ms.total_value, 0) / ms.quantity_on_hand)::numeric(24,6)
          ELSE 0::numeric(24,6)
        END::text AS average_unit_cost,
        pm.is_stocked
      FROM production_material pm
      LEFT JOIN movement_summary ms
        ON ms.material_id = pm.id
      WHERE pm.bum_desa_id = $1::uuid
        AND pm.unit_usaha_id = $2::uuid
        AND pm.is_active = TRUE
      ORDER BY pm.material_type ASC, pm.name ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    materialId: row.material_id,
    materialCode: row.material_code,
    materialName: row.material_name,
    materialType: row.material_type,
    unitOfMeasure: row.unit_of_measure,
    quantityOnHand: row.quantity_on_hand,
    totalValue: row.total_value,
    averageUnitCost: row.average_unit_cost,
    isStocked: row.is_stocked,
  }));
}

export async function getMaterialMovementList(
  context: UnitWorkContext
): Promise<MaterialMovementItem[]> {
  const result = await db.query<MaterialMovementRow>(
    `
      SELECT
        psm.id::text AS id,
        psm.movement_date::text AS movement_date,
        pb.code AS batch_code,
        pm.name AS material_name,
        pm.material_type,
        psm.movement_direction,
        psm.movement_source,
        psm.quantity::text AS quantity,
        psm.unit_of_measure,
        psm.unit_cost::text AS unit_cost,
        psm.total_amount::text AS total_amount
      FROM production_stock_movement psm
      JOIN production_material pm
        ON pm.id = psm.material_id
      LEFT JOIN production_batch pb
        ON pb.id = psm.production_batch_id
      WHERE psm.bum_desa_id = $1::uuid
        AND psm.unit_usaha_id = $2::uuid
        AND psm.item_type = 'MATERIAL'
      ORDER BY psm.movement_date DESC, psm.created_at DESC
      LIMIT 50
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    movementDate: row.movement_date,
    batchCode: row.batch_code,
    materialName: row.material_name,
    materialType: row.material_type,
    movementDirection: row.movement_direction,
    movementSource: row.movement_source,
    quantity: row.quantity,
    unitOfMeasure: row.unit_of_measure,
    unitCost: row.unit_cost,
    totalAmount: row.total_amount,
  }));
}