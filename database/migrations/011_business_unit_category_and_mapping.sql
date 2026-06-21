-- 011_business_unit_category_and_mapping.sql
-- Global business category and mapping engine for unit-specific workflows.
-- This migration is platform/global first:
-- - categories are global
-- - revenue mappings are global
-- - template mappings are global
-- - cash/bank mappings remain tenant/unit specific

BEGIN;

CREATE TABLE IF NOT EXISTS business_unit_category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_business_unit_category_updated_at'
  ) THEN
    CREATE TRIGGER trg_business_unit_category_updated_at
    BEFORE UPDATE ON business_unit_category
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE unit_usaha
  ADD COLUMN IF NOT EXISTS business_category_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unit_usaha_business_category_id_fkey'
  ) THEN
    ALTER TABLE unit_usaha
      ADD CONSTRAINT unit_usaha_business_category_id_fkey
      FOREIGN KEY (business_category_id)
      REFERENCES business_unit_category(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_unit_usaha_business_category_id
  ON unit_usaha (business_category_id);

CREATE TABLE IF NOT EXISTS business_revenue_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_category_id uuid NOT NULL REFERENCES business_unit_category(id) ON DELETE CASCADE,
  label text NOT NULL,
  account_mapping_strategy text NOT NULL DEFAULT 'FIXED_CODE',
  account_code text,
  account_code_prefix text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_revenue_mapping_strategy_check
    CHECK (account_mapping_strategy IN ('FIXED_CODE', 'COA_GROUP', 'TENANT_ACCOUNT_REQUIRED')),
  CONSTRAINT business_revenue_mapping_account_check
    CHECK (
      (
        account_mapping_strategy = 'FIXED_CODE'
        AND account_code IS NOT NULL
        AND account_code_prefix IS NULL
      )
      OR
      (
        account_mapping_strategy IN ('COA_GROUP', 'TENANT_ACCOUNT_REQUIRED')
        AND account_code IS NULL
        AND account_code_prefix IS NOT NULL
      )
    ),
  CONSTRAINT business_revenue_mapping_category_label_key
    UNIQUE (business_category_id, label)
);

CREATE INDEX IF NOT EXISTS idx_business_revenue_mapping_category
  ON business_revenue_mapping (business_category_id, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_business_revenue_mapping_account_code
  ON business_revenue_mapping (account_code);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_business_revenue_mapping_updated_at'
  ) THEN
    CREATE TRIGGER trg_business_revenue_mapping_updated_at
    BEFORE UPDATE ON business_revenue_mapping
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS business_template_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_category_id uuid NOT NULL REFERENCES business_unit_category(id) ON DELETE CASCADE,
  template_transaksi_id uuid NOT NULL REFERENCES template_transaksi(id) ON DELETE CASCADE,
  label text NOT NULL,
  route_path text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_template_mapping_category_template_label_key
    UNIQUE (business_category_id, template_transaksi_id, label)
);

CREATE INDEX IF NOT EXISTS idx_business_template_mapping_category
  ON business_template_mapping (business_category_id, is_active, sort_order);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_business_template_mapping_updated_at'
  ) THEN
    CREATE TRIGGER trg_business_template_mapping_updated_at
    BEFORE UPDATE ON business_template_mapping
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unit_usaha_id_bum_desa_id_key'
  ) THEN
    ALTER TABLE unit_usaha
      ADD CONSTRAINT unit_usaha_id_bum_desa_id_key
      UNIQUE (id, bum_desa_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS business_cash_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bum_desa_id uuid NOT NULL,
  unit_usaha_id uuid NOT NULL,
  label text NOT NULL,
  account_code text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_cash_mapping_unit_bumdes_fkey
    FOREIGN KEY (unit_usaha_id, bum_desa_id)
    REFERENCES unit_usaha(id, bum_desa_id)
    ON DELETE CASCADE,
  CONSTRAINT business_cash_mapping_unit_label_key
    UNIQUE (unit_usaha_id, label)
);

CREATE INDEX IF NOT EXISTS idx_business_cash_mapping_unit
  ON business_cash_mapping (bum_desa_id, unit_usaha_id, is_active, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS business_cash_mapping_one_default_per_unit
  ON business_cash_mapping (unit_usaha_id)
  WHERE is_default = true AND is_active = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_business_cash_mapping_updated_at'
  ) THEN
    CREATE TRIGGER trg_business_cash_mapping_updated_at
    BEFORE UPDATE ON business_cash_mapping
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

INSERT INTO business_unit_category (code, name, description, sort_order)
VALUES
  ('JASA_WISATA', 'Jasa Wisata', 'Unit usaha jasa wisata seperti tiket, wahana, dan paket wisata.', 10),
  ('JASA_AIR_BERSIH', 'Jasa Air Bersih', 'Unit usaha pengelolaan air bersih desa.', 20),
  ('JASA_SAMPAH', 'Jasa Sampah', 'Unit usaha pengelolaan sampah dan iuran kebersihan.', 30),
  ('JASA_SEWA_ASET', 'Jasa Sewa Aset', 'Unit usaha penyewaan gedung, kios, kendaraan, atau peralatan.', 40),
  ('JASA_PELAYANAN', 'Jasa Pelayanan', 'Unit usaha jasa pelayanan, PPOB, komisi, dan layanan administrasi.', 50),
  ('JASA_TRANSPORTASI_PARKIR', 'Jasa Transportasi dan Parkir', 'Unit usaha transportasi, parkir mobil, dan parkir motor.', 60),
  ('JASA_SIMPAN_PINJAM', 'Jasa Simpan Pinjam', 'Unit usaha simpan pinjam, pinjaman, angsuran, dan jasa pinjaman.', 70),
  ('JASA_PELATIHAN', 'Jasa Pelatihan', 'Unit usaha pelatihan, kursus, workshop, dan kegiatan pendidikan.', 80),
  ('JASA_HOMESTAY', 'Jasa Homestay', 'Unit usaha homestay, penginapan, booking, dan kamar wisata.', 90),
  ('PERDAGANGAN', 'Perdagangan', 'Unit usaha yang membeli barang lalu menjual kembali sebagai barang dagangan.', 100),
  ('PRODUKSI_BARANG_JADI', 'Produksi Barang Jadi', 'Unit usaha yang mengolah bahan baku atau sumber daya menjadi barang jadi, seperti kuliner, telur, es kristal, kopi, kerajinan, dan olahan pangan.', 110)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

WITH category AS (
  SELECT id FROM business_unit_category WHERE code = 'PRODUKSI_BARANG_JADI'
)
INSERT INTO business_revenue_mapping (
  business_category_id,
  label,
  account_mapping_strategy,
  account_code,
  account_code_prefix,
  sort_order,
  metadata
)
SELECT
  category.id,
  item.label,
  item.account_mapping_strategy,
  item.account_code,
  item.account_code_prefix,
  item.sort_order,
  item.metadata
FROM category
CROSS JOIN (
  VALUES
    ('Katering', 'FIXED_CODE', '4.3.01.01', NULL, 10, '{"sub_category":"PRODUKSI_KULINER","kepmen_direct":true}'::jsonb),
    ('Restoran', 'FIXED_CODE', '4.3.01.02', NULL, 20, '{"sub_category":"PRODUKSI_KULINER","kepmen_direct":true}'::jsonb),
    ('Kopi', 'FIXED_CODE', '4.3.01.03', NULL, 30, '{"sub_category":"PRODUKSI_OLAHAN_PANGAN","kepmen_direct":true}'::jsonb),
    ('Telur', 'COA_GROUP', NULL, '4.3', 40, '{"sub_category":"PRODUKSI_AGRO_PETERNAKAN","kepmen_direct":false,"note":"Produk telur belum memiliki akun detail eksplisit di COA Kepmen 136 seed. Resolver produksi wajib mengarahkannya ke akun detail pendapatan barang jadi yang valid sebelum posting."}'::jsonb),
    ('Es Kristal', 'COA_GROUP', NULL, '4.3', 50, '{"sub_category":"PRODUKSI_MANUFAKTUR_RINGAN","kepmen_direct":false,"note":"Produk es kristal belum memiliki akun detail eksplisit di COA Kepmen 136 seed. Resolver produksi wajib mengarahkannya ke akun detail pendapatan barang jadi yang valid sebelum posting."}'::jsonb),
    ('Olahan Pangan Lainnya', 'COA_GROUP', NULL, '4.3', 60, '{"sub_category":"PRODUKSI_OLAHAN_PANGAN","kepmen_direct":false}'::jsonb),
    ('Barang Jadi Lainnya', 'COA_GROUP', NULL, '4.3', 70, '{"sub_category":"PRODUKSI_BARANG_JADI","kepmen_direct":false}'::jsonb)
) AS item(label, account_mapping_strategy, account_code, account_code_prefix, sort_order, metadata)
ON CONFLICT (business_category_id, label) DO UPDATE
SET
  account_mapping_strategy = EXCLUDED.account_mapping_strategy,
  account_code = EXCLUDED.account_code,
  account_code_prefix = EXCLUDED.account_code_prefix,
  sort_order = EXCLUDED.sort_order,
  metadata = EXCLUDED.metadata,
  is_active = true,
  updated_at = now();

WITH category AS (
  SELECT id FROM business_unit_category WHERE code = 'PRODUKSI_BARANG_JADI'
),
template_source AS (
  SELECT kode, id FROM template_transaksi WHERE kode IN ('T01', 'T02', 'T06', 'T17')
)
INSERT INTO business_template_mapping (
  business_category_id,
  template_transaksi_id,
  label,
  route_path,
  sort_order,
  metadata
)
SELECT
  category.id,
  template_source.id,
  item.label,
  item.route_path,
  item.sort_order,
  item.metadata
FROM category
JOIN (
  VALUES
    ('T01', 'Jual Barang Jadi Tunai', '/unit/dashboard/catat-transaksi/terima-pendapatan-tunai', 10, '{"business_event":"PRODUCTION_FINISHED_GOODS_CASH_SALE"}'::jsonb),
    ('T02', 'Setor Tunai ke Bank', '/unit/dashboard/catat-transaksi/setor-tunai-ke-bank', 20, '{"business_event":"PRODUCTION_CASH_TO_BANK"}'::jsonb),
    ('T06', 'Beli Bahan Baku / Biaya Produksi Tunai', '/unit/dashboard/catat-transaksi/beli-barang-jasa-tunai', 30, '{"business_event":"PRODUCTION_CASH_PURCHASE_OR_EXPENSE"}'::jsonb),
    ('T17', 'Beli ATK / Barang Pakai Habis', '/unit/dashboard/catat-transaksi/beli-atk-barang-pakai-habis', 40, '{"business_event":"PRODUCTION_CONSUMABLE_SUPPLIES"}'::jsonb)
) AS item(template_code, label, route_path, sort_order, metadata)
  ON true
JOIN template_source
  ON template_source.kode = item.template_code
ON CONFLICT (business_category_id, template_transaksi_id, label) DO UPDATE
SET
  route_path = EXCLUDED.route_path,
  sort_order = EXCLUDED.sort_order,
  metadata = EXCLUDED.metadata,
  is_active = true,
  updated_at = now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM business_revenue_mapping brm
    LEFT JOIN akun a
      ON a.kode = brm.account_code
     AND a.bum_desa_id IS NULL
     AND a.level = 'D'
     AND a.is_active = true
     AND a.is_kepmen_136 = true
    WHERE brm.account_mapping_strategy = 'FIXED_CODE'
      AND a.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid fixed business_revenue_mapping account_code. Fixed mappings must point to active global Kepmen 136 detail accounts.';
  END IF;
END $$;

COMMIT;
