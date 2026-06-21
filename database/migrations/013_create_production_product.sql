-- 013_create_production_product.sql
-- Production product master data per BUMDes/unit.
-- This is tenant/unit data, not global template data.

BEGIN;

CREATE TABLE IF NOT EXISTS production_product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  business_revenue_mapping_id uuid NOT NULL REFERENCES business_revenue_mapping(id) ON DELETE RESTRICT,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  unit_of_measure text NOT NULL DEFAULT 'unit',
  default_selling_price numeric(18,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT production_product_unit_bumdes_fkey
    FOREIGN KEY (unit_usaha_id, bum_desa_id)
    REFERENCES unit_usaha(id, bum_desa_id)
    ON DELETE CASCADE,
  CONSTRAINT production_product_default_selling_price_check
    CHECK (default_selling_price >= 0),
  CONSTRAINT production_product_code_not_blank_check
    CHECK (length(trim(code)) > 0),
  CONSTRAINT production_product_name_not_blank_check
    CHECK (length(trim(name)) > 0),
  CONSTRAINT production_product_unit_code_key
    UNIQUE (unit_usaha_id, code),
  CONSTRAINT production_product_unit_name_key
    UNIQUE (unit_usaha_id, name)
);

CREATE INDEX IF NOT EXISTS idx_production_product_bumdes_unit
  ON production_product (bum_desa_id, unit_usaha_id, is_active, name);

CREATE INDEX IF NOT EXISTS idx_production_product_revenue_mapping
  ON production_product (business_revenue_mapping_id);

CREATE OR REPLACE FUNCTION ensure_production_product_revenue_mapping()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM business_revenue_mapping brm
    JOIN business_unit_category buc ON buc.id = brm.business_category_id
    WHERE brm.id = NEW.business_revenue_mapping_id
      AND buc.code = 'PRODUKSI_BARANG_JADI'
      AND brm.is_active = true
      AND buc.is_active = true
  ) THEN
    RAISE EXCEPTION 'Produk produksi wajib memakai mapping pendapatan aktif dari kategori PRODUKSI_BARANG_JADI.';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_production_product_updated_at'
  ) THEN
    CREATE TRIGGER trg_production_product_updated_at
    BEFORE UPDATE ON production_product
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_ensure_production_product_revenue_mapping'
  ) THEN
    CREATE TRIGGER trg_ensure_production_product_revenue_mapping
    BEFORE INSERT OR UPDATE OF business_revenue_mapping_id ON production_product
    FOR EACH ROW EXECUTE FUNCTION ensure_production_product_revenue_mapping();
  END IF;
END $$;

COMMIT;