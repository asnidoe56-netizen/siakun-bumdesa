-- 015_create_production_formula.sql
-- Production formula/recipe per BUMDes/unit.
-- This connects finished goods products to standard material/component usage.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'production_product_id_bumdesa_unit_key'
  ) THEN
    ALTER TABLE production_product
      ADD CONSTRAINT production_product_id_bumdesa_unit_key
      UNIQUE (id, bum_desa_id, unit_usaha_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'production_material_id_bumdesa_unit_key'
  ) THEN
    ALTER TABLE production_material
      ADD CONSTRAINT production_material_id_bumdesa_unit_key
      UNIQUE (id, bum_desa_id, unit_usaha_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS production_formula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  product_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  output_quantity numeric(18,4) NOT NULL DEFAULT 1,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT production_formula_unit_bumdes_fkey
    FOREIGN KEY (unit_usaha_id, bum_desa_id)
    REFERENCES unit_usaha(id, bum_desa_id)
    ON DELETE CASCADE,
  CONSTRAINT production_formula_product_context_fkey
    FOREIGN KEY (product_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_product(id, bum_desa_id, unit_usaha_id)
    ON DELETE CASCADE,
  CONSTRAINT production_formula_output_quantity_check
    CHECK (output_quantity > 0),
  CONSTRAINT production_formula_code_not_blank_check
    CHECK (length(trim(code)) > 0),
  CONSTRAINT production_formula_name_not_blank_check
    CHECK (length(trim(name)) > 0),
  CONSTRAINT production_formula_unit_code_key
    UNIQUE (unit_usaha_id, code),
  CONSTRAINT production_formula_unit_product_name_key
    UNIQUE (unit_usaha_id, product_id, name),
  CONSTRAINT production_formula_id_bumdesa_unit_key
    UNIQUE (id, bum_desa_id, unit_usaha_id)
);

CREATE INDEX IF NOT EXISTS idx_production_formula_bumdes_unit
  ON production_formula (bum_desa_id, unit_usaha_id, is_active, name);

CREATE INDEX IF NOT EXISTS idx_production_formula_product
  ON production_formula (product_id, is_active);

CREATE UNIQUE INDEX IF NOT EXISTS production_formula_one_default_per_product
  ON production_formula (product_id)
  WHERE is_default = true AND is_active = true;

CREATE TABLE IF NOT EXISTS production_formula_line (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id uuid NOT NULL,
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  material_id uuid NOT NULL,
  quantity numeric(18,4) NOT NULL,
  wastage_percent numeric(7,4) NOT NULL DEFAULT 0,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT production_formula_line_formula_context_fkey
    FOREIGN KEY (formula_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_formula(id, bum_desa_id, unit_usaha_id)
    ON DELETE CASCADE,
  CONSTRAINT production_formula_line_material_context_fkey
    FOREIGN KEY (material_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_material(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,
  CONSTRAINT production_formula_line_quantity_check
    CHECK (quantity > 0),
  CONSTRAINT production_formula_line_wastage_percent_check
    CHECK (wastage_percent >= 0 AND wastage_percent <= 100),
  CONSTRAINT production_formula_line_formula_material_key
    UNIQUE (formula_id, material_id)
);

CREATE INDEX IF NOT EXISTS idx_production_formula_line_formula
  ON production_formula_line (formula_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_production_formula_line_material
  ON production_formula_line (material_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_production_formula_updated_at'
  ) THEN
    CREATE TRIGGER trg_production_formula_updated_at
    BEFORE UPDATE ON production_formula
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_production_formula_line_updated_at'
  ) THEN
    CREATE TRIGGER trg_production_formula_line_updated_at
    BEFORE UPDATE ON production_formula_line
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

COMMIT;
