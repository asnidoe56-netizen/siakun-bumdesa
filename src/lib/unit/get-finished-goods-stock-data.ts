import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type FinishedGoodsStockItem = {
  productId: string;
  productCode: string;
  productName: string;
  unitOfMeasure: string;
  quantityOnHand: string;
  totalValue: string;
  averageUnitCost: string;
};

export type FinishedGoodsMovementItem = {
  id: string;
  movementDate: string;
  batchCode: string | null;
  productName: string;
  movementDirection: "IN" | "OUT";
  movementSource: string;
  quantity: string;
  unitOfMeasure: string;
  unitCost: string;
  totalAmount: string;
};

type FinishedGoodsStockRow = {
  product_id: string;
  product_code: string;
  product_name: string;
  unit_of_measure: string;
  quantity_on_hand: string;
  total_value: string;
  average_unit_cost: string;
};

type FinishedGoodsMovementRow = {
  id: string;
  movement_date: string;
  batch_code: string | null;
  product_name: string;
  movement_direction: "IN" | "OUT";
  movement_source: string;
  quantity: string;
  unit_of_measure: string;
  unit_cost: string;
  total_amount: string;
};

export async function getFinishedGoodsStockList(
  context: UnitWorkContext
): Promise<FinishedGoodsStockItem[]> {
  const result = await db.query<FinishedGoodsStockRow>(
    `
      WITH movement_summary AS (
        SELECT
          psm.product_id,
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
          AND psm.item_type = 'PRODUCT'
        GROUP BY psm.product_id
      )
      SELECT
        pp.id::text AS product_id,
        pp.code AS product_code,
        pp.name AS product_name,
        pp.unit_of_measure,
        COALESCE(ms.quantity_on_hand, 0)::text AS quantity_on_hand,
        COALESCE(ms.total_value, 0)::text AS total_value,
        CASE
          WHEN COALESCE(ms.quantity_on_hand, 0) > 0
          THEN (COALESCE(ms.total_value, 0) / ms.quantity_on_hand)::numeric(24,6)
          ELSE 0::numeric(24,6)
        END::text AS average_unit_cost
      FROM production_product pp
      LEFT JOIN movement_summary ms
        ON ms.product_id = pp.id
      WHERE pp.bum_desa_id = $1::uuid
        AND pp.unit_usaha_id = $2::uuid
        AND pp.is_active = TRUE
      ORDER BY pp.name ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    productId: row.product_id,
    productCode: row.product_code,
    productName: row.product_name,
    unitOfMeasure: row.unit_of_measure,
    quantityOnHand: row.quantity_on_hand,
    totalValue: row.total_value,
    averageUnitCost: row.average_unit_cost,
  }));
}

export async function getFinishedGoodsMovementList(
  context: UnitWorkContext
): Promise<FinishedGoodsMovementItem[]> {
  const result = await db.query<FinishedGoodsMovementRow>(
    `
      SELECT
        psm.id::text AS id,
        psm.movement_date::text AS movement_date,
        pb.code AS batch_code,
        pp.name AS product_name,
        psm.movement_direction,
        psm.movement_source,
        psm.quantity::text AS quantity,
        psm.unit_of_measure,
        psm.unit_cost::text AS unit_cost,
        psm.total_amount::text AS total_amount
      FROM production_stock_movement psm
      JOIN production_product pp
        ON pp.id = psm.product_id
      LEFT JOIN production_batch pb
        ON pb.id = psm.production_batch_id
      WHERE psm.bum_desa_id = $1::uuid
        AND psm.unit_usaha_id = $2::uuid
        AND psm.item_type = 'PRODUCT'
      ORDER BY psm.movement_date DESC, psm.created_at DESC
      LIMIT 30
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    movementDate: row.movement_date,
    batchCode: row.batch_code,
    productName: row.product_name,
    movementDirection: row.movement_direction,
    movementSource: row.movement_source,
    quantity: row.quantity,
    unitOfMeasure: row.unit_of_measure,
    unitCost: row.unit_cost,
    totalAmount: row.total_amount,
  }));
}