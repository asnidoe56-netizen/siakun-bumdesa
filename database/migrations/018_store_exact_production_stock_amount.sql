-- 018_store_exact_production_stock_amount.sql
-- Store stock movement total amount explicitly to avoid rounding drift.
-- Product output value must equal the exact total material cost of the production batch.

BEGIN;

ALTER TABLE production_stock_movement
  ADD COLUMN IF NOT EXISTS total_amount_exact numeric(24,6);

UPDATE production_stock_movement
SET total_amount_exact = total_amount;

ALTER TABLE production_stock_movement
  DROP COLUMN total_amount;

ALTER TABLE production_stock_movement
  RENAME COLUMN total_amount_exact TO total_amount;

ALTER TABLE production_stock_movement
  ALTER COLUMN total_amount SET NOT NULL;

ALTER TABLE production_stock_movement
  ALTER COLUMN total_amount SET DEFAULT 0;

ALTER TABLE production_stock_movement
  ADD CONSTRAINT production_stock_movement_total_amount_check
  CHECK (total_amount >= 0);

UPDATE production_stock_movement psm
SET
  total_amount = (psm.quantity * psm.unit_cost)::numeric(24,6),
  updated_at = now()
WHERE psm.item_type = 'MATERIAL'
  AND psm.movement_direction = 'OUT'
  AND psm.movement_source = 'PRODUCTION_MATERIAL_USAGE';

WITH material_cost AS (
  SELECT
    pb.id AS production_batch_id,
    COALESCE(SUM(pbm.total_cost), 0)::numeric(24,6) AS exact_total_material_cost
  FROM production_batch pb
  LEFT JOIN production_batch_material pbm
    ON pbm.production_batch_id = pb.id
  GROUP BY pb.id
)
UPDATE production_stock_movement psm
SET
  total_amount = material_cost.exact_total_material_cost,
  unit_cost = CASE
    WHEN psm.quantity > 0
    THEN (material_cost.exact_total_material_cost / psm.quantity)::numeric(18,6)
    ELSE 0::numeric(18,6)
  END,
  updated_at = now()
FROM material_cost
WHERE psm.production_batch_id = material_cost.production_batch_id
  AND psm.item_type = 'PRODUCT'
  AND psm.movement_direction = 'IN'
  AND psm.movement_source = 'PRODUCTION_OUTPUT';

COMMIT;
