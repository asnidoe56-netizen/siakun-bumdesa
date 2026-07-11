import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type BalanceSheetFilter = {
  periodId?: string;
  endDate?: string;
  showZeroAccounts?: boolean;
};

export type BalanceSheetPeriodOption = {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
};

export type BalanceSheetCategory =
  | "CURRENT_ASSET"
  | "INVESTMENT"
  | "FIXED_ASSET"
  | "INTANGIBLE_ASSET"
  | "OTHER_ASSET"
  | "CURRENT_LIABILITY"
  | "LONG_TERM_LIABILITY"
  | "EQUITY";

export type BalanceSheetLine = {
  accountId: string;
  kode: string;
  nama: string;
  normalBalance: "DEBIT" | "KREDIT";
  category: BalanceSheetCategory;
  amount: string;
  isSynthetic: boolean;
};

export type BalanceSheetSection = {
  key: BalanceSheetCategory;
  title: string;
  description: string;
  total: string;
  lines: BalanceSheetLine[];
};

export type BalanceSheetReportData = {
  periods: BalanceSheetPeriodOption[];
  selectedPeriod: BalanceSheetPeriodOption | null;
  endDate: string;
  showZeroAccounts: boolean;
  assetSections: BalanceSheetSection[];
  liabilitySections: BalanceSheetSection[];
  equitySections: BalanceSheetSection[];
  totalAssets: string;
  totalLiabilities: string;
  totalEquityBeforeCurrentProfit: string;
  currentPeriodProfit: string;
  totalEquity: string;
  totalLiabilitiesAndEquity: string;
  difference: string;
  isBalanced: boolean;
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

type BalanceSheetLineRow = {
  account_id: string;
  kode: string;
  nama: string;
  normal_balance: "DEBIT" | "KREDIT";
  category: BalanceSheetCategory;
  amount: string;
};

type CurrentProfitRow = {
  current_period_profit: string;
};

const sectionMeta: Record<
  BalanceSheetCategory,
  { title: string; description: string }
> = {
  CURRENT_ASSET: {
    title: "Aset Lancar",
    description: "Kas, setara kas, piutang, persediaan, dan aset lancar lain.",
  },
  INVESTMENT: {
    title: "Investasi",
    description: "Investasi jangka pendek atau jangka panjang sesuai bagan akun.",
  },
  FIXED_ASSET: {
    title: "Aset Tetap",
    description: "Tanah, kendaraan, peralatan, gedung, dan akumulasi penyusutan.",
  },
  INTANGIBLE_ASSET: {
    title: "Aset Takberwujud",
    description: "Software, paten, merek, dan amortisasi terkait.",
  },
  OTHER_ASSET: {
    title: "Aset Lain-lain",
    description: "Aset lain yang tidak masuk kelompok utama.",
  },
  CURRENT_LIABILITY: {
    title: "Kewajiban Jangka Pendek",
    description: "Utang usaha, utang pajak, utang gaji, dan kewajiban lancar lain.",
  },
  LONG_TERM_LIABILITY: {
    title: "Kewajiban Jangka Panjang",
    description: "Utang bank dan kewajiban jangka panjang lain.",
  },
  EQUITY: {
    title: "Ekuitas",
    description: "Penyertaan modal, saldo laba, RK pusat, dan laba/rugi berjalan.",
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
  key: BalanceSheetCategory,
  lines: BalanceSheetLine[]
): BalanceSheetSection {
  return {
    key,
    title: sectionMeta[key].title,
    description: sectionMeta[key].description,
    total: sumCurrency(lines.map((line) => line.amount)),
    lines,
  };
}

function emptyReport(
  periods: BalanceSheetPeriodOption[],
  selectedPeriod: BalanceSheetPeriodOption | null,
  endDate: string,
  showZeroAccounts: boolean
): BalanceSheetReportData {
  return {
    periods,
    selectedPeriod,
    endDate,
    showZeroAccounts,
    assetSections: [
      buildSection("CURRENT_ASSET", []),
      buildSection("INVESTMENT", []),
      buildSection("FIXED_ASSET", []),
      buildSection("INTANGIBLE_ASSET", []),
      buildSection("OTHER_ASSET", []),
    ],
    liabilitySections: [
      buildSection("CURRENT_LIABILITY", []),
      buildSection("LONG_TERM_LIABILITY", []),
    ],
    equitySections: [buildSection("EQUITY", [])],
    totalAssets: "0",
    totalLiabilities: "0",
    totalEquityBeforeCurrentProfit: "0",
    currentPeriodProfit: "0",
    totalEquity: "0",
    totalLiabilitiesAndEquity: "0",
    difference: "0",
    isBalanced: true,
    visibleAccountCount: 0,
    nonZeroAccountCount: 0,
  };
}

export async function getBalanceSheetReportData(
  context: UnitWorkContext,
  filters: BalanceSheetFilter = {}
): Promise<BalanceSheetReportData> {
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
    return emptyReport(periods, selectedPeriod, endDate, showZeroAccounts);
  }

  const lineResult = await db.query<BalanceSheetLineRow>(
    `
      WITH balance_sheet_accounts AS (
        SELECT
          a.id::text AS account_id,
          a.kode,
          a.nama,
          a.normal_balance::text AS normal_balance,
          CASE
            WHEN a.kode LIKE '1.1.%' THEN 'CURRENT_ASSET'
            WHEN a.kode LIKE '1.2.%' THEN 'INVESTMENT'
            WHEN a.kode LIKE '1.3.%' THEN 'FIXED_ASSET'
            WHEN a.kode LIKE '1.4.%' THEN 'INTANGIBLE_ASSET'
            WHEN a.kode LIKE '1.%' THEN 'OTHER_ASSET'
            WHEN a.kode LIKE '2.1.%' THEN 'CURRENT_LIABILITY'
            WHEN a.kode LIKE '2.2.%' THEN 'LONG_TERM_LIABILITY'
            WHEN a.kode LIKE '2.%' THEN 'CURRENT_LIABILITY'
            WHEN a.kode LIKE '3.%' THEN 'EQUITY'
            ELSE NULL
          END AS category
        FROM akun a
        WHERE a.is_active = TRUE
          AND a.level = 'D'
          AND (a.bum_desa_id = $1::uuid OR a.bum_desa_id IS NULL)
          AND (
            a.kode LIKE '1.%'
            OR a.kode LIKE '2.%'
            OR a.kode LIKE '3.%'
          )
      ),
      account_amounts AS (
        SELECT
          bsa.account_id,
          bsa.kode,
          bsa.nama,
          bsa.normal_balance,
          bsa.category,
          COALESCE(
            SUM(
              CASE
                WHEN jh.id IS NULL THEN 0
                WHEN bsa.kode LIKE '1.%' THEN jl.debit - jl.kredit
                WHEN bsa.kode LIKE '2.%' OR bsa.kode LIKE '3.%' THEN jl.kredit - jl.debit
                ELSE 0
              END
            ),
            0
          ) AS amount
        FROM balance_sheet_accounts bsa
        LEFT JOIN journal_line jl
          ON jl.akun_id = bsa.account_id::uuid
         AND jl.unit_usaha_id = $2::uuid
        LEFT JOIN journal_header jh
          ON jh.id = jl.journal_header_id
         AND jh.bum_desa_id = $1::uuid
         AND jh.unit_usaha_id = $2::uuid
         AND jh.status = 'POSTED'
         AND jh.tanggal <= $3::date
        GROUP BY
          bsa.account_id,
          bsa.kode,
          bsa.nama,
          bsa.normal_balance,
          bsa.category
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
          $4::boolean = TRUE
          OR amount <> 0
        )
      ORDER BY kode ASC
    `,
    [context.bumDesaId, context.unitUsahaId, endDate, showZeroAccounts]
  );

  const currentProfitResult = await db.query<CurrentProfitRow>(
    `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN jh.id IS NULL THEN 0
              WHEN a.kode LIKE '4.%' OR a.kode LIKE '7.1.%' THEN jl.kredit - jl.debit
              WHEN a.kode LIKE '5.%'
                OR a.kode LIKE '6.%'
                OR a.kode LIKE '7.2.%'
                OR a.kode LIKE '7.3.%'
                THEN -1 * (jl.debit - jl.kredit)
              ELSE 0
            END
          ),
          0
        )::text AS current_period_profit
      FROM akun a
      LEFT JOIN journal_line jl
        ON jl.akun_id = a.id
       AND jl.unit_usaha_id = $2::uuid
      LEFT JOIN journal_header jh
        ON jh.id = jl.journal_header_id
       AND jh.bum_desa_id = $1::uuid
       AND jh.unit_usaha_id = $2::uuid
       AND jh.status = 'POSTED'
       AND jh.tanggal BETWEEN $3::date AND $4::date
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
    `,
    [
      context.bumDesaId,
      context.unitUsahaId,
      selectedPeriod.tanggalMulai,
      endDate,
    ]
  );

  const currentPeriodProfit =
    currentProfitResult.rows[0]?.current_period_profit ?? "0";

  const baseLines = lineResult.rows.map((row) => ({
    accountId: row.account_id,
    kode: row.kode,
    nama: row.nama,
    normalBalance: row.normal_balance,
    category: row.category,
    amount: row.amount,
    isSynthetic: false,
  }));

  const equityLines = baseLines.filter((line) => line.category === "EQUITY");

  if (showZeroAccounts || Number(currentPeriodProfit) !== 0) {
    equityLines.push({
      accountId: "current-period-profit",
      kode: "LABA-RUGI-BERJALAN",
      nama: "Laba/Rugi Periode Berjalan",
      normalBalance: Number(currentPeriodProfit) >= 0 ? "KREDIT" : "DEBIT",
      category: "EQUITY",
      amount: currentPeriodProfit,
      isSynthetic: true,
    });
  }

  const currentAssetLines = baseLines.filter(
    (line) => line.category === "CURRENT_ASSET"
  );
  const investmentLines = baseLines.filter(
    (line) => line.category === "INVESTMENT"
  );
  const fixedAssetLines = baseLines.filter(
    (line) => line.category === "FIXED_ASSET"
  );
  const intangibleAssetLines = baseLines.filter(
    (line) => line.category === "INTANGIBLE_ASSET"
  );
  const otherAssetLines = baseLines.filter(
    (line) => line.category === "OTHER_ASSET"
  );
  const currentLiabilityLines = baseLines.filter(
    (line) => line.category === "CURRENT_LIABILITY"
  );
  const longTermLiabilityLines = baseLines.filter(
    (line) => line.category === "LONG_TERM_LIABILITY"
  );

  const assetSections = [
    buildSection("CURRENT_ASSET", currentAssetLines),
    buildSection("INVESTMENT", investmentLines),
    buildSection("FIXED_ASSET", fixedAssetLines),
    buildSection("INTANGIBLE_ASSET", intangibleAssetLines),
    buildSection("OTHER_ASSET", otherAssetLines),
  ];

  const liabilitySections = [
    buildSection("CURRENT_LIABILITY", currentLiabilityLines),
    buildSection("LONG_TERM_LIABILITY", longTermLiabilityLines),
  ];

  const equitySections = [buildSection("EQUITY", equityLines)];

  const totalAssets = sumCurrency(assetSections.map((section) => section.total));
  const totalLiabilities = sumCurrency(
    liabilitySections.map((section) => section.total)
  );

  const totalEquityBeforeCurrentProfit = sumCurrency(
    baseLines
      .filter((line) => line.category === "EQUITY")
      .map((line) => line.amount)
  );

  const totalEquity = (
    Number(totalEquityBeforeCurrentProfit) + Number(currentPeriodProfit)
  ).toString();

  const totalLiabilitiesAndEquity = (
    Number(totalLiabilities) + Number(totalEquity)
  ).toString();

  const difference = (
    Number(totalAssets) - Number(totalLiabilitiesAndEquity)
  ).toString();

  const visibleAccountCount = [
    ...currentAssetLines,
    ...investmentLines,
    ...fixedAssetLines,
    ...intangibleAssetLines,
    ...otherAssetLines,
    ...currentLiabilityLines,
    ...longTermLiabilityLines,
    ...equityLines,
  ].length;

  const nonZeroAccountCount = [
    ...currentAssetLines,
    ...investmentLines,
    ...fixedAssetLines,
    ...intangibleAssetLines,
    ...otherAssetLines,
    ...currentLiabilityLines,
    ...longTermLiabilityLines,
    ...equityLines,
  ].filter((line) => Number(line.amount) !== 0).length;

  return {
    periods,
    selectedPeriod,
    endDate,
    showZeroAccounts,
    assetSections,
    liabilitySections,
    equitySections,
    totalAssets,
    totalLiabilities,
    totalEquityBeforeCurrentProfit,
    currentPeriodProfit,
    totalEquity,
    totalLiabilitiesAndEquity,
    difference,
    isBalanced: Number(difference) === 0,
    visibleAccountCount,
    nonZeroAccountCount,
  };
}
