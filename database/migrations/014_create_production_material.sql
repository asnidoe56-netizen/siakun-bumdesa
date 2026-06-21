-- 014_create_production_material.sql
-- Production material/component master data per BUMDes/unit.
-- This is tenant/unit data, not global template data.

BEGIN;

CREATE TABLE IF NOT EXISTS production_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  material_type text NOT NULL DEFAULT 'BAHAN_BAKU',
  unit_of_measure text NOT NULL DEFAULT 'unit',
  default_unit_cost numeric(18,2) NOT NULL DEFAULT 0,
  is_stocked boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT production_material_unit_bumdes_fkey
    FOREIGN KEY (unit_usaha_id, bum_desa_id)
    REFERENCES unit_usaha(id, bum_desa_id)
    ON DELETE CASCADE,
  CONSTRAINT production_material_type_check
    CHECK (material_type IN ('BAHAN_BAKU', 'KEMASAN', 'BAHAN_PENDUKUNG', 'BARANG_PAKAI_HABIS')),
  CONSTRAINT production_material_default_unit_cost_check
    CHECK (default_unit_cost >= 0),
  CONSTRAINT production_material_code_not_blank_check
    CHECK (length(trim(code)) > 0),
  CONSTRAINT production_material_name_not_blank_check
    CHECK (length(trim(name)) > 0),
  CONSTRAINT production_material_unit_code_key
    UNIQUE (unit_usaha_id, code),
  CONSTRAINT production_material_unit_name_key
    UNIQUE (unit_usaha_id, name)
);

CREATE INDEX IF NOT EXISTS idx_production_material_bumdes_unit
  ON production_material (bum_desa_id, unit_usaha_id, is_active, name);

CREATE INDEX IF NOT EXISTS idx_production_material_type
  ON production_material (material_type);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_production_material_updated_at'
  ) THEN
    CREATE TRIGGER trg_production_material_updated_at
    BEFORE UPDATE ON production_material
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

COMMIT;
