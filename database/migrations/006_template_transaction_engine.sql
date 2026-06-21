ALTER TYPE template_status ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE template_status ADD VALUE IF NOT EXISTS 'DEPRECATED';

ALTER TABLE template_transaksi
ADD COLUMN IF NOT EXISTS user_facing_name TEXT,
ADD COLUMN IF NOT EXISTS business_event_code TEXT,
ADD COLUMN IF NOT EXISTS input_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sumber_regulasi TEXT,
ADD COLUMN IF NOT EXISTS versi INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS status_note TEXT;

UPDATE template_transaksi
SET user_facing_name = nama
WHERE user_facing_name IS NULL;

ALTER TABLE template_transaksi
ALTER COLUMN user_facing_name SET NOT NULL;

ALTER TABLE template_jurnal_rule
ALTER COLUMN account_code DROP NOT NULL;

ALTER TABLE template_jurnal_rule
ADD COLUMN IF NOT EXISTS rule_label TEXT,
ADD COLUMN IF NOT EXISTS account_source TEXT NOT NULL DEFAULT 'FIXED_CODE',
ADD COLUMN IF NOT EXISTS account_input_key TEXT,
ADD COLUMN IF NOT EXISTS account_code_prefix TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE template_jurnal_rule
DROP CONSTRAINT IF EXISTS chk_template_jurnal_rule_account_source;

ALTER TABLE template_jurnal_rule
ADD CONSTRAINT chk_template_jurnal_rule_account_source
CHECK (
  account_source IN (
    'FIXED_CODE',
    'INPUT_ACCOUNT',
    'ACCOUNT_PREFIX'
  )
);

ALTER TABLE template_jurnal_rule
DROP CONSTRAINT IF EXISTS chk_template_jurnal_rule_account_reference;

ALTER TABLE template_jurnal_rule
ADD CONSTRAINT chk_template_jurnal_rule_account_reference
CHECK (
  (
    account_source = 'FIXED_CODE'
    AND account_code IS NOT NULL
    AND account_input_key IS NULL
  )
  OR
  (
    account_source = 'INPUT_ACCOUNT'
    AND account_input_key IS NOT NULL
  )
  OR
  (
    account_source = 'ACCOUNT_PREFIX'
    AND account_code_prefix IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_template_transaksi_status_sort
ON template_transaksi(status, sort_order, kode);

CREATE INDEX IF NOT EXISTS idx_template_transaksi_business_event_code
ON template_transaksi(business_event_code);

CREATE INDEX IF NOT EXISTS idx_template_jurnal_rule_template_urutan
ON template_jurnal_rule(template_transaksi_id, urutan);
