import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type IncomeStatementFilter = {
  periodId?: string;
  startDate?: string;
  endDate?: string;
  showZeroAccounts?: boolean;
};

export type IncomeStatementPeriodOption = {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
};

export type IncomeStatementCategory =
  | "OPERATING_REVENUE"
  | "COGS"
  | "OPERATING_EXPENSE"
  | "OTHER_INCOME"
  | "OTHER_EXPENSE";

export type IncomeStatementLine = {
  accountId: string;
  kode: string;
  nama: string;
  normalBalance: "DEBIT" | "KREDIT";
  category: IncomeStatementCategory;
  amount: string;
};

export type IncomeStatementSection = {
  key: IncomeStatementCategory;
  title: string;
  description: string;
  total: string;
  lines: IncomeStatementLine[];
};

export type IncomeStatementReportData = {
  periods: IncomeStatementPeriodOption[];
  selectedPeriod: IncomeStatementPeriodOption | null;
  startDate: string;
  endDate: string;
  showZeroAccounts: boolean;
  sections: IncomeStatementSection[];
  operatingRevenue: string;
  cogs: string;
  grossProfit: string;
  operatingExpenses: string;
  operatingProfit: string;
  otherIncome: string;
  otherExpenses: string;
  netProfit: string;
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

type IncomeStatementLineRow = {
  account_id: string;
  kode: string;
  nama: string;
  normal_balance: "DEBIT" | "KREDIT";
  category: IncomeStatementCategory;
  amount: string;
};

const sectionMeta: Record<
  IncomeStatementCategory,
  { title: string; description: string }
> = {
  OPERATING_REVENUE: {
    title: "Pendapatan Usaha",
    description: "Akun pendapatan utama dari aktivitas usaha.",
  },
  COGS: {
    title: "Harga Pokok Produksi dan Penjualan",
    description: "Akun HPP atau beban pokok yang melekat pada penjualan.",
  },
  OPERATING_EXPENSE: {
    title: "Beban Usaha",
    description: "Beban administrasi, operasional, dan pemasaran.",
  },
  OTHER_INCOME: {
    title: "Pendapatan Lain-lain",
    description: "Pendapatan di luar aktivitas usaha utama.",
  },
  OTHER_EXPENSE: {
    title: "Beban Lain-lain dan Pajak",
    description: "Beban lain-lain, beban bank, bunga, denda, dan pajak.",
  },
};

function sumCurrency(values: string[]) {
  return values
    .reduce((total, value) => {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? total + numberValue : total;
    }, 0)
    .toString();
}

function buildSection(
  key: IncomeStatementCategory,
  lines: IncomeStatementLine[]
): IncomeStatementSection {
  return {
    key,
    title: sectionMeta[key].title,
    description: sectionMeta[key].description,
    total: sumCurrency(lines.map((line) => line.amount)),
    lines,
  };
}

export async function getIncomeStatementReportData(
  context: UnitWorkContext,
  filters: IncomeStatementFilter = {}
): Promise<IncomeStatementReportData> {
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
    const emptySections = [
      buildSection("OPERATING_REVENUE", []),
      buildSection("COGS", []),
      buildSection("OPERATING_EXPENSE", []),
      buildSection("OTHER_INCOME", []),
      buildSection("OTHER_EXPENSE", []),
    ];

    return {
      periods,
      selectedPeriod,
      startDate,
      endDate,
      showZeroAccounts,
      sections: emptySections,
      operatingRevenue: "0",
      cogs: "0",
      grossProfit: "0",
      operatingExpenses: "0",
      operatingProfit: "0",
      otherIncome: "0",
      otherExpenses: "0",
      netProfit: "0",
      isProfit: true,
      visibleAccountCount: 0,
      nonZeroAccountCount: 0,
    };
  }

  const lineResult = await db.query<IncomeStatementLineRow>(
    `
      WITH income_statement_accounts AS (
        SELECT
          a.id::text AS account_id,
          a.kode,
          a.nama,
          a.normal_balance::text AS normal_balance,
          CASE
            WHEN a.kode LIKE '4.%' THEN 'OPERATING_REVENUE'
            WHEN a.kode LIKE '5.%' THEN 'COGS'
            WHEN a.kode LIKE '6.%' THEN 'OPERATING_EXPENSE'
            WHEN a.kode LIKE '7.1.%' THEN 'OTHER_INCOME'
            WHEN a.kode LIKE '7.2.%' OR a.kode LIKE '7.3.%' THEN 'OTHER_EXPENSE'
            ELSE NULL
          END AS category
        FROM akun a
        WHERE a.is_active = TRUE
          AND a.level = 'D'
          AND (a.bum_desa_id = $1::uuid OR a.bum_desa_id IS NULL)
          AND (
            a.kode LIKE '4.%'
            OR a.kode LIKE '5.%'
            OR a.kode LIKE '6.%'
            OR a.kode LIKE '7.1.%'
            OR a.kode LIKE '7.2.%'
            OR a.kode LIKE '7.3.%'
          )
      ),
      account_amounts AS (
        SELECT
          isa.account_id,
          isa.kode,
          isa.nama,
          isa.normal_balance,
          isa.category,
          COALESCE(
            SUM(
              CASE
                WHEN jh.id IS NULL THEN 0
                WHEN isa.normal_balance = 'KREDIT' THEN jl.kredit - jl.debit
                ELSE jl.debit - jl.kredit
              END
            ),
            0
          ) AS amount
        FROM income_statement_accounts isa
        LEFT JOIN journal_line jl
          ON jl.akun_id = isa.account_id::uuid
         AND jl.unit_usaha_id = $2::uuid
        LEFT JOIN journal_header jh
          ON jh.id = jl.journal_header_id
         AND jh.bum_desa_id = $1::uuid
         AND jh.unit_usaha_id = $2::uuid
         AND jh.status = 'POSTED'
         AND jh.tanggal BETWEEN $3::date AND $4::date
        GROUP BY
          isa.account_id,
          isa.kode,
          isa.nama,
          isa.normal_balance,
          isa.category
      )
      SELECT
        account_id,
        kode,
        nama,
        normal_balance,
        category,
        amount::text AS amount
      FROM account_amounts
      WHERE category IS NOT NULL
        AND (
          $5::boolean = TRUE
          OR amount <> 0
        )
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

  const lines = lineResult.rows.map((row) => ({
    accountId: row.account_id,
    kode: row.kode,
    nama: row.nama,
    normalBalance: row.normal_balance,
    category: row.category,
    amount: row.amount,
  }));

  const operatingRevenueLines = lines.filter(
    (line) => line.category === "OPERATING_REVENUE"
  );
  const cogsLines = lines.filter((line) => line.category === "COGS");
  const operatingExpenseLines = lines.filter(
    (line) => line.category === "OPERATING_EXPENSE"
  );
  const otherIncomeLines = lines.filter(
    (line) => line.category === "OTHER_INCOME"
  );
  const otherExpenseLines = lines.filter(
    (line) => line.category === "OTHER_EXPENSE"
  );

  const operatingRevenue = sumCurrency(
    operatingRevenueLines.map((line) => line.amount)
  );
  const cogs = sumCurrency(cogsLines.map((line) => line.amount));
  const grossProfit = (Number(operatingRevenue) - Number(cogs)).toString();

  const operatingExpenses = sumCurrency(
    operatingExpenseLines.map((line) => line.amount)
  );
  const operatingProfit = (
    Number(grossProfit) - Number(operatingExpenses)
  ).toString();

  const otherIncome = sumCurrency(otherIncomeLines.map((line) => line.amount));
  const otherExpenses = sumCurrency(
    otherExpenseLines.map((line) => line.amount)
  );
  const netProfit = (
    Number(operatingProfit) +
    Number(otherIncome) -
    Number(otherExpenses)
  ).toString();

  const sections = [
    buildSection("OPERATING_REVENUE", operatingRevenueLines),
    buildSection("COGS", cogsLines),
    buildSection("OPERATING_EXPENSE", operatingExpenseLines),
    buildSection("OTHER_INCOME", otherIncomeLines),
    buildSection("OTHER_EXPENSE", otherExpenseLines),
  ];

  const nonZeroAccountCount = lines.filter(
    (line) => Number(line.amount) !== 0
  ).length;

  return {
    periods,
    selectedPeriod,
    startDate,
    endDate,
    showZeroAccounts,
    sections,
    operatingRevenue,
    cogs,
    grossProfit,
    operatingExpenses,
    operatingProfit,
    otherIncome,
    otherExpenses,
    netProfit,
    isProfit: Number(netProfit) >= 0,
    visibleAccountCount: lines.length,
    nonZeroAccountCount,
  };
}
