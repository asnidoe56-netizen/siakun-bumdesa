-- 017_fix_production_cost_precision.sql
-- Avoid rounding differences in production costing.
-- Store production cost precision at database level, then let frontend format it.

BEGIN;

ALTER TABLE production_batch_material
  DROP COLUMN IF EXISTS total_cost;

ALTER TABLE production_batch_material
  ALTER COLUMN unit_cost TYPE numeric(18,6)
  USING unit_cost::numeric(18,6);

ALTER TABLE production_batch_material
  ADD COLUMN total_cost numeric(24,6)
  GENERATED ALWAYS AS ((actual_quantity * unit_cost)::numeric(24,6)) STORED;

ALTER TABLE production_stock_movement
  DROP COLUMN IF EXISTS total_amount;

ALTER TABLE production_stock_movement
  ALTER COLUMN unit_cost TYPE numeric(18,6)
  USING unit_cost::numeric(18,6);

ALTER TABLE production_stock_movement
  ADD COLUMN total_amount numeric(24,6)
  GENERATED ALWAYS AS ((quantity * unit_cost)::numeric(24,6)) STORED;

WITH output_cost AS (
  SELECT
    pb.id AS production_batch_id,
    CASE
      WHEN pb.output_quantity > 0
      THEN (COALESCE(SUM(pbm.total_cost), 0) / pb.output_quantity)::numeric(18,6)
      ELSE 0::numeric(18,6)
    END AS recalculated_unit_cost
  FROM production_batch pb
  LEFT JOIN production_batch_material pbm
    ON pbm.production_batch_id = pb.id
  GROUP BY pb.id, pb.output_quantity
)
UPDATE production_stock_movement psm
SET
  unit_cost = output_cost.recalculated_unit_cost,
  updated_at = now()
FROM output_cost
WHERE psm.production_batch_id = output_cost.production_batch_id
  AND psm.item_type = 'PRODUCT'
  AND psm.movement_direction = 'IN'
  AND psm.movement_source = 'PRODUCTION_OUTPUT';

UPDATE production_formula_line pfl
SET
  notes = '100 ekor x 110 gram pakan per ekor per hari = 11 KG.',
  updated_at = now()
FROM production_material pm
WHERE pfl.material_id = pm.id
  AND pm.code = 'PAKAN-AYAM-001'
  AND pfl.notes LIKE '%=11 KG%';

COMMIT;
