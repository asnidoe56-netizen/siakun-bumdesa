import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type TrialBalanceFilter = {
  periodId?: string;
  endDate?: string;
  showZeroAccounts?: boolean;
};

export type TrialBalancePeriodOption = {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
};

export type TrialBalanceLine = {
  accountId: string;
  kode: string;
  nama: string;
  normalBalance: "DEBIT" | "KREDIT";
  debitMovement: string;
  kreditMovement: string;
  rawBalance: string;
  debitBalance: string;
  kreditBalance: string;
  balanceSide: "DEBIT" | "KREDIT" | "ZERO";
};

export type TrialBalanceReportData = {
  periods: TrialBalancePeriodOption[];
  selectedPeriod: TrialBalancePeriodOption | null;
  endDate: string;
  showZeroAccounts: boolean;
  lines: TrialBalanceLine[];
  totalDebit: string;
  totalKredit: string;
  difference: string;
  isBalanced: boolean;
  accountCount: number;
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

type TrialBalanceLineRow = {
  account_id: string;
  kode: string;
  nama: string;
  normal_balance: "DEBIT" | "KREDIT";
  debit_movement: string;
  kredit_movement: string;
  raw_balance: string;
  debit_balance: string;
  kredit_balance: string;
  balance_side: "DEBIT" | "KREDIT" | "ZERO";
};

function sumCurrency(values: string[]) {
  return values
    .reduce((total, value) => {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? total + numberValue : total;
    }, 0)
    .toString();
}

export async function getTrialBalanceReportData(
  context: UnitWorkContext,
  filters: TrialBalanceFilter = {}
): Promise<TrialBalanceReportData> {
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

  const endDate = filters.endDate || selectedPeriod?.tanggalSelesai || "";

  if (!selectedPeriod || !endDate) {
    return {
      periods,
      selectedPeriod,
      endDate,
      showZeroAccounts,
      lines: [],
      totalDebit: "0",
      totalKredit: "0",
      difference: "0",
      isBalanced: true,
      accountCount: 0,
      visibleAccountCount: 0,
      nonZeroAccountCount: 0,
    };
  }

  const accountCountResult = await db.query<{ account_count: string }>(
    `
      SELECT COUNT(*)::text AS account_count
      FROM akun a
      WHERE a.is_active = TRUE
        AND a.level = 'D'
        AND (a.bum_desa_id = $1::uuid OR a.bum_desa_id IS NULL)
    `,
    [context.bumDesaId]
  );

  const accountCount = Number(accountCountResult.rows[0]?.account_count ?? 0);

  const lineResult = await db.query<TrialBalanceLineRow>(
    `
      WITH account_balances AS (
        SELECT
          a.id::text AS account_id,
          a.kode,
          a.nama,
          a.normal_balance::text AS normal_balance,
          COALESCE(
            SUM(
              CASE
                WHEN jh.id IS NOT NULL THEN jl.debit
                ELSE 0
              END
            ),
            0
          ) AS debit_movement,
          COALESCE(
            SUM(
              CASE
                WHEN jh.id IS NOT NULL THEN jl.kredit
                ELSE 0
              END
            ),
            0
          ) AS kredit_movement,
          COALESCE(
            SUM(
              CASE
                WHEN jh.id IS NOT NULL THEN jl.debit - jl.kredit
                ELSE 0
              END
            ),
            0
          ) AS raw_balance
        FROM akun a
        LEFT JOIN journal_line jl
          ON jl.akun_id = a.id
         AND jl.unit_usaha_id = $2::uuid
        LEFT JOIN journal_header jh
          ON jh.id = jl.journal_header_id
         AND jh.bum_desa_id = $1::uuid
         AND jh.unit_usaha_id = $2::uuid
         AND jh.status = 'POSTED'
         AND jh.tanggal <= $3::date
        WHERE a.is_active = TRUE
          AND a.level = 'D'
          AND (a.bum_desa_id = $1::uuid OR a.bum_desa_id IS NULL)
        GROUP BY
          a.id,
          a.kode,
          a.nama,
          a.normal_balance
      )
      SELECT
        account_id,
        kode,
        nama,
        normal_balance,
        debit_movement::text AS debit_movement,
        kredit_movement::text AS kredit_movement,
        raw_balance::text AS raw_balance,
        CASE
          WHEN raw_balance > 0 THEN raw_balance
          ELSE 0
        END::text AS debit_balance,
        CASE
          WHEN raw_balance < 0 THEN ABS(raw_balance)
          ELSE 0
        END::text AS kredit_balance,
        CASE
          WHEN raw_balance > 0 THEN 'DEBIT'
          WHEN raw_balance < 0 THEN 'KREDIT'
          ELSE 'ZERO'
        END AS balance_side
      FROM account_balances
      WHERE $4::boolean = TRUE
         OR raw_balance <> 0
      ORDER BY kode ASC
    `,
    [context.bumDesaId, context.unitUsahaId, endDate, showZeroAccounts]
  );

  const lines = lineResult.rows.map((row) => ({
    accountId: row.account_id,
    kode: row.kode,
    nama: row.nama,
    normalBalance: row.normal_balance,
    debitMovement: row.debit_movement,
    kreditMovement: row.kredit_movement,
    rawBalance: row.raw_balance,
    debitBalance: row.debit_balance,
    kreditBalance: row.kredit_balance,
    balanceSide: row.balance_side,
  }));

  const totalDebit = sumCurrency(lines.map((line) => line.debitBalance));
  const totalKredit = sumCurrency(lines.map((line) => line.kreditBalance));
  const difference = (Number(totalDebit) - Number(totalKredit)).toString();
  const nonZeroAccountCount = lines.filter(
    (line) => Number(line.debitBalance) > 0 || Number(line.kreditBalance) > 0
  ).length;

  return {
    periods,
    selectedPeriod,
    endDate,
    showZeroAccounts,
    lines,
    totalDebit,
    totalKredit,
    difference,
    isBalanced: Number(difference) === 0,
    accountCount,
    visibleAccountCount: lines.length,
    nonZeroAccountCount,
  };
}
