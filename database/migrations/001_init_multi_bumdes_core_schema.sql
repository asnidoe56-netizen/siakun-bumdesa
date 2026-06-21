CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE role_code AS ENUM (
  'super_admin_platform',
  'admin_bum_desa',
  'bendahara_pusat',
  'operator_unit',
  'direktur_pengawas',
  'auditor_readonly'
);

CREATE TYPE unit_type AS ENUM (
  'kantor_pusat',
  'unit_usaha'
);

CREATE TYPE account_level AS ENUM (
  'H',
  'D'
);

CREATE TYPE normal_balance AS ENUM (
  'DEBIT',
  'KREDIT'
);

CREATE TYPE period_status AS ENUM (
  'OPEN',
  'CLOSED'
);

CREATE TYPE journal_status AS ENUM (
  'DRAFT',
  'POSTED',
  'REVERSED'
);

CREATE TYPE journal_source AS ENUM (
  'TEMPLATE',
  'MANUAL',
  'ADJUSTMENT',
  'SYSTEM'
);

CREATE TYPE template_status AS ENUM (
  'ACTIVE',
  'INACTIVE'
);

CREATE TYPE rule_side AS ENUM (
  'DEBIT',
  'KREDIT'
);

CREATE TABLE bum_desa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kode TEXT NOT NULL UNIQUE,
  alamat TEXT,
  desa TEXT,
  kecamatan TEXT,
  kabupaten TEXT,
  provinsi TEXT,
  nib TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE unit_usaha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id UUID NOT NULL REFERENCES bum_desa(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  kode TEXT NOT NULL,
  jenis unit_type NOT NULL,
  deskripsi TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bum_desa_id, kode)
);

CREATE TABLE app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_lengkap TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_bum_desa_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  bum_desa_id UUID REFERENCES bum_desa(id) ON DELETE CASCADE,
  role role_code NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, bum_desa_id, role)
);

CREATE TABLE user_unit_usaha_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  bum_desa_id UUID NOT NULL REFERENCES bum_desa(id) ON DELETE CASCADE,
  unit_usaha_id UUID NOT NULL REFERENCES unit_usaha(id) ON DELETE CASCADE,
  role role_code NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, unit_usaha_id, role)
);

CREATE TABLE akun (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id UUID REFERENCES bum_desa(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES akun(id) ON DELETE RESTRICT,
  kode TEXT NOT NULL,
  nama TEXT NOT NULL,
  level account_level NOT NULL,
  normal_balance normal_balance NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bum_desa_id, kode)
);

CREATE TABLE periode_akuntansi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id UUID NOT NULL REFERENCES bum_desa(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  status period_status NOT NULL DEFAULT 'OPEN',
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (tanggal_selesai >= tanggal_mulai),
  UNIQUE (bum_desa_id, nama)
);

CREATE TABLE template_transaksi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  deskripsi TEXT,
  status template_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE template_jurnal_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_transaksi_id UUID NOT NULL REFERENCES template_transaksi(id) ON DELETE CASCADE,
  side rule_side NOT NULL,
  account_code TEXT NOT NULL,
  account_must_be_detail BOOLEAN NOT NULL DEFAULT TRUE,
  amount_formula TEXT NOT NULL DEFAULT 'nominal',
  urutan INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE journal_header (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id UUID NOT NULL REFERENCES bum_desa(id) ON DELETE RESTRICT,
  unit_usaha_id UUID NOT NULL REFERENCES unit_usaha(id) ON DELETE RESTRICT,
  periode_akuntansi_id UUID NOT NULL REFERENCES periode_akuntansi(id) ON DELETE RESTRICT,
  template_transaksi_id UUID REFERENCES template_transaksi(id) ON DELETE SET NULL,
  nomor_jurnal TEXT NOT NULL,
  tanggal DATE NOT NULL,
  sumber journal_source NOT NULL DEFAULT 'TEMPLATE',
  status journal_status NOT NULL DEFAULT 'POSTED',
  keterangan TEXT,
  created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  reversed_from_id UUID REFERENCES journal_header(id) ON DELETE SET NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bum_desa_id, nomor_jurnal)
);

CREATE TABLE journal_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_header_id UUID NOT NULL REFERENCES journal_header(id) ON DELETE CASCADE,
  akun_id UUID NOT NULL REFERENCES akun(id) ON DELETE RESTRICT,
  unit_usaha_id UUID NOT NULL REFERENCES unit_usaha(id) ON DELETE RESTRICT,
  debit NUMERIC(18,2) NOT NULL DEFAULT 0,
  kredit NUMERIC(18,2) NOT NULL DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (debit >= 0),
  CHECK (kredit >= 0),
  CHECK (
    (debit > 0 AND kredit = 0)
    OR
    (kredit > 0 AND debit = 0)
  )
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id UUID REFERENCES bum_desa(id) ON DELETE SET NULL,
  user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_unit_usaha_bum_desa_id ON unit_usaha(bum_desa_id);
CREATE INDEX idx_akun_bum_desa_id ON akun(bum_desa_id);
CREATE INDEX idx_periode_bum_desa_id ON periode_akuntansi(bum_desa_id);
CREATE INDEX idx_journal_header_bum_desa_id ON journal_header(bum_desa_id);
CREATE INDEX idx_journal_header_unit_usaha_id ON journal_header(unit_usaha_id);
CREATE INDEX idx_journal_header_periode_id ON journal_header(periode_akuntansi_id);
CREATE INDEX idx_journal_line_header_id ON journal_line(journal_header_id);
CREATE INDEX idx_journal_line_akun_id ON journal_line(akun_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bum_desa_updated_at
BEFORE UPDATE ON bum_desa
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_unit_usaha_updated_at
BEFORE UPDATE ON unit_usaha
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_app_user_updated_at
BEFORE UPDATE ON app_user
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_akun_updated_at
BEFORE UPDATE ON akun
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_periode_akuntansi_updated_at
BEFORE UPDATE ON periode_akuntansi
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_template_transaksi_updated_at
BEFORE UPDATE ON template_transaksi
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_journal_header_updated_at
BEFORE UPDATE ON journal_header
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
