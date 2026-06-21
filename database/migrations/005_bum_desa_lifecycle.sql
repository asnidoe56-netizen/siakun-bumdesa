ALTER TABLE bum_desa
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delete_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_bum_desa_deleted_at ON bum_desa(deleted_at);
CREATE INDEX IF NOT EXISTS idx_bum_desa_active_not_deleted ON bum_desa(is_active, deleted_at);
