-- 012_fix_production_mapping_metadata.sql
-- Clean production finished-goods mapping metadata.

BEGIN;

WITH category AS (
  SELECT id
  FROM business_unit_category
  WHERE code = 'PRODUKSI_BARANG_JADI'
)
UPDATE business_revenue_mapping brm
SET
  metadata = jsonb_build_object(
    'sub_category', 'PRODUKSI_AGRO_PETERNAKAN',
    'kepmen_direct', false,
    'note', 'Produk telur belum memiliki akun detail eksplisit di COA Kepmen 136 seed. Resolver produksi wajib mengarahkannya ke akun detail pendapatan barang jadi yang valid sebelum posting.'
  ),
  updated_at = now()
FROM category
WHERE brm.business_category_id = category.id
  AND brm.label = 'Telur';

WITH category AS (
  SELECT id
  FROM business_unit_category
  WHERE code = 'PRODUKSI_BARANG_JADI'
)
UPDATE business_revenue_mapping brm
SET
  metadata = jsonb_build_object(
    'sub_category', 'PRODUKSI_MANUFAKTUR_RINGAN',
    'kepmen_direct', false,
    'note', 'Produk es kristal belum memiliki akun detail eksplisit di COA Kepmen 136 seed. Resolver produksi wajib mengarahkannya ke akun detail pendapatan barang jadi yang valid sebelum posting.'
  ),
  updated_at = now()
FROM category
WHERE brm.business_category_id = category.id
  AND brm.label = 'Es Kristal';

COMMIT;
