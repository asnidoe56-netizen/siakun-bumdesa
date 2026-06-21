import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type ProductionRevenueOption = {
  id: string;
  label: string;
  accountMappingStrategy: string;
  accountCode: string | null;
  accountCodePrefix: string | null;
};

export type ProductionProductListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  defaultSellingPrice: string;
  isActive: boolean;
  revenueLabel: string;
  accountMappingStrategy: string;
  accountCode: string | null;
  accountCodePrefix: string | null;
};

type ProductionRevenueOptionRow = {
  id: string;
  label: string;
  account_mapping_strategy: string;
  account_code: string | null;
  account_code_prefix: string | null;
};

type ProductionProductListRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit_of_measure: string;
  default_selling_price: string;
  is_active: boolean;
  revenue_label: string;
  account_mapping_strategy: string;
  account_code: string | null;
  account_code_prefix: string | null;
};

export async function getProductionRevenueOptions(): Promise<
  ProductionRevenueOption[]
> {
  const result = await db.query<ProductionRevenueOptionRow>(
    `
      SELECT
        brm.id::text AS id,
        brm.label,
        brm.account_mapping_strategy,
        brm.account_code,
        brm.account_code_prefix
      FROM business_revenue_mapping brm
      JOIN business_unit_category buc ON buc.id = brm.business_category_id
      WHERE buc.code = 'PRODUKSI_BARANG_JADI'
        AND buc.is_active = TRUE
        AND brm.is_active = TRUE
      ORDER BY brm.sort_order ASC, brm.label ASC
    `
  );

  return result.rows.map((row) => ({
    id: row.id,
    label: row.label,
    accountMappingStrategy: row.account_mapping_strategy,
    accountCode: row.account_code,
    accountCodePrefix: row.account_code_prefix,
  }));
}

export async function getProductionProductList(
  context: UnitWorkContext
): Promise<ProductionProductListItem[]> {
  const result = await db.query<ProductionProductListRow>(
    `
      SELECT
        pp.id::text AS id,
        pp.code,
        pp.name,
        pp.description,
        pp.unit_of_measure,
        pp.default_selling_price::text AS default_selling_price,
        pp.is_active,
        brm.label AS revenue_label,
        brm.account_mapping_strategy,
        brm.account_code,
        brm.account_code_prefix
      FROM production_product pp
      JOIN business_revenue_mapping brm ON brm.id = pp.business_revenue_mapping_id
      WHERE pp.bum_desa_id = $1::uuid
        AND pp.unit_usaha_id = $2::uuid
      ORDER BY pp.is_active DESC, pp.name ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    unitOfMeasure: row.unit_of_measure,
    defaultSellingPrice: row.default_selling_price,
    isActive: row.is_active,
    revenueLabel: row.revenue_label,
    accountMappingStrategy: row.account_mapping_strategy,
    accountCode: row.account_code,
    accountCodePrefix: row.account_code_prefix,
  }));
}