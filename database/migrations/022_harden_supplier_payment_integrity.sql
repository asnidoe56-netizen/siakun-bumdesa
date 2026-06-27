-- Harden supplier payment integrity.
-- This prevents supplier payments from being allocated to payables owned by a different supplier,
-- and enforces supplier payable outstanding balance consistency.

UPDATE supplier_payable
SET outstanding_amount = original_amount - paid_amount
WHERE outstanding_amount <> original_amount - paid_amount;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'supplier_payable_outstanding_formula_check'
      AND conrelid = 'supplier_payable'::regclass
  ) THEN
    ALTER TABLE supplier_payable
      ADD CONSTRAINT supplier_payable_outstanding_formula_check
      CHECK (outstanding_amount = original_amount - paid_amount);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION validate_supplier_payment_line_supplier_match()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  payment_supplier_id uuid;
  payable_supplier_id uuid;
BEGIN
  SELECT supplier_id
  INTO payment_supplier_id
  FROM supplier_payment
  WHERE id = NEW.supplier_payment_id
    AND bum_desa_id = NEW.bum_desa_id
    AND unit_usaha_id = NEW.unit_usaha_id;

  SELECT supplier_id
  INTO payable_supplier_id
  FROM supplier_payable
  WHERE id = NEW.supplier_payable_id
    AND bum_desa_id = NEW.bum_desa_id
    AND unit_usaha_id = NEW.unit_usaha_id;

  IF payment_supplier_id IS NULL THEN
    RAISE EXCEPTION 'supplier_payment_line references an invalid supplier_payment context';
  END IF;

  IF payable_supplier_id IS NULL THEN
    RAISE EXCEPTION 'supplier_payment_line references an invalid supplier_payable context';
  END IF;

  IF payment_supplier_id <> payable_supplier_id THEN
    RAISE EXCEPTION 'supplier_payment_line supplier mismatch: payment supplier % cannot pay payable supplier %',
      payment_supplier_id,
      payable_supplier_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_supplier_payment_line_supplier_match'
  ) THEN
    CREATE TRIGGER trg_supplier_payment_line_supplier_match
    BEFORE INSERT OR UPDATE OF supplier_payment_id, supplier_payable_id, bum_desa_id, unit_usaha_id
    ON supplier_payment_line
    FOR EACH ROW
    EXECUTE FUNCTION validate_supplier_payment_line_supplier_match();
  END IF;
END $$;