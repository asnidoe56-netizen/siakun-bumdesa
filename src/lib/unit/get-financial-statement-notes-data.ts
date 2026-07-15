import {
  getBalanceSheetReportData,
  type BalanceSheetLine,
} from "@/lib/unit/get-balance-sheet-report-data";
import {
  getIncomeStatementReportData,
  type IncomeStatementLine,
} from "@/lib/unit/get-income-statement-report-data";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type FinancialStatementNotesFilter = {
  periodId?: string;
  startDate?: string;
  endDate?: string;
  showZeroAccounts?: boolean;
};

export type FinancialStatementNotesPeriodOption = {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
};

export type FinancialStatementNotesLine = {
  accountId: string;
  kode: string;
  nama: string;
  normalBalance: "DEBIT" | "KREDIT";
  amount: string;
  isSynthetic: boolean;
};

export type FinancialStatementNoteKey =
  | "CASH_AND_CASH_EQUIVALENTS"
  | "RECEIVABLES"
  | "INVENTORIES"
  | "FIXED_ASSETS"
  | "OTHER_ASSETS"
  | "LIABILITIES"
  | "EQUITY"
  | "REVENUE"
  | "EXPENSES";

export type FinancialStatementNote = {
  key: FinancialStatementNoteKey;
  number: string;
  title: string;
  description: string;
  sourceStatement: "NERACA" | "LABA_RUGI";
  total: string;
  lines: FinancialStatementNotesLine[];
};

export type FinancialStatementNotesPolicy = {
  title: string;
  description: string;
};

export type FinancialStatementNotesValidation = {
  balanceSheetBalanced: boolean;
  profitConsistent: boolean;
  balanceDifference: string;
  profitDifference: string;
  isConsistent: boolean;
};

export type FinancialStatementNotesReportData = {
  periods: FinancialStatementNotesPeriodOption[];
  selectedPeriod: FinancialStatementNotesPeriodOption | null;
  startDate: string;
  endDate: string;
  showZeroAccounts: boolean;
  identity: {
    bumDesaName: string;
    unitUsahaName: string;
    unitCode: string;
    unitTypeLabel: string;
    businessCategoryName: string | null;
    preparedBy: string;
  };
  basisOfPreparation: string[];
  accountingPolicies: FinancialStatementNotesPolicy[];
  notes: FinancialStatementNote[];
  validation: FinancialStatementNotesValidation;
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  netProfit: string;
  hasData: boolean;
};

const NUMBER_TOLERANCE = 0.005;

function toFiniteNumber(value: string | number) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function sumCurrency(values: Array<string | number>) {
  return values
    .reduce<number>((total, value) => total + toFiniteNumber(value), 0)
    .toString();
}

function toBalanceNoteLine(
  line: BalanceSheetLine
): FinancialStatementNotesLine {
  return {
    accountId: line.accountId,
    kode: line.kode,
    nama: line.nama,
    normalBalance: line.normalBalance,
    amount: line.amount,
    isSynthetic: line.isSynthetic,
  };
}

function toIncomeNoteLine(
  line: IncomeStatementLine
): FinancialStatementNotesLine {
  return {
    accountId: line.accountId,
    kode: line.kode,
    nama: line.nama,
    normalBalance: line.normalBalance,
    amount: line.amount,
    isSynthetic: false,
  };
}

function buildNote(
  key: FinancialStatementNoteKey,
  number: string,
  title: string,
  description: string,
  sourceStatement: "NERACA" | "LABA_RUGI",
  lines: FinancialStatementNotesLine[]
): FinancialStatementNote {
  return {
    key,
    number,
    title,
    description,
    sourceStatement,
    total: sumCurrency(lines.map((line) => line.amount)),
    lines,
  };
}

function startsWithAccountPrefix(
  line: FinancialStatementNotesLine,
  prefixes: string[]
) {
  return prefixes.some((prefix) => line.kode.startsWith(prefix));
}

export async function getFinancialStatementNotesData(
  context: UnitWorkContext,
  filters: FinancialStatementNotesFilter = {}
): Promise<FinancialStatementNotesReportData> {
  const showZeroAccounts = filters.showZeroAccounts === true;

  const [balanceSheet, incomeStatement] = await Promise.all([
    getBalanceSheetReportData(context, {
      periodId: filters.periodId,
      endDate: filters.endDate,
      showZeroAccounts,
    }),
    getIncomeStatementReportData(context, {
      periodId: filters.periodId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      showZeroAccounts,
    }),
  ]);

  const periods: FinancialStatementNotesPeriodOption[] =
    incomeStatement.periods.map((period) => ({
      id: period.id,
      nama: period.nama,
      tanggalMulai: period.tanggalMulai,
      tanggalSelesai: period.tanggalSelesai,
      status: period.status,
    }));

  const selectedPeriod =
    incomeStatement.selectedPeriod ??
    balanceSheet.selectedPeriod ??
    null;

  const assetLines = balanceSheet.assetSections
    .flatMap((section) => section.lines)
    .map(toBalanceNoteLine);

  const liabilityLines = balanceSheet.liabilitySections
    .flatMap((section) => section.lines)
    .map(toBalanceNoteLine);

  const equityLines = balanceSheet.equitySections
    .flatMap((section) => section.lines)
    .map(toBalanceNoteLine);

  const incomeLines = incomeStatement.sections.flatMap((section) =>
    section.lines.map((line) => ({
      sectionKey: section.key,
      line: toIncomeNoteLine(line),
    }))
  );

  const cashAndCashEquivalents = assetLines.filter((line) =>
    startsWithAccountPrefix(line, ["1.1.01.", "1.1.02."])
  );

  const receivables = assetLines.filter((line) =>
    startsWithAccountPrefix(line, ["1.1.03.", "1.1.04."])
  );

  const inventories = assetLines.filter((line) =>
    startsWithAccountPrefix(line, ["1.1.05."])
  );

  const fixedAssets = assetLines.filter((line) =>
    startsWithAccountPrefix(line, ["1.3."])
  );

  const specificallyClassifiedAssetIds = new Set(
    [
      ...cashAndCashEquivalents,
      ...receivables,
      ...inventories,
      ...fixedAssets,
    ].map((line) => line.accountId)
  );

  const otherAssets = assetLines.filter(
    (line) => !specificallyClassifiedAssetIds.has(line.accountId)
  );

  const revenueLines = incomeLines
    .filter(
      ({ sectionKey }) =>
        sectionKey === "OPERATING_REVENUE" ||
        sectionKey === "OTHER_INCOME"
    )
    .map(({ line }) => line);

  const expenseLines = incomeLines
    .filter(
      ({ sectionKey }) =>
        sectionKey === "COGS" ||
        sectionKey === "OPERATING_EXPENSE" ||
        sectionKey === "OTHER_EXPENSE"
    )
    .map(({ line }) => line);

  const notes: FinancialStatementNote[] = [
    buildNote(
      "CASH_AND_CASH_EQUIVALENTS",
      "1",
      "Kas dan Setara Kas",
      "Rincian saldo kas tunai, kas di bank, dan setara kas pada akhir periode pelaporan.",
      "NERACA",
      cashAndCashEquivalents
    ),
    buildNote(
      "RECEIVABLES",
      "2",
      "Piutang dan Penyisihan Piutang",
      "Rincian piutang bruto beserta akun penyisihan piutang tak tertagih.",
      "NERACA",
      receivables
    ),
    buildNote(
      "INVENTORIES",
      "3",
      "Persediaan",
      "Rincian persediaan barang dagangan, bahan baku, barang dalam proses, dan barang jadi.",
      "NERACA",
      inventories
    ),
    buildNote(
      "FIXED_ASSETS",
      "4",
      "Aset Tetap",
      "Rincian nilai perolehan aset tetap dan akumulasi penyusutan yang terkait.",
      "NERACA",
      fixedAssets
    ),
    buildNote(
      "OTHER_ASSETS",
      "5",
      "Aset Lainnya",
      "Rincian investasi, aset takberwujud, dan aset lain yang tidak termasuk catatan aset utama.",
      "NERACA",
      otherAssets
    ),
    buildNote(
      "LIABILITIES",
      "6",
      "Kewajiban",
      "Rincian kewajiban jangka pendek dan kewajiban jangka panjang.",
      "NERACA",
      liabilityLines
    ),
    buildNote(
      "EQUITY",
      "7",
      "Ekuitas",
      "Rincian penyertaan modal, saldo laba, akun antarunit, serta komponen ekuitas lainnya.",
      "NERACA",
      equityLines
    ),
    buildNote(
      "REVENUE",
      "8",
      "Pendapatan",
      "Rincian pendapatan usaha dan pendapatan lain-lain selama periode pelaporan.",
      "LABA_RUGI",
      revenueLines
    ),
    buildNote(
      "EXPENSES",
      "9",
      "Harga Pokok dan Beban",
      "Rincian harga pokok produksi atau penjualan, beban usaha, dan beban lain-lain.",
      "LABA_RUGI",
      expenseLines
    ),
  ];

  const currentProfit = toFiniteNumber(balanceSheet.currentPeriodProfit);
  const netProfit = toFiniteNumber(incomeStatement.netProfit);
  const profitDifference = currentProfit - netProfit;
  const profitConsistent =
    Math.abs(profitDifference) <= NUMBER_TOLERANCE;

  const balanceDifference = toFiniteNumber(balanceSheet.difference);

  const validation: FinancialStatementNotesValidation = {
    balanceSheetBalanced: balanceSheet.isBalanced,
    profitConsistent,
    balanceDifference: balanceDifference.toString(),
    profitDifference: profitDifference.toString(),
    isConsistent: balanceSheet.isBalanced && profitConsistent,
  };

  const hasData = notes.some((note) => note.lines.length > 0);

  return {
    periods,
    selectedPeriod,
    startDate:
      incomeStatement.startDate ||
      selectedPeriod?.tanggalMulai ||
      "",
    endDate:
      incomeStatement.endDate ||
      balanceSheet.endDate ||
      selectedPeriod?.tanggalSelesai ||
      "",
    showZeroAccounts,
    identity: {
      bumDesaName: context.bumDesaName,
      unitUsahaName: context.unitUsahaName,
      unitCode: context.unitCode,
      unitTypeLabel: context.unitTypeLabel,
      businessCategoryName: context.businessCategoryName,
      preparedBy: context.userName,
    },
    basisOfPreparation: [
      "Catatan atas laporan keuangan ini merupakan bagian yang tidak terpisahkan dari laporan keuangan unit usaha.",
      "Laporan disusun berdasarkan jurnal berstatus POSTED dengan bagan akun yang mengacu pada Kepmendesa Nomor 136 Tahun 2022.",
      "Laporan posisi keuangan disajikan sampai tanggal akhir periode, sedangkan pendapatan dan beban disajikan untuk rentang periode pelaporan.",
      "Seluruh angka disajikan dalam Rupiah dan mengikuti saldo akun pada Buku Besar, Neraca Saldo, Neraca, dan Laporan Laba Rugi.",
    ],
    accountingPolicies: [
      {
        title: "Kas dan Setara Kas",
        description:
          "Disajikan sebesar saldo akun kas tunai, kas di bank, dan akun setara kas pada tanggal laporan.",
      },
      {
        title: "Piutang",
        description:
          "Disajikan berdasarkan saldo piutang dan dikurangi atau ditambah dampak akun penyisihan sesuai saldo buku besar.",
      },
      {
        title: "Persediaan",
        description:
          "Disajikan sebesar saldo akun persediaan barang dagangan, bahan baku, barang dalam proses, dan barang jadi.",
      },
      {
        title: "Aset Tetap",
        description:
          "Disajikan berdasarkan nilai perolehan dan akun akumulasi penyusutan yang telah diposting.",
      },
      {
        title: "Kewajiban",
        description:
          "Disajikan sebesar saldo kewajiban jangka pendek dan jangka panjang pada tanggal laporan.",
      },
      {
        title: "Pendapatan dan Beban",
        description:
          "Pendapatan dan beban disajikan berdasarkan jurnal posted selama periode pelaporan.",
      },
    ],
    notes,
    validation,
    totalAssets: balanceSheet.totalAssets,
    totalLiabilities: balanceSheet.totalLiabilities,
    totalEquity: balanceSheet.totalEquity,
    netProfit: incomeStatement.netProfit,
    hasData,
  };
}
