DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
    CREATE TYPE registration_status AS ENUM (
      'PENDING',
      'APPROVED',
      'REJECTED'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS app_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bum_desa_registration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_bum_desa TEXT NOT NULL,
  kode_pendaftaran TEXT NOT NULL UNIQUE,
  nama_pendaftar TEXT NOT NULL,
  email_pendaftar TEXT NOT NULL,
  nomor_hp_pendaftar TEXT,
  jabatan_pendaftar TEXT,
  alamat TEXT,
  desa TEXT,
  kecamatan TEXT,
  kabupaten TEXT,
  provinsi TEXT,
  nib TEXT,
  status registration_status NOT NULL DEFAULT 'PENDING',
  catatan_review TEXT,
  reviewed_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  approved_bum_desa_id UUID REFERENCES bum_desa(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_session_user_id ON app_session(user_id);
CREATE INDEX IF NOT EXISTS idx_app_session_expires_at ON app_session(expires_at);
CREATE INDEX IF NOT EXISTS idx_bum_desa_registration_status ON bum_desa_registration(status);
CREATE INDEX IF NOT EXISTS idx_bum_desa_registration_email ON bum_desa_registration(email_pendaftar);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_bum_desa_registration_updated_at'
  ) THEN
    CREATE TRIGGER trg_bum_desa_registration_updated_at
    BEFORE UPDATE ON bum_desa_registration
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;
