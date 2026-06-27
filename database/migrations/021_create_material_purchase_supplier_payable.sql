-- Create supplier, material purchase, supplier payable, and supplier payment module.
-- This module reuses production_stock_movement for material stock-in from purchases.

ALTER TABLE production_stock_movement
  DROP CONSTRAINT IF EXISTS production_stock_movement_source_check;

ALTER TABLE production_stock_movement
  ADD CONSTRAINT production_stock_movement_source_check
  CHECK (
    movement_source IN (
      'PRODUCTION_OUTPUT',
      'PRODUCTION_MATERIAL_USAGE',
      'ADJUSTMENT',
      'PRODUCT_SALE',
      'MATERIAL_PURCHASE'
    )
  );

CREATE TABLE IF NOT EXISTS supplier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone text,
  address text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT supplier_unit_bumdes_fkey
    FOREIGN KEY (unit_usaha_id, bum_desa_id)
    REFERENCES unit_usaha(id, bum_desa_id)
    ON DELETE CASCADE,

  CONSTRAINT supplier_context_key
    UNIQUE (id, bum_desa_id, unit_usaha_id),

  CONSTRAINT supplier_unit_code_key
    UNIQUE (unit_usaha_id, code),

  CONSTRAINT supplier_unit_name_key
    UNIQUE (unit_usaha_id, name),

  CONSTRAINT supplier_code_not_blank_check
    CHECK (length(trim(code)) > 0),

  CONSTRAINT supplier_name_not_blank_check
    CHECK (length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS material_purchase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  code text NOT NULL,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  invoice_number text,
  payment_method text NOT NULL DEFAULT 'CASH',
  payment_status text NOT NULL DEFAULT 'PAID',
  cash_account_code text NOT NULL DEFAULT '1.1.01.01',
  payable_account_code text NOT NULL DEFAULT '2.1.01.01',
  total_purchase_amount numeric(24,6) NOT NULL DEFAULT 0,
  journal_header_id uuid,
  notes text,
  status text NOT NULL DEFAULT 'POSTED',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT material_purchase_unit_bumdes_fkey
    FOREIGN KEY (unit_usaha_id, bum_desa_id)
    REFERENCES unit_usaha(id, bum_desa_id)
    ON DELETE CASCADE,

  CONSTRAINT material_purchase_supplier_context_fkey
    FOREIGN KEY (supplier_id, bum_desa_id, unit_usaha_id)
    REFERENCES supplier(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,

  CONSTRAINT material_purchase_journal_header_fkey
    FOREIGN KEY (journal_header_id)
    REFERENCES journal_header(id)
    ON DELETE SET NULL,

  CONSTRAINT material_purchase_context_key
    UNIQUE (id, bum_desa_id, unit_usaha_id),

  CONSTRAINT material_purchase_unit_code_key
    UNIQUE (unit_usaha_id, code),

  CONSTRAINT material_purchase_code_not_blank_check
    CHECK (length(trim(code)) > 0),

  CONSTRAINT material_purchase_payment_method_check
    CHECK (payment_method IN ('CASH', 'CREDIT')),

  CONSTRAINT material_purchase_payment_status_check
    CHECK (payment_status IN ('PAID', 'UNPAID', 'PARTIAL')),

  CONSTRAINT material_purchase_status_check
    CHECK (status IN ('POSTED', 'VOID')),

  CONSTRAINT material_purchase_total_amount_check
    CHECK (total_purchase_amount >= 0),

  CONSTRAINT material_purchase_cash_account_not_blank_check
    CHECK (length(trim(cash_account_code)) > 0),

  CONSTRAINT material_purchase_payable_account_not_blank_check
    CHECK (length(trim(payable_account_code)) > 0)
);

CREATE TABLE IF NOT EXISTS material_purchase_line (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL,
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  material_id uuid NOT NULL,
  stock_movement_id uuid,
  line_number integer NOT NULL DEFAULT 1,
  quantity numeric(18,4) NOT NULL,
  unit_of_measure text NOT NULL,
  unit_cost numeric(18,6) NOT NULL DEFAULT 0,
  purchase_amount numeric(24,6) NOT NULL DEFAULT 0,
  inventory_account_code text NOT NULL DEFAULT '1.1.05.02',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT material_purchase_line_purchase_context_fkey
    FOREIGN KEY (purchase_id, bum_desa_id, unit_usaha_id)
    REFERENCES material_purchase(id, bum_desa_id, unit_usaha_id)
    ON DELETE CASCADE,

  CONSTRAINT material_purchase_line_material_context_fkey
    FOREIGN KEY (material_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_material(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,

  CONSTRAINT material_purchase_line_stock_movement_fkey
    FOREIGN KEY (stock_movement_id)
    REFERENCES production_stock_movement(id)
    ON DELETE SET NULL,

  CONSTRAINT material_purchase_line_purchase_number_key
    UNIQUE (purchase_id, line_number),

  CONSTRAINT material_purchase_line_stock_movement_key
    UNIQUE (stock_movement_id),

  CONSTRAINT material_purchase_line_quantity_check
    CHECK (quantity > 0),

  CONSTRAINT material_purchase_line_unit_not_blank_check
    CHECK (length(trim(unit_of_measure)) > 0),

  CONSTRAINT material_purchase_line_unit_cost_check
    CHECK (unit_cost >= 0),

  CONSTRAINT material_purchase_line_amount_check
    CHECK (purchase_amount >= 0),

  CONSTRAINT material_purchase_line_inventory_account_not_blank_check
    CHECK (length(trim(inventory_account_code)) > 0)
);

CREATE TABLE IF NOT EXISTS supplier_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  purchase_id uuid NOT NULL,
  code text NOT NULL,
  payable_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  original_amount numeric(24,6) NOT NULL,
  paid_amount numeric(24,6) NOT NULL DEFAULT 0,
  outstanding_amount numeric(24,6) NOT NULL DEFAULT 0,
  payable_account_code text NOT NULL DEFAULT '2.1.01.01',
  status text NOT NULL DEFAULT 'UNPAID',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT supplier_payable_supplier_context_fkey
    FOREIGN KEY (supplier_id, bum_desa_id, unit_usaha_id)
    REFERENCES supplier(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,

  CONSTRAINT supplier_payable_purchase_context_fkey
    FOREIGN KEY (purchase_id, bum_desa_id, unit_usaha_id)
    REFERENCES material_purchase(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,

  CONSTRAINT supplier_payable_context_key
    UNIQUE (id, bum_desa_id, unit_usaha_id),

  CONSTRAINT supplier_payable_purchase_key
    UNIQUE (purchase_id),

  CONSTRAINT supplier_payable_unit_code_key
    UNIQUE (unit_usaha_id, code),

  CONSTRAINT supplier_payable_code_not_blank_check
    CHECK (length(trim(code)) > 0),

  CONSTRAINT supplier_payable_original_amount_check
    CHECK (original_amount > 0),

  CONSTRAINT supplier_payable_paid_amount_check
    CHECK (paid_amount >= 0),

  CONSTRAINT supplier_payable_outstanding_amount_check
    CHECK (outstanding_amount >= 0),

  CONSTRAINT supplier_payable_amount_consistency_check
    CHECK (
      paid_amount <= original_amount
      AND outstanding_amount <= original_amount
    ),

  CONSTRAINT supplier_payable_status_check
    CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID', 'VOID')),

  CONSTRAINT supplier_payable_account_not_blank_check
    CHECK (length(trim(payable_account_code)) > 0)
);

CREATE TABLE IF NOT EXISTS supplier_payment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  code text NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'CASH',
  cash_account_code text NOT NULL DEFAULT '1.1.01.01',
  total_payment_amount numeric(24,6) NOT NULL DEFAULT 0,
  journal_header_id uuid,
  notes text,
  status text NOT NULL DEFAULT 'POSTED',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT supplier_payment_unit_bumdes_fkey
    FOREIGN KEY (unit_usaha_id, bum_desa_id)
    REFERENCES unit_usaha(id, bum_desa_id)
    ON DELETE CASCADE,

  CONSTRAINT supplier_payment_supplier_context_fkey
    FOREIGN KEY (supplier_id, bum_desa_id, unit_usaha_id)
    REFERENCES supplier(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,

  CONSTRAINT supplier_payment_journal_header_fkey
    FOREIGN KEY (journal_header_id)
    REFERENCES journal_header(id)
    ON DELETE SET NULL,

  CONSTRAINT supplier_payment_context_key
    UNIQUE (id, bum_desa_id, unit_usaha_id),

  CONSTRAINT supplier_payment_unit_code_key
    UNIQUE (unit_usaha_id, code),

  CONSTRAINT supplier_payment_code_not_blank_check
    CHECK (length(trim(code)) > 0),

  CONSTRAINT supplier_payment_method_check
    CHECK (payment_method IN ('CASH', 'BANK_TRANSFER')),

  CONSTRAINT supplier_payment_total_amount_check
    CHECK (total_payment_amount > 0),

  CONSTRAINT supplier_payment_status_check
    CHECK (status IN ('POSTED', 'VOID')),

  CONSTRAINT supplier_payment_cash_account_not_blank_check
    CHECK (length(trim(cash_account_code)) > 0)
);

CREATE TABLE IF NOT EXISTS supplier_payment_line (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_payment_id uuid NOT NULL,
  supplier_payable_id uuid NOT NULL,
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  line_number integer NOT NULL DEFAULT 1,
  payment_amount numeric(24,6) NOT NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT supplier_payment_line_payment_context_fkey
    FOREIGN KEY (supplier_payment_id, bum_desa_id, unit_usaha_id)
    REFERENCES supplier_payment(id, bum_desa_id, unit_usaha_id)
    ON DELETE CASCADE,

  CONSTRAINT supplier_payment_line_payable_context_fkey
    FOREIGN KEY (supplier_payable_id, bum_desa_id, unit_usaha_id)
    REFERENCES supplier_payable(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,

  CONSTRAINT supplier_payment_line_payment_number_key
    UNIQUE (supplier_payment_id, line_number),

  CONSTRAINT supplier_payment_line_payment_payable_key
    UNIQUE (supplier_payment_id, supplier_payable_id),

  CONSTRAINT supplier_payment_line_amount_check
    CHECK (payment_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_supplier_context_active
  ON supplier (bum_desa_id, unit_usaha_id, is_active, name);

CREATE INDEX IF NOT EXISTS idx_material_purchase_context_date
  ON material_purchase (bum_desa_id, unit_usaha_id, purchase_date DESC);

CREATE INDEX IF NOT EXISTS idx_material_purchase_supplier
  ON material_purchase (supplier_id);

CREATE INDEX IF NOT EXISTS idx_material_purchase_journal
  ON material_purchase (journal_header_id);

CREATE INDEX IF NOT EXISTS idx_material_purchase_line_purchase
  ON material_purchase_line (purchase_id, line_number);

CREATE INDEX IF NOT EXISTS idx_material_purchase_line_material
  ON material_purchase_line (material_id);

CREATE INDEX IF NOT EXISTS idx_material_purchase_line_stock_movement
  ON material_purchase_line (stock_movement_id);

CREATE INDEX IF NOT EXISTS idx_supplier_payable_supplier_status
  ON supplier_payable (bum_desa_id, unit_usaha_id, supplier_id, status);

CREATE INDEX IF NOT EXISTS idx_supplier_payable_purchase
  ON supplier_payable (purchase_id);

CREATE INDEX IF NOT EXISTS idx_supplier_payment_supplier_date
  ON supplier_payment (bum_desa_id, unit_usaha_id, supplier_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_payment_journal
  ON supplier_payment (journal_header_id);

CREATE INDEX IF NOT EXISTS idx_supplier_payment_line_payment
  ON supplier_payment_line (supplier_payment_id, line_number);

CREATE INDEX IF NOT EXISTS idx_supplier_payment_line_payable
  ON supplier_payment_line (supplier_payable_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_supplier_updated_at'
  ) THEN
    CREATE TRIGGER trg_supplier_updated_at
    BEFORE UPDATE ON supplier
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_material_purchase_updated_at'
  ) THEN
    CREATE TRIGGER trg_material_purchase_updated_at
    BEFORE UPDATE ON material_purchase
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_material_purchase_line_updated_at'
  ) THEN
    CREATE TRIGGER trg_material_purchase_line_updated_at
    BEFORE UPDATE ON material_purchase_line
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_supplier_payable_updated_at'
  ) THEN
    CREATE TRIGGER trg_supplier_payable_updated_at
    BEFORE UPDATE ON supplier_payable
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_supplier_payment_updated_at'
  ) THEN
    CREATE TRIGGER trg_supplier_payment_updated_at
    BEFORE UPDATE ON supplier_payment
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_supplier_payment_line_updated_at'
  ) THEN
    CREATE TRIGGER trg_supplier_payment_line_updated_at
    BEFORE UPDATE ON supplier_payment_line
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
