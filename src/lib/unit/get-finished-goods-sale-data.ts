import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type FinishedGoodsSaleProductOption = {
  productId: string;
  productCode: string;
  productName: string;
  unitOfMeasure: string;
  defaultSellingPrice: string;
  quantityOnHand: string;
  totalValue: string;
  averageUnitCost: string;
  revenueMappingLabel: string;
  revenueMappingStrategy: string;
  salesRevenueAccountCode: string | null;
  salesRevenueAccountPrefix: string | null;
};

export type FinishedGoodsSaleHistoryItem = {
  id: string;
  code: string;
  saleDate: string;
  customerName: string | null;
  paymentMethod: string;
  paymentStatus: string;
  totalSalesAmount: string;
  totalCogsAmount: string;
  status: string;
  journalNumber: string | null;
  lineCount: number;
};

type FinishedGoodsSaleProductOptionRow = {
  product_id: string;
  product_code: string;
  product_name: string;
  unit_of_measure: string;
  default_selling_price: string;
  quantity_on_hand: string;
  total_value: string;
  average_unit_cost: string;
  revenue_mapping_label: string;
  revenue_mapping_strategy: string;
  sales_revenue_account_code: string | null;
  sales_revenue_account_prefix: string | null;
};

type FinishedGoodsSaleHistoryRow = {
  id: string;
  code: string;
  sale_date: string;
  customer_name: string | null;
  payment_method: string;
  payment_status: string;
  total_sales_amount: string;
  total_cogs_amount: string;
  status: string;
  journal_number: string | null;
  line_count: number;
};

export async function getFinishedGoodsSaleProductOptions(
  context: UnitWorkContext
): Promise<FinishedGoodsSaleProductOption[]> {
  const result = await db.query<FinishedGoodsSaleProductOptionRow>(
    `
      WITH movement_summary AS (
        SELECT
          psm.product_id,
          SUM(
            CASE
              WHEN psm.movement_direction = 'IN' THEN psm.quantity
              WHEN psm.movement_direction = 'OUT' THEN -psm.quantity
              ELSE 0
            END
          ) AS quantity_on_hand,
          SUM(
            CASE
              WHEN psm.movement_direction = 'IN' THEN psm.total_amount
              WHEN psm.movement_direction = 'OUT' THEN -psm.total_amount
              ELSE 0
            END
          ) AS total_value
        FROM production_stock_movement psm
        WHERE psm.bum_desa_id = $1::uuid
          AND psm.unit_usaha_id = $2::uuid
          AND psm.item_type = 'PRODUCT'
        GROUP BY psm.product_id
      )
      SELECT
        pp.id::text AS product_id,
        pp.code AS product_code,
        pp.name AS product_name,
        pp.unit_of_measure,
        pp.default_selling_price::text AS default_selling_price,
        COALESCE(ms.quantity_on_hand, 0)::text AS quantity_on_hand,
        COALESCE(ms.total_value, 0)::text AS total_value,
        CASE
          WHEN COALESCE(ms.quantity_on_hand, 0) > 0
          THEN (COALESCE(ms.total_value, 0) / ms.quantity_on_hand)::numeric(24,6)
          ELSE 0::numeric(24,6)
        END::text AS average_unit_cost,
        brm.label AS revenue_mapping_label,
        brm.account_mapping_strategy AS revenue_mapping_strategy,
        brm.account_code AS sales_revenue_account_code,
        brm.account_code_prefix AS sales_revenue_account_prefix
      FROM production_product pp
      JOIN business_revenue_mapping brm
        ON brm.id = pp.business_revenue_mapping_id
      LEFT JOIN movement_summary ms
        ON ms.product_id = pp.id
      WHERE pp.bum_desa_id = $1::uuid
        AND pp.unit_usaha_id = $2::uuid
        AND pp.is_active = TRUE
        AND brm.is_active = TRUE
      ORDER BY pp.name ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    productId: row.product_id,
    productCode: row.product_code,
    productName: row.product_name,
    unitOfMeasure: row.unit_of_measure,
    defaultSellingPrice: row.default_selling_price,
    quantityOnHand: row.quantity_on_hand,
    totalValue: row.total_value,
    averageUnitCost: row.average_unit_cost,
    revenueMappingLabel: row.revenue_mapping_label,
    revenueMappingStrategy: row.revenue_mapping_strategy,
    salesRevenueAccountCode: row.sales_revenue_account_code,
    salesRevenueAccountPrefix: row.sales_revenue_account_prefix,
  }));
}

export async function getFinishedGoodsSaleHistoryList(
  context: UnitWorkContext
): Promise<FinishedGoodsSaleHistoryItem[]> {
  const result = await db.query<FinishedGoodsSaleHistoryRow>(
    `
      SELECT
        sale.id::text AS id,
        sale.code,
        sale.sale_date::text AS sale_date,
        sale.customer_name,
        sale.payment_method,
        sale.payment_status,
        sale.total_sales_amount::text AS total_sales_amount,
        sale.total_cogs_amount::text AS total_cogs_amount,
        sale.status,
        journal.nomor_jurnal AS journal_number,
        COUNT(line.id)::int AS line_count
      FROM production_finished_goods_sale sale
      LEFT JOIN production_finished_goods_sale_line line
        ON line.sale_id = sale.id
      LEFT JOIN journal_header journal
        ON journal.id = sale.journal_header_id
      WHERE sale.bum_desa_id = $1::uuid
        AND sale.unit_usaha_id = $2::uuid
      GROUP BY
        sale.id,
        sale.code,
        sale.sale_date,
        sale.customer_name,
        sale.payment_method,
        sale.payment_status,
        sale.total_sales_amount,
        sale.total_cogs_amount,
        sale.status,
        journal.nomor_jurnal
      ORDER BY sale.sale_date DESC, sale.created_at DESC
      LIMIT 30
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    saleDate: row.sale_date,
    customerName: row.customer_name,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    totalSalesAmount: row.total_sales_amount,
    totalCogsAmount: row.total_cogs_amount,
    status: row.status,
    journalNumber: row.journal_number,
    lineCount: row.line_count,
  }));
}