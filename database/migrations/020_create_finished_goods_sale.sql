-- Create official finished goods sales documents.
-- This records the business document, while production_stock_movement records stock movement
-- and journal_header / journal_line record accounting impact.

CREATE TABLE IF NOT EXISTS production_finished_goods_sale (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  code text NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_name text,
  payment_method text NOT NULL DEFAULT 'CASH',
  payment_status text NOT NULL DEFAULT 'PAID',
  cash_account_code text NOT NULL DEFAULT '1.1.01.01',
  receivable_account_code text,
  total_sales_amount numeric(24,6) NOT NULL DEFAULT 0,
  total_cogs_amount numeric(24,6) NOT NULL DEFAULT 0,
  journal_header_id uuid,
  notes text,
  status text NOT NULL DEFAULT 'POSTED',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT production_finished_goods_sale_unit_bumdes_fkey
    FOREIGN KEY (unit_usaha_id, bum_desa_id)
    REFERENCES unit_usaha(id, bum_desa_id)
    ON DELETE CASCADE,

  CONSTRAINT production_finished_goods_sale_journal_header_fkey
    FOREIGN KEY (journal_header_id)
    REFERENCES journal_header(id)
    ON DELETE SET NULL,

  CONSTRAINT production_finished_goods_sale_context_key
    UNIQUE (id, bum_desa_id, unit_usaha_id),

  CONSTRAINT production_finished_goods_sale_unit_code_key
    UNIQUE (unit_usaha_id, code),

  CONSTRAINT production_finished_goods_sale_code_not_blank_check
    CHECK (length(trim(code)) > 0),

  CONSTRAINT production_finished_goods_sale_payment_method_check
    CHECK (payment_method IN ('CASH', 'CREDIT')),

  CONSTRAINT production_finished_goods_sale_payment_status_check
    CHECK (payment_status IN ('PAID', 'UNPAID', 'PARTIAL')),

  CONSTRAINT production_finished_goods_sale_status_check
    CHECK (status IN ('POSTED', 'VOID')),

  CONSTRAINT production_finished_goods_sale_total_sales_check
    CHECK (total_sales_amount >= 0),

  CONSTRAINT production_finished_goods_sale_total_cogs_check
    CHECK (total_cogs_amount >= 0),

  CONSTRAINT production_finished_goods_sale_cash_account_not_blank_check
    CHECK (length(trim(cash_account_code)) > 0)
);

CREATE TABLE IF NOT EXISTS production_finished_goods_sale_line (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  product_id uuid NOT NULL,
  stock_movement_id uuid,
  line_number integer NOT NULL DEFAULT 1,
  quantity numeric(18,4) NOT NULL,
  unit_of_measure text NOT NULL,
  selling_unit_price numeric(18,2) NOT NULL DEFAULT 0,
  sales_amount numeric(24,6) NOT NULL DEFAULT 0,
  unit_cost numeric(18,6) NOT NULL DEFAULT 0,
  cogs_amount numeric(24,6) NOT NULL DEFAULT 0,
  sales_revenue_account_code text NOT NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT production_finished_goods_sale_line_sale_context_fkey
    FOREIGN KEY (sale_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_finished_goods_sale(id, bum_desa_id, unit_usaha_id)
    ON DELETE CASCADE,

  CONSTRAINT production_finished_goods_sale_line_product_context_fkey
    FOREIGN KEY (product_id, bum_desa_id, unit_usaha_id)
    REFERENCES production_product(id, bum_desa_id, unit_usaha_id)
    ON DELETE RESTRICT,

  CONSTRAINT production_finished_goods_sale_line_stock_movement_fkey
    FOREIGN KEY (stock_movement_id)
    REFERENCES production_stock_movement(id)
    ON DELETE SET NULL,

  CONSTRAINT production_finished_goods_sale_line_sale_number_key
    UNIQUE (sale_id, line_number),

  CONSTRAINT production_finished_goods_sale_line_stock_movement_key
    UNIQUE (stock_movement_id),

  CONSTRAINT production_finished_goods_sale_line_quantity_check
    CHECK (quantity > 0),

  CONSTRAINT production_finished_goods_sale_line_unit_not_blank_check
    CHECK (length(trim(unit_of_measure)) > 0),

  CONSTRAINT production_finished_goods_sale_line_selling_price_check
    CHECK (selling_unit_price >= 0),

  CONSTRAINT production_finished_goods_sale_line_sales_amount_check
    CHECK (sales_amount >= 0),

  CONSTRAINT production_finished_goods_sale_line_unit_cost_check
    CHECK (unit_cost >= 0),

  CONSTRAINT production_finished_goods_sale_line_cogs_amount_check
    CHECK (cogs_amount >= 0),

  CONSTRAINT production_finished_goods_sale_line_revenue_account_not_blank_check
    CHECK (length(trim(sales_revenue_account_code)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_production_finished_goods_sale_context_date
  ON production_finished_goods_sale (bum_desa_id, unit_usaha_id, sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_production_finished_goods_sale_journal
  ON production_finished_goods_sale (journal_header_id);

CREATE INDEX IF NOT EXISTS idx_production_finished_goods_sale_line_sale
  ON production_finished_goods_sale_line (sale_id, line_number);

CREATE INDEX IF NOT EXISTS idx_production_finished_goods_sale_line_product
  ON production_finished_goods_sale_line (product_id);

CREATE INDEX IF NOT EXISTS idx_production_finished_goods_sale_line_stock_movement
  ON production_finished_goods_sale_line (stock_movement_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_production_finished_goods_sale_updated_at'
  ) THEN
    CREATE TRIGGER trg_production_finished_goods_sale_updated_at
    BEFORE UPDATE ON production_finished_goods_sale
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_production_finished_goods_sale_line_updated_at'
  ) THEN
    CREATE TRIGGER trg_production_finished_goods_sale_line_updated_at
    BEFORE UPDATE ON production_finished_goods_sale_line
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;