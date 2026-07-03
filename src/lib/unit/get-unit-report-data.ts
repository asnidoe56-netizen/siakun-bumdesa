import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type UnitReportSummary = {
  cashBalance: string;
  cashIn: string;
  cashOut: string;
  openPayableCount: number;
  openPayableAmount: string;
  materialStockValue: string;
  finishedGoodsStockValue: string;
  salesCount: number;
  totalSalesAmount: string;
  totalCogsAmount: string;
  grossProfitAmount: string;
  postedJournalCount: number;
};

export type UnitReportRecentJournal = {
  journalId: string;
  journalNumber: string;
  journalDate: string;
  source: string;
  status: string;
  templateCode: string | null;
  description: string | null;
  totalDebit: string;
  totalCredit: string;
};

type UnitReportSummaryRow = {
  cash_balance: string;
  cash_in: string;
  cash_out: string;
  open_payable_count: number;
  open_payable_amount: string;
  material_stock_value: string;
  finished_goods_stock_value: string;
  sales_count: number;
  total_sales_amount: string;
  total_cogs_amount: string;
  gross_profit_amount: string;
  posted_journal_count: number;
};

type UnitReportRecentJournalRow = {
  journal_id: string;
  journal_number: string;
  journal_date: string;
  source: string;
  status: string;
  template_code: string | null;
  description: string | null;
  total_debit: string;
  total_credit: string;
};

export async function getUnitReportSummary(
  context: UnitWorkContext
): Promise<UnitReportSummary> {
  const result = await db.query<UnitReportSummaryRow>(
    `
      WITH cash_summary AS (
        SELECT
          COALESCE(SUM(jl.debit - jl.kredit), 0)::text AS cash_balance,
          COALESCE(SUM(jl.debit), 0)::text AS cash_in,
          COALESCE(SUM(jl.kredit), 0)::text AS cash_out
        FROM journal_header jh
        JOIN journal_line jl
          ON jl.journal_header_id = jh.id
        JOIN akun a
          ON a.id = jl.akun_id
        WHERE jh.bum_desa_id = $1::uuid
          AND jh.unit_usaha_id = $2::uuid
          AND jh.status = 'POSTED'
          AND a.kode = '1.1.01.01'
      ),
      payable_summary AS (
        SELECT
          COUNT(*) FILTER (
            WHERE sp.status IN ('UNPAID', 'PARTIAL')
              AND sp.outstanding_amount > 0
          )::int AS open_payable_count,
          COALESCE(
            SUM(sp.outstanding_amount) FILTER (
              WHERE sp.status IN ('UNPAID', 'PARTIAL')
                AND sp.outstanding_amount > 0
            ),
            0
          )::text AS open_payable_amount
        FROM supplier_payable sp
        WHERE sp.bum_desa_id = $1::uuid
          AND sp.unit_usaha_id = $2::uuid
      ),
      material_stock_summary AS (
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN psm.movement_direction = 'IN' THEN psm.total_amount
                WHEN psm.movement_direction = 'OUT' THEN -psm.total_amount
                ELSE 0
              END
            ),
            0
          )::text AS material_stock_value
        FROM production_stock_movement psm
        WHERE psm.bum_desa_id = $1::uuid
          AND psm.unit_usaha_id = $2::uuid
          AND psm.item_type = 'MATERIAL'
      ),
      finished_goods_stock_summary AS (
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN psm.movement_direction = 'IN' THEN psm.total_amount
                WHEN psm.movement_direction = 'OUT' THEN -psm.total_amount
                ELSE 0
              END
            ),
            0
          )::text AS finished_goods_stock_value
        FROM production_stock_movement psm
        WHERE psm.bum_desa_id = $1::uuid
          AND psm.unit_usaha_id = $2::uuid
          AND psm.item_type = 'PRODUCT'
      ),
      sales_summary AS (
        SELECT
          COUNT(*)::int AS sales_count,
          COALESCE(SUM(sale.total_sales_amount), 0)::text AS total_sales_amount,
          COALESCE(SUM(sale.total_cogs_amount), 0)::text AS total_cogs_amount,
          COALESCE(
            SUM(sale.total_sales_amount - sale.total_cogs_amount),
            0
          )::text AS gross_profit_amount
        FROM production_finished_goods_sale sale
        WHERE sale.bum_desa_id = $1::uuid
          AND sale.unit_usaha_id = $2::uuid
          AND sale.status = 'POSTED'
      ),
      journal_summary AS (
        SELECT
          COUNT(*)::int AS posted_journal_count
        FROM journal_header jh
        WHERE jh.bum_desa_id = $1::uuid
          AND jh.unit_usaha_id = $2::uuid
          AND jh.status = 'POSTED'
      )
      SELECT
        cash_summary.cash_balance,
        cash_summary.cash_in,
        cash_summary.cash_out,
        payable_summary.open_payable_count,
        payable_summary.open_payable_amount,
        material_stock_summary.material_stock_value,
        finished_goods_stock_summary.finished_goods_stock_value,
        sales_summary.sales_count,
        sales_summary.total_sales_amount,
        sales_summary.total_cogs_amount,
        sales_summary.gross_profit_amount,
        journal_summary.posted_journal_count
      FROM cash_summary
      CROSS JOIN payable_summary
      CROSS JOIN material_stock_summary
      CROSS JOIN finished_goods_stock_summary
      CROSS JOIN sales_summary
      CROSS JOIN journal_summary
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  const row = result.rows[0];

  return {
    cashBalance: row.cash_balance,
    cashIn: row.cash_in,
    cashOut: row.cash_out,
    openPayableCount: row.open_payable_count,
    openPayableAmount: row.open_payable_amount,
    materialStockValue: row.material_stock_value,
    finishedGoodsStockValue: row.finished_goods_stock_value,
    salesCount: row.sales_count,
    totalSalesAmount: row.total_sales_amount,
    totalCogsAmount: row.total_cogs_amount,
    grossProfitAmount: row.gross_profit_amount,
    postedJournalCount: row.posted_journal_count,
  };
}

export async function getUnitReportRecentJournals(
  context: UnitWorkContext
): Promise<UnitReportRecentJournal[]> {
  const result = await db.query<UnitReportRecentJournalRow>(
    `
      SELECT
        jh.id::text AS journal_id,
        jh.nomor_jurnal AS journal_number,
        jh.tanggal::text AS journal_date,
        jh.sumber AS source,
        jh.status,
        tt.kode AS template_code,
        jh.keterangan AS description,
        COALESCE(SUM(jl.debit), 0)::text AS total_debit,
        COALESCE(SUM(jl.kredit), 0)::text AS total_credit
      FROM journal_header jh
      LEFT JOIN template_transaksi tt
        ON tt.id = jh.template_transaksi_id
      LEFT JOIN journal_line jl
        ON jl.journal_header_id = jh.id
      WHERE jh.bum_desa_id = $1::uuid
        AND jh.unit_usaha_id = $2::uuid
        AND jh.status = 'POSTED'
      GROUP BY
        jh.id,
        jh.nomor_jurnal,
        jh.tanggal,
        jh.sumber,
        jh.status,
        tt.kode,
        jh.keterangan,
        jh.created_at
      ORDER BY jh.tanggal DESC, jh.created_at DESC
      LIMIT 20
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    journalId: row.journal_id,
    journalNumber: row.journal_number,
    journalDate: row.journal_date,
    source: row.source,
    status: row.status,
    templateCode: row.template_code,
    description: row.description,
    totalDebit: row.total_debit,
    totalCredit: row.total_credit,
  }));
}