CREATE INDEX IF NOT EXISTS idx_bum_desa_is_active ON bum_desa(is_active);
CREATE INDEX IF NOT EXISTS idx_app_user_is_active ON app_user(is_active);
CREATE INDEX IF NOT EXISTS idx_template_transaksi_status ON template_transaksi(status);
CREATE INDEX IF NOT EXISTS idx_bum_desa_registration_created_at ON bum_desa_registration(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bum_desa_registration_status_created_at ON bum_desa_registration(status, created_at DESC);
