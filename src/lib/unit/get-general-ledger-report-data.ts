import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type GeneralLedgerFilter = {
  periodId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
};

export type GeneralLedgerAccountOption = {
  id: string;
  kode: string;
  nama: string;
  normalBalance: "DEBIT" | "KREDIT";
};

export type GeneralLedgerPeriodOption = {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
};

export type GeneralLedgerLine = {
  entryId: string;
  journalNumber: string;
  journalDate: string;
  source: string;
  journalDescription: string | null;
  lineDescription: string | null;
  debit: string;
  kredit: string;
  runningBalance: string;
};

export type GeneralLedgerReportData = {
  accounts: GeneralLedgerAccountOption[];
  periods: GeneralLedgerPeriodOption[];
  selectedAccount: GeneralLedgerAccountOption | null;
  selectedPeriod: GeneralLedgerPeriodOption | null;
  startDate: string;
  endDate: string;
  openingBalance: string;
  totalDebit: string;
  totalKredit: string;
  endingBalance: string;
  lines: GeneralLedgerLine[];
};

type AccountOptionRow = {
  id: string;
  kode: string;
  nama: string;
  normal_balance: "DEBIT" | "KREDIT";
};

type PeriodOptionRow = {
  id: string;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
};

type OpeningBalanceRow = {
  opening_balance: string;
};

type LedgerSummaryRow = {
  total_debit: string;
  total_kredit: string;
  ending_balance: string;
};

type LedgerLineRow = {
  entry_id: string;
  journal_number: string;
  journal_date: string;
  source: string;
  journal_description: string | null;
  line_description: string | null;
  debit: string;
  kredit: string;
  running_balance: string;
};

function getFallbackReportData(
  accounts: GeneralLedgerAccountOption[],
  periods: GeneralLedgerPeriodOption[],
  selectedAccount: GeneralLedgerAccountOption | null,
  selectedPeriod: GeneralLedgerPeriodOption | null,
  startDate: string,
  endDate: string
): GeneralLedgerReportData {
  return {
    accounts,
    periods,
    selectedAccount,
    selectedPeriod,
    startDate,
    endDate,
    openingBalance: "0",
    totalDebit: "0",
    totalKredit: "0",
    endingBalance: "0",
    lines: [],
  };
}

export async function getGeneralLedgerReportData(
  context: UnitWorkContext,
  filters: GeneralLedgerFilter = {}
): Promise<GeneralLedgerReportData> {
  const [accountResult, periodResult] = await Promise.all([
    db.query<AccountOptionRow>(
      `
        SELECT
          a.id::text AS id,
          a.kode,
          a.nama,
          a.normal_balance::text AS normal_balance
        FROM akun a
        WHERE a.is_active = TRUE
          AND a.level = 'D'
          AND (a.bum_desa_id = $1::uuid OR a.bum_desa_id IS NULL)
        ORDER BY a.kode ASC
      `,
      [context.bumDesaId]
    ),
    db.query<PeriodOptionRow>(
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
    ),
  ]);

  const accounts = accountResult.rows.map((row) => ({
    id: row.id,
    kode: row.kode,
    nama: row.nama,
    normalBalance: row.normal_balance,
  }));

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

  const selectedAccount =
    accounts.find((account) => account.id === filters.accountId) ??
    accounts.find((account) => account.kode === "1.1.01.01") ??
    accounts[0] ??
    null;

  const startDate = filters.startDate || selectedPeriod?.tanggalMulai || "";
  const endDate = filters.endDate || selectedPeriod?.tanggalSelesai || "";

  if (!selectedAccount || !selectedPeriod || !startDate || !endDate) {
    return getFallbackReportData(
      accounts,
      periods,
      selectedAccount,
      selectedPeriod,
      startDate,
      endDate
    );
  }

  const openingResult = await db.query<OpeningBalanceRow>(
    `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN a.normal_balance::text = 'DEBIT' THEN jl.debit - jl.kredit
              ELSE jl.kredit - jl.debit
            END
          ),
          0
        )::text AS opening_balance
      FROM journal_header jh
      JOIN journal_line jl
        ON jl.journal_header_id = jh.id
      JOIN akun a
        ON a.id = jl.akun_id
      WHERE jh.bum_desa_id = $1::uuid
        AND jh.unit_usaha_id = $2::uuid
        AND jl.unit_usaha_id = $2::uuid
        AND jh.status = 'POSTED'
        AND jl.akun_id = $3::uuid
        AND jh.tanggal < $4::date
    `,
    [context.bumDesaId, context.unitUsahaId, selectedAccount.id, startDate]
  );

  const openingBalance = openingResult.rows[0]?.opening_balance ?? "0";

  const summaryResult = await db.query<LedgerSummaryRow>(
    `
      SELECT
        COALESCE(SUM(jl.debit), 0)::text AS total_debit,
        COALESCE(SUM(jl.kredit), 0)::text AS total_kredit,
        (
          $6::numeric +
          COALESCE(
            SUM(
              CASE
                WHEN a.normal_balance::text = 'DEBIT' THEN jl.debit - jl.kredit
                ELSE jl.kredit - jl.debit
              END
            ),
            0
          )
        )::text AS ending_balance
      FROM journal_header jh
      JOIN journal_line jl
        ON jl.journal_header_id = jh.id
      JOIN akun a
        ON a.id = jl.akun_id
      WHERE jh.bum_desa_id = $1::uuid
        AND jh.unit_usaha_id = $2::uuid
        AND jl.unit_usaha_id = $2::uuid
        AND jh.status = 'POSTED'
        AND jl.akun_id = $3::uuid
        AND jh.tanggal BETWEEN $4::date AND $5::date
    `,
    [
      context.bumDesaId,
      context.unitUsahaId,
      selectedAccount.id,
      startDate,
      endDate,
      openingBalance,
    ]
  );

  const lineResult = await db.query<LedgerLineRow>(
    `
      WITH posted_lines AS (
        SELECT
          jl.id::text AS entry_id,
          jh.nomor_jurnal AS journal_number,
          jh.tanggal AS journal_date,
          jh.sumber::text AS source,
          jh.keterangan AS journal_description,
          jl.keterangan AS line_description,
          jl.debit,
          jl.kredit,
          CASE
            WHEN a.normal_balance::text = 'DEBIT' THEN jl.debit - jl.kredit
            ELSE jl.kredit - jl.debit
          END AS signed_amount,
          jh.created_at AS journal_created_at,
          jl.created_at AS line_created_at
        FROM journal_header jh
        JOIN journal_line jl
          ON jl.journal_header_id = jh.id
        JOIN akun a
          ON a.id = jl.akun_id
        WHERE jh.bum_desa_id = $1::uuid
          AND jh.unit_usaha_id = $2::uuid
          AND jl.unit_usaha_id = $2::uuid
          AND jh.status = 'POSTED'
          AND jl.akun_id = $3::uuid
          AND jh.tanggal BETWEEN $4::date AND $5::date
      )
      SELECT
        entry_id,
        journal_number,
        journal_date::text AS journal_date,
        source,
        journal_description,
        line_description,
        debit::text AS debit,
        kredit::text AS kredit,
        (
          $6::numeric +
          SUM(signed_amount) OVER (
            ORDER BY journal_date ASC, journal_created_at ASC, line_created_at ASC, entry_id ASC
          )
        )::text AS running_balance
      FROM posted_lines
      ORDER BY journal_date ASC, journal_created_at ASC, line_created_at ASC, entry_id ASC
    `,
    [
      context.bumDesaId,
      context.unitUsahaId,
      selectedAccount.id,
      startDate,
      endDate,
      openingBalance,
    ]
  );

  const summary = summaryResult.rows[0];

  return {
    accounts,
    periods,
    selectedAccount,
    selectedPeriod,
    startDate,
    endDate,
    openingBalance,
    totalDebit: summary?.total_debit ?? "0",
    totalKredit: summary?.total_kredit ?? "0",
    endingBalance: summary?.ending_balance ?? openingBalance,
    lines: lineResult.rows.map((row) => ({
      entryId: row.entry_id,
      journalNumber: row.journal_number,
      journalDate: row.journal_date,
      source: row.source,
      journalDescription: row.journal_description,
      lineDescription: row.line_description,
      debit: row.debit,
      kredit: row.kredit,
      runningBalance: row.running_balance,
    })),
  };
}
