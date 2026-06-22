-- 016_create_production_batch.sql
-- Production recording tables.
-- This records production output, material usage, and stock movement foundation.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'production_formula_id_product_bumdesa_unit_key'
  ) THEN
    ALTER TABLE production_formula
      ADD CONSTRAINT production_formula_id_product_bumdesa_unit_key
      UNIQUE (id, product_id, bum_desa_id, unit_usaha_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS production_batch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  formula_id uuid NOT NULL,
  product_id uuid NOT NULL,
  code text NOT NULL,
  production_date date NOT NULL DEFAULT CURRENT_DATE,
  output_quantity numeric(18,4) NOT NULL,
  output_unit_of_measure text NOT NULL,
  status text NOT NULL DEFAULT 'POSTED',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT production_batch_unit_bumdes_fkey
    FOREIGN KEY (unit_usaha_id, bum_desa_id)
    REFERENCES unit_usaha(id, bum_desa_id)
    ON DELETE CASCADE,
  CONSTRAINT production_batch_formula_context_fkey
    FOREIGN KEY (formula_id, product_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_formula(id, product_id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,
  CONSTRAINT production_batch_product_context_fkey
    FOREIGN KEY (product_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_product(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,
  CONSTRAINT production_batch_output_quantity_check
    CHECK (output_quantity > 0),
  CONSTRAINT production_batch_code_not_blank_check
    CHECK (length(trim(code)) > 0),
  CONSTRAINT production_batch_output_unit_not_blank_check
    CHECK (length(trim(output_unit_of_measure)) > 0),
  CONSTRAINT production_batch_status_check
    CHECK (status IN ('DRAFT', 'POSTED', 'VOID')),
  CONSTRAINT production_batch_unit_code_key
    UNIQUE (unit_usaha_id, code),
  CONSTRAINT production_batch_id_bumdesa_unit_key
    UNIQUE (id, bum_desa_id, unit_usaha_id)
);

CREATE INDEX IF NOT EXISTS idx_production_batch_bumdes_unit_date
  ON production_batch (bum_desa_id, unit_usaha_id, production_date DESC);

CREATE INDEX IF NOT EXISTS idx_production_batch_formula
  ON production_batch (formula_id, status);

CREATE TABLE IF NOT EXISTS production_batch_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_batch_id uuid NOT NULL,
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  material_id uuid NOT NULL,
  formula_line_id uuid,
  planned_quantity numeric(18,4) NOT NULL DEFAULT 0,
  actual_quantity numeric(18,4) NOT NULL,
  unit_of_measure text NOT NULL,
  unit_cost numeric(18,2) NOT NULL DEFAULT 0,
  total_cost numeric(18,2) GENERATED ALWAYS AS ((actual_quantity * unit_cost)::numeric(18,2)) STORED,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT production_batch_material_batch_context_fkey
    FOREIGN KEY (production_batch_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_batch(id, bum_desa_id, unit_usaha_id)
    ON DELETE CASCADE,
  CONSTRAINT production_batch_material_material_context_fkey
    FOREIGN KEY (material_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_material(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,
  CONSTRAINT production_batch_material_formula_line_fkey
    FOREIGN KEY (formula_line_id)
    REFERENCES production_formula_line(id)
    ON DELETE SET NULL,
  CONSTRAINT production_batch_material_actual_quantity_check
    CHECK (actual_quantity > 0),
  CONSTRAINT production_batch_material_planned_quantity_check
    CHECK (planned_quantity >= 0),
  CONSTRAINT production_batch_material_unit_cost_check
    CHECK (unit_cost >= 0),
  CONSTRAINT production_batch_material_unit_not_blank_check
    CHECK (length(trim(unit_of_measure)) > 0),
  CONSTRAINT production_batch_material_batch_material_key
    UNIQUE (production_batch_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_production_batch_material_batch
  ON production_batch_material (production_batch_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_production_batch_material_material
  ON production_batch_material (material_id);

CREATE TABLE IF NOT EXISTS production_stock_movement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  production_batch_id uuid,
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  item_type text NOT NULL,
  product_id uuid,
  material_id uuid,
  movement_direction text NOT NULL,
  movement_source text NOT NULL,
  quantity numeric(18,4) NOT NULL,
  unit_of_measure text NOT NULL,
  unit_cost numeric(18,2) NOT NULL DEFAULT 0,
  total_amount numeric(18,2) GENERATED ALWAYS AS ((quantity * unit_cost)::numeric(18,2)) STORED,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT production_stock_movement_batch_context_fkey
    FOREIGN KEY (production_batch_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_batch(id, bum_desa_id, unit_usaha_id)
    ON DELETE CASCADE,
  CONSTRAINT production_stock_movement_product_context_fkey
    FOREIGN KEY (product_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_product(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,
  CONSTRAINT production_stock_movement_material_context_fkey
    FOREIGN KEY (material_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_material(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,
  CONSTRAINT production_stock_movement_item_type_check
    CHECK (item_type IN ('PRODUCT', 'MATERIAL')),
  CONSTRAINT production_stock_movement_direction_check
    CHECK (movement_direction IN ('IN', 'OUT')),
  CONSTRAINT production_stock_movement_source_check
    CHECK (movement_source IN ('PRODUCTION_OUTPUT', 'PRODUCTION_MATERIAL_USAGE', 'ADJUSTMENT')),
  CONSTRAINT production_stock_movement_quantity_check
    CHECK (quantity > 0),
  CONSTRAINT production_stock_movement_unit_cost_check
    CHECK (unit_cost >= 0),
  CONSTRAINT production_stock_movement_unit_not_blank_check
    CHECK (length(trim(unit_of_measure)) > 0),
  CONSTRAINT production_stock_movement_item_reference_check
    CHECK (
      (item_type = 'PRODUCT' AND product_id IS NOT NULL AND material_id IS NULL)
      OR
      (item_type = 'MATERIAL' AND material_id IS NOT NULL AND product_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_production_stock_movement_bumdes_unit_date
  ON production_stock_movement (bum_desa_id, unit_usaha_id, movement_date DESC);

CREATE INDEX IF NOT EXISTS idx_production_stock_movement_product
  ON production_stock_movement (product_id, movement_direction);

CREATE INDEX IF NOT EXISTS idx_production_stock_movement_material
  ON production_stock_movement (material_id, movement_direction);

CREATE INDEX IF NOT EXISTS idx_production_stock_movement_batch
  ON production_stock_movement (production_batch_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_production_batch_updated_at'
  ) THEN
    CREATE TRIGGER trg_production_batch_updated_at
    BEFORE UPDATE ON production_batch
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_production_batch_material_updated_at'
  ) THEN
    CREATE TRIGGER trg_production_batch_material_updated_at
    BEFORE UPDATE ON production_batch_material
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_production_stock_movement_updated_at'
  ) THEN
    CREATE TRIGGER trg_production_stock_movement_updated_at
    BEFORE UPDATE ON production_stock_movement
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

COMMIT;
