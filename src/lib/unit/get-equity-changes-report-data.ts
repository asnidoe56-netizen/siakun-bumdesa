import { db } from "@/lib/db/pool";
import { getIncomeStatementReportData } from "@/lib/unit/get-income-statement-report-data";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type EquityChangesFilter = {
  periodId?: string;
  startDate?: string;
  endDate?: string;
  showZeroAccounts?: boolean;
};

export type EquityChangesPeriodOption = {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
};

export type EquityChangesLine = {
  accountId: string;
  kode: string;
  nama: string;
  normalBalance: "DEBIT" | "KREDIT";
  openingBalance: string;
  additions: string;
  reductions: string;
  netMovement: string;
  endingBalance: string;
  isSynthetic: boolean;
};

export type EquityChangesReportData = {
  periods: EquityChangesPeriodOption[];
  selectedPeriod: EquityChangesPeriodOption | null;
  startDate: string;
  endDate: string;
  showZeroAccounts: boolean;
  lines: EquityChangesLine[];
  openingEquity: string;
  equityAdditions: string;
  equityReductions: string;
  currentPeriodProfit: string;
  netEquityChange: string;
  endingEquity: string;
  isProfit: boolean;
  visibleAccountCount: number;
  nonZeroAccountCount: number;
};

type PeriodOptionRow = {
  id: string;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
};

type EquityChangesLineRow = {
  account_id: string;
  kode: string;
  nama: string;
  normal_balance: "DEBIT" | "KREDIT";
  opening_balance: string;
  additions: string;
  reductions: string;
  net_movement: string;
  ending_balance: string;
};

function sumCurrency(values: string[]) {
  return values
    .reduce((total, value) => {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? total + numberValue : total;
    }, 0)
    .toString();
}

function emptyReport(
  periods: EquityChangesPeriodOption[],
  selectedPeriod: EquityChangesPeriodOption | null,
  startDate: string,
  endDate: string,
  showZeroAccounts: boolean
): EquityChangesReportData {
  return {
    periods,
    selectedPeriod,
    startDate,
    endDate,
    showZeroAccounts,
    lines: [],
    openingEquity: "0",
    equityAdditions: "0",
    equityReductions: "0",
    currentPeriodProfit: "0",
    netEquityChange: "0",
    endingEquity: "0",
    isProfit: true,
    visibleAccountCount: 0,
    nonZeroAccountCount: 0,
  };
}

export async function getEquityChangesReportData(
  context: UnitWorkContext,
  filters: EquityChangesFilter = {}
): Promise<EquityChangesReportData> {
  const showZeroAccounts = filters.showZeroAccounts === true;

  const periodResult = await db.query<PeriodOptionRow>(
    `
      SELECT
        pa.id::text AS id,
        pa.nama,
        pa.tanggal_mulai::text AS tanggal_mulai,
        pa.tanggal_selesai::text AS tanggal_selesai,
        pa.status::text AS status
      FROM periode_akuntansi pa
      WHERE pa.bum_desa_id = $1::uuid
      ORDER BY
        CASE WHEN pa.status = 'OPEN' THEN 0 ELSE 1 END,
        pa.tanggal_mulai DESC
    `,
    [context.bumDesaId]
  );

  const periods = periodResult.rows.map((row) => ({
    id: row.id,
    nama: row.nama,
    tanggalMulai: row.tanggal_mulai,
    tanggalSelesai: row.tanggal_selesai,
    status: row.status,
  }));

  const selectedPeriod =
    periods.find((period) => period.id === filters.periodId) ??
    periods.find((period) => period.status === "OPEN") ??
    periods[0] ??
    null;

  const startDate = filters.startDate || selectedPeriod?.tanggalMulai || "";
  const endDate = filters.endDate || selectedPeriod?.tanggalSelesai || "";

  if (!selectedPeriod || !startDate || !endDate) {
    return emptyReport(
      periods,
      selectedPeriod,
      startDate,
      endDate,
      showZeroAccounts
    );
  }

  const lineResult = await db.query<EquityChangesLineRow>(
    `
      WITH equity_accounts AS (
        SELECT
          a.id AS account_id,
          a.kode,
          a.nama,
          a.normal_balance::text AS normal_balance
        FROM akun a
        WHERE a.is_active = TRUE
          AND a.level = 'D'
          AND (a.bum_desa_id = $1::uuid OR a.bum_desa_id IS NULL)
          AND a.kode LIKE '3.%'
          AND a.kode NOT LIKE '3.9.%'
      ),
      equity_movements AS (
        SELECT
          ea.account_id::text AS account_id,
          ea.kode,
          ea.nama,
          ea.normal_balance,
          COALESCE(
            SUM(
              CASE
                WHEN jh.id IS NOT NULL
                  AND jh.tanggal < $3::date
                  THEN jl.kredit - jl.debit
                ELSE 0
              END
            ),
            0
          ) AS opening_balance,
          COALESCE(
            SUM(
              CASE
                WHEN jh.id IS NOT NULL
                  AND jh.tanggal BETWEEN $3::date AND $4::date
                  THEN jl.kredit
                ELSE 0
              END
            ),
            0
          ) AS additions,
          COALESCE(
            SUM(
              CASE
                WHEN jh.id IS NOT NULL
                  AND jh.tanggal BETWEEN $3::date AND $4::date
                  THEN jl.debit
                ELSE 0
              END
            ),
            0
          ) AS reductions
        FROM equity_accounts ea
        LEFT JOIN journal_line jl
          ON jl.akun_id = ea.account_id
         AND jl.unit_usaha_id = $2::uuid
        LEFT JOIN journal_header jh
          ON jh.id = jl.journal_header_id
         AND jh.bum_desa_id = $1::uuid
         AND jh.unit_usaha_id = $2::uuid
         AND jh.status = 'POSTED'
        GROUP BY
          ea.account_id,
          ea.kode,
          ea.nama,
          ea.normal_balance
      )
      SELECT
        account_id,
        kode,
        nama,
        normal_balance,
        opening_balance::text AS opening_balance,
        additions::text AS additions,
        reductions::text AS reductions,
        (additions - reductions)::text AS net_movement,
        (opening_balance + additions - reductions)::text AS ending_balance
      FROM equity_movements
      WHERE
        $5::boolean = TRUE
        OR opening_balance <> 0
        OR additions <> 0
        OR reductions <> 0
        OR opening_balance + additions - reductions <> 0
      ORDER BY kode ASC
    `,
    [
      context.bumDesaId,
      context.unitUsahaId,
      startDate,
      endDate,
      showZeroAccounts,
    ]
  );

  const baseLines: EquityChangesLine[] = lineResult.rows.map((row) => ({
    accountId: row.account_id,
    kode: row.kode,
    nama: row.nama,
    normalBalance: row.normal_balance,
    openingBalance: row.opening_balance,
    additions: row.additions,
    reductions: row.reductions,
    netMovement: row.net_movement,
    endingBalance: row.ending_balance,
    isSynthetic: false,
  }));

  const incomeStatement = await getIncomeStatementReportData(context, {
    periodId: selectedPeriod.id,
    startDate,
    endDate,
    showZeroAccounts: false,
  });

  const currentPeriodProfit = incomeStatement.netProfit;
  const currentPeriodProfitNumber = Number(currentPeriodProfit);

  const lines = [...baseLines];

  if (showZeroAccounts || currentPeriodProfitNumber !== 0) {
    const profitAddition =
      currentPeriodProfitNumber > 0 ? currentPeriodProfitNumber : 0;
    const lossReduction =
      currentPeriodProfitNumber < 0 ? Math.abs(currentPeriodProfitNumber) : 0;

    lines.push({
      accountId: "current-period-profit",
      kode: "LABA-RUGI-BERJALAN",
      nama:
        currentPeriodProfitNumber >= 0
          ? "Surplus/Laba Periode Berjalan"
          : "Defisit/Rugi Periode Berjalan",
      normalBalance: currentPeriodProfitNumber >= 0 ? "KREDIT" : "DEBIT",
      openingBalance: "0",
      additions: profitAddition.toString(),
      reductions: lossReduction.toString(),
      netMovement: currentPeriodProfit,
      endingBalance: currentPeriodProfit,
      isSynthetic: true,
    });
  }

  const openingEquity = sumCurrency(
    baseLines.map((line) => line.openingBalance)
  );

  const equityAdditions = sumCurrency(
    lines.map((line) => line.additions)
  );

  const equityReductions = sumCurrency(
    lines.map((line) => line.reductions)
  );

  const netEquityChange = (
    Number(equityAdditions) - Number(equityReductions)
  ).toString();

  const endingEquity = (
    Number(openingEquity) + Number(netEquityChange)
  ).toString();

  const nonZeroAccountCount = lines.filter(
    (line) =>
      Number(line.openingBalance) !== 0 ||
      Number(line.additions) !== 0 ||
      Number(line.reductions) !== 0 ||
      Number(line.endingBalance) !== 0
  ).length;

  return {
    periods,
    selectedPeriod,
    startDate,
    endDate,
    showZeroAccounts,
    lines,
    openingEquity,
    equityAdditions,
    equityReductions,
    currentPeriodProfit,
    netEquityChange,
    endingEquity,
    isProfit: currentPeriodProfitNumber >= 0,
    visibleAccountCount: lines.length,
    nonZeroAccountCount,
  };
}
