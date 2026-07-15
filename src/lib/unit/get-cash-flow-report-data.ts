import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type CashFlowFilter = {
  periodId?: string;
  startDate?: string;
  endDate?: string;
  showInternalTransfers?: boolean;
};

export type CashFlowPeriodOption = {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: string;
};

export type CashFlowCategory =
  | "OPERATING"
  | "INVESTING"
  | "FINANCING"
  | "INTERNAL_TRANSFER"
  | "UNCLASSIFIED";

export type CashFlowLine = {
  journalId: string;
  journalNumber: string;
  journalDate: string;
  templateCode: string | null;
  businessEvent: string;
  description: string;
  category: CashFlowCategory;
  activityName: string;
  cashIn: string;
  cashOut: string;
  netAmount: string;
  counterpartCodes: string[];
  counterpartAccounts: string;
  classificationBasis: string;
};

export type CashFlowSection = {
  key: "OPERATING" | "INVESTING" | "FINANCING";
  title: string;
  description: string;
  totalCashIn: string;
  totalCashOut: string;
  netCashFlow: string;
  lines: CashFlowLine[];
};

export type CashFlowOfficialRowType =
  | "SECTION"
  | "SUBSECTION"
  | "DETAIL"
  | "TOTAL"
  | "NET"
  | "SUMMARY";

export type CashFlowOfficialRow = {
  number: string;
  description: string;
  amount: string | null;
  rowType: CashFlowOfficialRowType;
  category: "OPERATING" | "INVESTING" | "FINANCING" | "SUMMARY";
  isSupplemental: boolean;
  note: string | null;
};

export type CashFlowReportData = {
  periods: CashFlowPeriodOption[];
  selectedPeriod: CashFlowPeriodOption | null;
  startDate: string;
  endDate: string;
  showInternalTransfers: boolean;
  officialRows: CashFlowOfficialRow[];
  sections: CashFlowSection[];
  internalTransferLines: CashFlowLine[];
  unclassifiedLines: CashFlowLine[];
  openingCashBalance: string;
  operatingCashFlow: string;
  investingCashFlow: string;
  financingCashFlow: string;
  totalCashIn: string;
  totalCashOut: string;
  netCashFlow: string;
  calculatedEndingCashBalance: string;
  endingCashBalance: string;
  reconciliationDifference: string;
  isReconciled: boolean;
  visibleTransactionCount: number;
  internalTransferCount: number;
  unclassifiedCount: number;
};

type PeriodOptionRow = {
  id: string;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: string;
};

type CashBalanceRow = {
  opening_cash_balance: string;
  ending_cash_balance: string;
};

type CashJournalRow = {
  journal_id: string;
  journal_number: string;
  journal_date: string;
  template_code: string | null;
  business_event: string | null;
  journal_source: string;
  description: string | null;
  cash_debit: string;
  cash_credit: string;
  noncash_line_count: number;
  other_unit_cash_line_count: number;
  counterpart_codes: string[] | null;
  counterpart_accounts: string | null;
  other_unit_names: string | null;
};

type ClassificationResult = {
  category: CashFlowCategory;
  activityName: string;
  basis: string;
};

const sectionMeta: Record<
  "OPERATING" | "INVESTING" | "FINANCING",
  { title: string; description: string }
> = {
  OPERATING: {
    title: "Arus Kas dari Aktivitas Operasi",
    description:
      "Penerimaan dan pengeluaran kas yang berasal dari kegiatan usaha utama dan operasional harian.",
  },
  INVESTING: {
    title: "Arus Kas dari Aktivitas Investasi",
    description:
      "Perolehan atau pelepasan investasi, aset tetap, dan aset takberwujud.",
  },
  FINANCING: {
    title: "Arus Kas dari Aktivitas Pendanaan",
    description:
      "Penerimaan modal, pinjaman jangka panjang, setoran ke kantor pusat, dan transaksi pendanaan lainnya.",
  },
};

function toFiniteNumber(value: string | number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function sumCurrency(values: Array<string | number>) {
  return values
    .reduce<number>((total, value) => total + toFiniteNumber(value), 0)
    .toString();
}

function classifyByBusinessEvent(
  businessEvent: string,
  netAmount: number
): ClassificationResult | null {
  const eventMap: Record<
    string,
    {
      category: CashFlowCategory;
      inflowName: string;
      outflowName: string;
    }
  > = {
    CASH_INCOME_RECEIPT: {
      category: "OPERATING",
      inflowName: "Penerimaan pendapatan tunai",
      outflowName: "Pengembalian pendapatan tunai",
    },
    PRODUCTION_FINISHED_GOODS_CASH_SALE: {
      category: "OPERATING",
      inflowName: "Penerimaan penjualan barang jadi",
      outflowName: "Pengembalian penjualan barang jadi",
    },
    CASH_EXPENSE_PAYMENT: {
      category: "OPERATING",
      inflowName: "Pengembalian pembayaran barang atau jasa",
      outflowName: "Pembayaran barang atau jasa tunai",
    },
    PAY_TRADE_PAYABLE: {
      category: "OPERATING",
      inflowName: "Pengembalian pembayaran utang usaha",
      outflowName: "Pembayaran utang usaha",
    },
    PAY_SALARY_ALLOWANCE: {
      category: "OPERATING",
      inflowName: "Pengembalian pembayaran gaji dan tunjangan",
      outflowName: "Pembayaran gaji dan tunjangan",
    },
    BUY_CONSUMABLE_SUPPLIES: {
      category: "OPERATING",
      inflowName: "Pengembalian pembelian perlengkapan",
      outflowName: "Pembelian perlengkapan dan barang pakai habis",
    },
    PRODUCTION_MATERIAL_CASH_PURCHASE: {
      category: "OPERATING",
      inflowName: "Pengembalian pembelian bahan produksi",
      outflowName: "Pembelian bahan produksi tunai",
    },
    CAPITAL_CONTRIBUTION_RECEIPT: {
      category: "FINANCING",
      inflowName: "Penerimaan penyertaan modal",
      outflowName: "Pengembalian penyertaan modal",
    },
    UNIT_REMIT_TO_CENTER: {
      category: "FINANCING",
      inflowName: "Penerimaan kas dari kantor pusat",
      outflowName: "Setoran kas ke kantor pusat",
    },
    CASH_TO_BANK_TRANSFER: {
      category: "INTERNAL_TRANSFER",
      inflowName: "Transfer internal antar-akun kas",
      outflowName: "Transfer internal antar-akun kas",
    },
  };

  const mappedEvent = eventMap[businessEvent];

  if (!mappedEvent) {
    return null;
  }

  return {
    category: mappedEvent.category,
    activityName:
      netAmount >= 0 ? mappedEvent.inflowName : mappedEvent.outflowName,
    basis: `Business event ${businessEvent}`,
  };
}

function classifyByCounterpartAccounts(
  counterpartCodes: string[],
  netAmount: number
): ClassificationResult {
  const hasInvestingAccount = counterpartCodes.some(
    (code) =>
      code.startsWith("1.2.") ||
      code.startsWith("1.3.") ||
      code.startsWith("1.4.")
  );

  if (hasInvestingAccount) {
    return {
      category: "INVESTING",
      activityName:
        netAmount >= 0
          ? "Penerimaan dari pelepasan aset atau investasi"
          : "Perolehan aset atau investasi",
      basis: "Klasifikasi akun lawan investasi/aset tetap",
    };
  }

  const hasFinancingAccount = counterpartCodes.some(
    (code) =>
      code.startsWith("2.2.") ||
      code.startsWith("3.") ||
      code.startsWith("1.1.99.")
  );

  if (hasFinancingAccount) {
    return {
      category: "FINANCING",
      activityName:
        netAmount >= 0
          ? "Penerimaan dari aktivitas pendanaan"
          : "Pengeluaran untuk aktivitas pendanaan",
      basis: "Klasifikasi akun lawan kewajiban jangka panjang atau ekuitas",
    };
  }

  const hasOperatingAccount = counterpartCodes.some(
    (code) =>
      code.startsWith("1.1.03.") ||
      code.startsWith("1.1.04.") ||
      code.startsWith("1.1.05.") ||
      code.startsWith("1.1.06.") ||
      code.startsWith("2.1.") ||
      code.startsWith("4.") ||
      code.startsWith("5.") ||
      code.startsWith("6.") ||
      code.startsWith("7.")
  );

  if (hasOperatingAccount) {
    return {
      category: "OPERATING",
      activityName:
        netAmount >= 0
          ? "Penerimaan kas aktivitas operasi"
          : "Pengeluaran kas aktivitas operasi",
      basis: "Klasifikasi akun lawan operasional",
    };
  }

  return {
    category: "UNCLASSIFIED",
    activityName:
      netAmount >= 0
        ? "Penerimaan kas belum terklasifikasi"
        : "Pengeluaran kas belum terklasifikasi",
    basis: "Belum ditemukan aturan klasifikasi yang sesuai",
  };
}

function classifyCashJournal(row: CashJournalRow): ClassificationResult {
  const cashDebit = toFiniteNumber(row.cash_debit);
  const cashCredit = toFiniteNumber(row.cash_credit);
  const netAmount = cashDebit - cashCredit;
  const businessEvent = row.business_event ?? row.journal_source;

  if (
    row.other_unit_cash_line_count > 0 &&
    Math.abs(netAmount) >= 0.005
  ) {
    return {
      category: "FINANCING",
      activityName:
        netAmount > 0
          ? "Penerimaan alokasi kas antarunit"
          : "Penyaluran kas antarunit",
      basis: "Transfer kas antara unit kerja dalam satu BUM Desa",
    };
  }

  if (
    businessEvent === "CASH_TO_BANK_TRANSFER" ||
    (
      row.other_unit_cash_line_count === 0 &&
      row.noncash_line_count === 0 &&
      cashDebit > 0 &&
      cashCredit > 0
    )
  ) {
    return {
      category: "INTERNAL_TRANSFER",
      activityName: "Transfer internal antar-akun kas dan setara kas",
      basis: "Seluruh baris jurnal menggunakan akun kas atau setara kas",
    };
  }

  const businessEventClassification = classifyByBusinessEvent(
    businessEvent,
    netAmount
  );

  if (businessEventClassification) {
    return businessEventClassification;
  }

  return classifyByCounterpartAccounts(
    row.counterpart_codes ?? [],
    netAmount
  );
}

function buildSection(
  key: "OPERATING" | "INVESTING" | "FINANCING",
  lines: CashFlowLine[]
): CashFlowSection {
  const totalCashIn = sumCurrency(lines.map((line) => line.cashIn));
  const totalCashOut = sumCurrency(lines.map((line) => line.cashOut));

  return {
    key,
    title: sectionMeta[key].title,
    description: sectionMeta[key].description,
    totalCashIn,
    totalCashOut,
    netCashFlow: (
      toFiniteNumber(totalCashIn) - toFiniteNumber(totalCashOut)
    ).toString(),
    lines,
  };
}

function sumLineDirection(
  lines: CashFlowLine[],
  direction: "IN" | "OUT"
) {
  return sumCurrency(
    lines.map((line) =>
      direction === "IN" ? line.cashIn : line.cashOut
    )
  );
}

function getLineSearchText(line: CashFlowLine) {
  return [
    line.businessEvent,
    line.activityName,
    line.description,
    line.counterpartAccounts,
    ...line.counterpartCodes,
  ]
    .join(" ")
    .toLowerCase();
}

function lineContainsAnyText(
  line: CashFlowLine,
  terms: string[]
) {
  const searchText = getLineSearchText(line);
  return terms.some((term) => searchText.includes(term));
}

function remainingAmount(
  total: string | number,
  allocatedAmounts: Array<string | number>
) {
  const remainder =
    toFiniteNumber(total) -
    allocatedAmounts.reduce<number>(
      (sum, amount) => sum + toFiniteNumber(amount),
      0
    );

  return Math.abs(remainder) < 0.005
    ? "0"
    : Math.max(0, remainder).toString();
}

function isInterunitCashFlow(line: CashFlowLine) {
  return (
    line.classificationBasis ===
      "Transfer kas antara unit kerja dalam satu BUM Desa" ||
    line.activityName.toLowerCase().includes("antarunit")
  );
}

function buildOfficialRows(
  operatingLines: CashFlowLine[],
  investingLines: CashFlowLine[],
  financingLines: CashFlowLine[],
  openingCashBalance: string,
  endingCashBalance: string
): CashFlowOfficialRow[] {
  const operatingCashIn = sumLineDirection(operatingLines, "IN");
  const operatingCashOut = sumLineDirection(operatingLines, "OUT");
  const operatingNet = (
    toFiniteNumber(operatingCashIn) -
    toFiniteNumber(operatingCashOut)
  ).toString();

  const operatingInterestDividendIn = sumLineDirection(
    operatingLines.filter(
      (line) =>
        toFiniteNumber(line.cashIn) > 0 &&
        lineContainsAnyText(line, ["bunga", "dividen"])
    ),
    "IN"
  );

  const operatingSalesIn = remainingAmount(
    operatingCashIn,
    [operatingInterestDividendIn]
  );

  const supplierOutLines = operatingLines.filter(
    (line) =>
      toFiniteNumber(line.cashOut) > 0 &&
      (
        [
          "PAY_TRADE_PAYABLE",
          "BUY_CONSUMABLE_SUPPLIES",
          "PRODUCTION_MATERIAL_CASH_PURCHASE",
        ].includes(line.businessEvent) ||
        lineContainsAnyText(line, [
          "pemasok",
          "supplier",
          "utang usaha",
          "persediaan",
          "bahan produksi",
          "perlengkapan",
        ])
      )
  );

  const salaryOutLines = operatingLines.filter(
    (line) =>
      toFiniteNumber(line.cashOut) > 0 &&
      !supplierOutLines.includes(line) &&
      (
        line.businessEvent === "PAY_SALARY_ALLOWANCE" ||
        lineContainsAnyText(line, [
          "gaji",
          "upah",
          "tunjangan",
          "pegawai",
          "karyawan",
        ])
      )
  );

  const taxOutLines = operatingLines.filter(
    (line) =>
      toFiniteNumber(line.cashOut) > 0 &&
      !supplierOutLines.includes(line) &&
      !salaryOutLines.includes(line) &&
      lineContainsAnyText(line, ["pajak"])
  );

  const interestOutLines = operatingLines.filter(
    (line) =>
      toFiniteNumber(line.cashOut) > 0 &&
      !supplierOutLines.includes(line) &&
      !salaryOutLines.includes(line) &&
      !taxOutLines.includes(line) &&
      lineContainsAnyText(line, ["bunga"])
  );

  const supplierOut = sumLineDirection(supplierOutLines, "OUT");
  const salaryOut = sumLineDirection(salaryOutLines, "OUT");
  const taxOut = sumLineDirection(taxOutLines, "OUT");
  const interestOut = sumLineDirection(interestOutLines, "OUT");
  const otherOperatingOut = remainingAmount(
    operatingCashOut,
    [supplierOut, salaryOut, taxOut, interestOut]
  );

  const investingCashIn = sumLineDirection(investingLines, "IN");
  const investingCashOut = sumLineDirection(investingLines, "OUT");
  const investingNet = (
    toFiniteNumber(investingCashIn) -
    toFiniteNumber(investingCashOut)
  ).toString();

  const investmentSaleIn = sumLineDirection(
    investingLines.filter(
      (line) =>
        toFiniteNumber(line.cashIn) > 0 &&
        lineContainsAnyText(line, ["investasi"])
    ),
    "IN"
  );

  const fixedAssetSaleIn = remainingAmount(
    investingCashIn,
    [investmentSaleIn]
  );

  const investmentPurchaseOut = sumLineDirection(
    investingLines.filter(
      (line) =>
        toFiniteNumber(line.cashOut) > 0 &&
        lineContainsAnyText(line, ["investasi"])
    ),
    "OUT"
  );

  const fixedAssetPurchaseOut = remainingAmount(
    investingCashOut,
    [investmentPurchaseOut]
  );

  const financingCashIn = sumLineDirection(financingLines, "IN");
  const financingCashOut = sumLineDirection(financingLines, "OUT");
  const financingNet = (
    toFiniteNumber(financingCashIn) -
    toFiniteNumber(financingCashOut)
  ).toString();

  const financingInLines = financingLines.filter(
    (line) => toFiniteNumber(line.cashIn) > 0
  );
  const financingOutLines = financingLines.filter(
    (line) => toFiniteNumber(line.cashOut) > 0
  );

  const interunitInLines = financingInLines.filter(isInterunitCashFlow);
  const interunitOutLines = financingOutLines.filter(isInterunitCashFlow);

  const donationInLines = financingInLines.filter(
    (line) =>
      !interunitInLines.includes(line) &&
      lineContainsAnyText(line, ["donasi", "sumbangan"])
  );

  const communityCapitalInLines = financingInLines.filter(
    (line) =>
      !interunitInLines.includes(line) &&
      !donationInLines.includes(line) &&
      line.counterpartAccounts.toLowerCase().includes("masyarakat")
  );

  const villageCapitalInLines = financingInLines.filter(
    (line) =>
      !interunitInLines.includes(line) &&
      !donationInLines.includes(line) &&
      !communityCapitalInLines.includes(line) &&
      (
        line.counterpartAccounts.toLowerCase().includes("desa") ||
        line.businessEvent === "CAPITAL_CONTRIBUTION_RECEIPT"
      )
  );

  const longTermDebtInLines = financingInLines.filter(
    (line) =>
      !interunitInLines.includes(line) &&
      !donationInLines.includes(line) &&
      !communityCapitalInLines.includes(line) &&
      !villageCapitalInLines.includes(line) &&
      (
        line.counterpartCodes.some((code) =>
          code.startsWith("2.2.")
        ) ||
        lineContainsAnyText(line, ["utang jangka panjang"])
      )
  );

  const villageCapitalIn = sumLineDirection(
    villageCapitalInLines,
    "IN"
  );
  const communityCapitalIn = sumLineDirection(
    communityCapitalInLines,
    "IN"
  );
  const donationIn = sumLineDirection(donationInLines, "IN");
  const longTermDebtIn = sumLineDirection(
    longTermDebtInLines,
    "IN"
  );
  const interunitIn = sumLineDirection(interunitInLines, "IN");

  const otherFinancingIn = remainingAmount(
    financingCashIn,
    [
      villageCapitalIn,
      communityCapitalIn,
      donationIn,
      longTermDebtIn,
      interunitIn,
    ]
  );

  const villageProfitShareOutLines = financingOutLines.filter(
    (line) =>
      !interunitOutLines.includes(line) &&
      lineContainsAnyText(line, [
        "bagi hasil penyertaan modal desa",
        "bagi hasil modal desa",
      ])
  );

  const communityProfitShareOutLines = financingOutLines.filter(
    (line) =>
      !interunitOutLines.includes(line) &&
      !villageProfitShareOutLines.includes(line) &&
      lineContainsAnyText(line, [
        "bagi hasil penyertaan modal masyarakat",
        "bagi hasil modal masyarakat",
      ])
  );

  const longTermDebtPrincipalOutLines = financingOutLines.filter(
    (line) =>
      !interunitOutLines.includes(line) &&
      !villageProfitShareOutLines.includes(line) &&
      !communityProfitShareOutLines.includes(line) &&
      (
        line.counterpartCodes.some((code) =>
          code.startsWith("2.2.")
        ) ||
        lineContainsAnyText(line, [
          "pokok utang jangka panjang",
          "pelunasan utang jangka panjang",
        ])
      )
  );

  const villageProfitShareOut = sumLineDirection(
    villageProfitShareOutLines,
    "OUT"
  );
  const communityProfitShareOut = sumLineDirection(
    communityProfitShareOutLines,
    "OUT"
  );
  const longTermDebtPrincipalOut = sumLineDirection(
    longTermDebtPrincipalOutLines,
    "OUT"
  );
  const interunitOut = sumLineDirection(interunitOutLines, "OUT");

  const otherFinancingOut = remainingAmount(
    financingCashOut,
    [
      villageProfitShareOut,
      communityProfitShareOut,
      longTermDebtPrincipalOut,
      interunitOut,
    ]
  );

  const netCashFlow = (
    toFiniteNumber(operatingNet) +
    toFiniteNumber(investingNet) +
    toFiniteNumber(financingNet)
  ).toString();

  const rows: CashFlowOfficialRow[] = [
    {
      number: "1",
      description: "ARUS KAS DARI AKTIVITAS OPERASI",
      amount: null,
      rowType: "SECTION",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "2",
      description: "Arus Kas Masuk",
      amount: null,
      rowType: "SUBSECTION",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "3",
      description: "Penerimaan kas dari penjualan barang dan jasa",
      amount: operatingSalesIn,
      rowType: "DETAIL",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "4",
      description: "Penerimaan kas dari bunga dan dividen",
      amount: operatingInterestDividendIn,
      rowType: "DETAIL",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "5",
      description: "Jumlah arus kas masuk dari aktivitas operasi",
      amount: operatingCashIn,
      rowType: "TOTAL",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "7",
      description: "Arus Kas Keluar",
      amount: null,
      rowType: "SUBSECTION",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "8",
      description:
        "Pengeluaran kas untuk pembayaran ke pemasok barang dan jasa",
      amount: supplierOut,
      rowType: "DETAIL",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "9",
      description:
        "Pengeluaran kas untuk pembayaran gaji/upah pegawai/karyawan",
      amount: salaryOut,
      rowType: "DETAIL",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "10",
      description: "Pengeluaran kas untuk pembayaran pajak",
      amount: taxOut,
      rowType: "DETAIL",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "11",
      description: "Pengeluaran kas untuk pembayaran bunga",
      amount: interestOut,
      rowType: "DETAIL",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "12",
      description:
        "Pengeluaran kas untuk pembayaran beban-beban yang lain",
      amount: otherOperatingOut,
      rowType: "DETAIL",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "13",
      description: "Jumlah arus kas keluar dari aktivitas operasi",
      amount: operatingCashOut,
      rowType: "TOTAL",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "15",
      description: "Arus kas bersih dari aktivitas operasi",
      amount: operatingNet,
      rowType: "NET",
      category: "OPERATING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "17",
      description: "ARUS KAS DARI AKTIVITAS INVESTASI",
      amount: null,
      rowType: "SECTION",
      category: "INVESTING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "18",
      description: "Arus Kas Masuk",
      amount: null,
      rowType: "SUBSECTION",
      category: "INVESTING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "19",
      description: "Penerimaan kas dari penjualan aset tetap",
      amount: fixedAssetSaleIn,
      rowType: "DETAIL",
      category: "INVESTING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "20",
      description: "Penerimaan kas dari penjualan investasi",
      amount: investmentSaleIn,
      rowType: "DETAIL",
      category: "INVESTING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "21",
      description: "Jumlah arus kas masuk dari aktivitas investasi",
      amount: investingCashIn,
      rowType: "TOTAL",
      category: "INVESTING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "23",
      description: "Arus Kas Keluar",
      amount: null,
      rowType: "SUBSECTION",
      category: "INVESTING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "24",
      description: "Pengeluaran kas untuk pembelian aset tetap",
      amount: fixedAssetPurchaseOut,
      rowType: "DETAIL",
      category: "INVESTING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "25",
      description: "Pengeluaran kas untuk pembelian investasi",
      amount: investmentPurchaseOut,
      rowType: "DETAIL",
      category: "INVESTING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "26",
      description: "Jumlah arus kas keluar dari aktivitas investasi",
      amount: investingCashOut,
      rowType: "TOTAL",
      category: "INVESTING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "28",
      description: "Arus kas bersih dari aktivitas investasi",
      amount: investingNet,
      rowType: "NET",
      category: "INVESTING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "30",
      description: "ARUS KAS DARI AKTIVITAS PENDANAAN",
      amount: null,
      rowType: "SECTION",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "31",
      description: "Arus Kas Masuk",
      amount: null,
      rowType: "SUBSECTION",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "32",
      description: "Penerimaan kas dari penyertaan modal desa",
      amount: villageCapitalIn,
      rowType: "DETAIL",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "33",
      description: "Penerimaan kas dari penyertaan modal masyarakat",
      amount: communityCapitalIn,
      rowType: "DETAIL",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "34",
      description: "Penerimaan kas dari modal donasi/sumbangan",
      amount: donationIn,
      rowType: "DETAIL",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "35",
      description: "Penerimaan kas dari utang jangka panjang",
      amount: longTermDebtIn,
      rowType: "DETAIL",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
  ];

  if (toFiniteNumber(interunitIn) > 0) {
    rows.push({
      number: "35A",
      description: "Penerimaan alokasi kas dari Kantor Pusat/unit lain",
      amount: interunitIn,
      rowType: "DETAIL",
      category: "FINANCING",
      isSupplemental: true,
      note:
        "Pos laporan unit; dieliminasi pada laporan gabungan BUM Desa.",
    });
  }

  if (toFiniteNumber(otherFinancingIn) > 0) {
    rows.push({
      number: "35B",
      description: "Penerimaan kas dari aktivitas pendanaan lainnya",
      amount: otherFinancingIn,
      rowType: "DETAIL",
      category: "FINANCING",
      isSupplemental: true,
      note: "Pos tambahan agar seluruh arus kas pendanaan tersaji.",
    });
  }

  rows.push(
    {
      number: "36",
      description: "Jumlah arus kas masuk dari aktivitas pendanaan",
      amount: financingCashIn,
      rowType: "TOTAL",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "38",
      description: "Arus Kas Keluar",
      amount: null,
      rowType: "SUBSECTION",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "39",
      description: "Pembayaran bagi hasil penyertaan modal desa",
      amount: villageProfitShareOut,
      rowType: "DETAIL",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "40",
      description: "Pembayaran bagi hasil penyertaan modal masyarakat",
      amount: communityProfitShareOut,
      rowType: "DETAIL",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "41",
      description: "Pembayaran pokok utang jangka panjang",
      amount: longTermDebtPrincipalOut,
      rowType: "DETAIL",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    }
  );

  if (toFiniteNumber(interunitOut) > 0) {
    rows.push({
      number: "41A",
      description: "Penyaluran kas kepada Kantor Pusat/unit lain",
      amount: interunitOut,
      rowType: "DETAIL",
      category: "FINANCING",
      isSupplemental: true,
      note:
        "Pos laporan unit; dieliminasi pada laporan gabungan BUM Desa.",
    });
  }

  if (toFiniteNumber(otherFinancingOut) > 0) {
    rows.push({
      number: "41B",
      description: "Pengeluaran kas untuk aktivitas pendanaan lainnya",
      amount: otherFinancingOut,
      rowType: "DETAIL",
      category: "FINANCING",
      isSupplemental: true,
      note: "Pos tambahan agar seluruh arus kas pendanaan tersaji.",
    });
  }

  rows.push(
    {
      number: "42",
      description: "Jumlah arus kas keluar dari aktivitas pendanaan",
      amount: financingCashOut,
      rowType: "TOTAL",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "44",
      description: "Arus kas bersih dari aktivitas pendanaan",
      amount: financingNet,
      rowType: "NET",
      category: "FINANCING",
      isSupplemental: false,
      note: null,
    },
    {
      number: "46",
      description: "Kenaikan (penurunan) kas",
      amount: netCashFlow,
      rowType: "SUMMARY",
      category: "SUMMARY",
      isSupplemental: false,
      note: null,
    },
    {
      number: "47",
      description: "Saldo kas awal tahun/periode",
      amount: openingCashBalance,
      rowType: "SUMMARY",
      category: "SUMMARY",
      isSupplemental: false,
      note: null,
    },
    {
      number: "48",
      description: "Saldo kas akhir tahun/periode",
      amount: endingCashBalance,
      rowType: "SUMMARY",
      category: "SUMMARY",
      isSupplemental: false,
      note: null,
    }
  );

  return rows;
}

function emptyReport(
  periods: CashFlowPeriodOption[],
  selectedPeriod: CashFlowPeriodOption | null,
  startDate: string,
  endDate: string,
  showInternalTransfers: boolean
): CashFlowReportData {
  return {
    periods,
    selectedPeriod,
    startDate,
    endDate,
    showInternalTransfers,
    officialRows: buildOfficialRows([], [], [], "0", "0"),
    sections: [
      buildSection("OPERATING", []),
      buildSection("INVESTING", []),
      buildSection("FINANCING", []),
    ],
    internalTransferLines: [],
    unclassifiedLines: [],
    openingCashBalance: "0",
    operatingCashFlow: "0",
    investingCashFlow: "0",
    financingCashFlow: "0",
    totalCashIn: "0",
    totalCashOut: "0",
    netCashFlow: "0",
    calculatedEndingCashBalance: "0",
    endingCashBalance: "0",
    reconciliationDifference: "0",
    isReconciled: true,
    visibleTransactionCount: 0,
    internalTransferCount: 0,
    unclassifiedCount: 0,
  };
}

export async function getCashFlowReportData(
  context: UnitWorkContext,
  filters: CashFlowFilter = {}
): Promise<CashFlowReportData> {
  const showInternalTransfers = filters.showInternalTransfers === true;

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
      showInternalTransfers
    );
  }

  const balanceResult = await db.query<CashBalanceRow>(
    `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN jh.id IS NOT NULL
                AND jh.tanggal < $3::date
                THEN jl.debit - jl.kredit
              ELSE 0
            END
          ),
          0
        )::text AS opening_cash_balance,
        COALESCE(
          SUM(
            CASE
              WHEN jh.id IS NOT NULL
                AND jh.tanggal <= $4::date
                THEN jl.debit - jl.kredit
              ELSE 0
            END
          ),
          0
        )::text AS ending_cash_balance
      FROM akun a
      LEFT JOIN journal_line jl
        ON jl.akun_id = a.id
       AND jl.unit_usaha_id = $2::uuid
      LEFT JOIN journal_header jh
        ON jh.id = jl.journal_header_id
       AND jh.bum_desa_id = $1::uuid
       AND jh.status = 'POSTED'
      WHERE a.is_active = TRUE
        AND a.level = 'D'
        AND (a.bum_desa_id = $1::uuid OR a.bum_desa_id IS NULL)
        AND (
          a.kode LIKE '1.1.01.%'
          OR a.kode LIKE '1.1.02.%'
        )
    `,
    [context.bumDesaId, context.unitUsahaId, startDate, endDate]
  );

  const journalResult = await db.query<CashJournalRow>(
    `
      SELECT
        jh.id::text AS journal_id,
        jh.nomor_jurnal AS journal_number,
        jh.tanggal::text AS journal_date,
        tt.kode AS template_code,
        tt.business_event_code AS business_event,
        jh.sumber::text AS journal_source,
        jh.keterangan AS description,
        COALESCE(
          SUM(
            CASE
              WHEN jl.unit_usaha_id = $2::uuid
                AND (
                  a.kode LIKE '1.1.01.%'
                  OR a.kode LIKE '1.1.02.%'
                )
                THEN jl.debit
              ELSE 0
            END
          ),
          0
        )::text AS cash_debit,
        COALESCE(
          SUM(
            CASE
              WHEN jl.unit_usaha_id = $2::uuid
                AND (
                  a.kode LIKE '1.1.01.%'
                  OR a.kode LIKE '1.1.02.%'
                )
                THEN jl.kredit
              ELSE 0
            END
          ),
          0
        )::text AS cash_credit,
        COUNT(*) FILTER (
          WHERE jl.unit_usaha_id = $2::uuid
            AND NOT (
              a.kode LIKE '1.1.01.%'
              OR a.kode LIKE '1.1.02.%'
            )
        )::integer AS noncash_line_count,
        COUNT(*) FILTER (
          WHERE jl.unit_usaha_id IS DISTINCT FROM $2::uuid
            AND (
              a.kode LIKE '1.1.01.%'
              OR a.kode LIKE '1.1.02.%'
            )
        )::integer AS other_unit_cash_line_count,
        ARRAY_AGG(DISTINCT a.kode ORDER BY a.kode) FILTER (
          WHERE jl.unit_usaha_id = $2::uuid
            AND NOT (
              a.kode LIKE '1.1.01.%'
              OR a.kode LIKE '1.1.02.%'
            )
        ) AS counterpart_codes,
        STRING_AGG(
          DISTINCT a.kode || ' ' || a.nama,
          ', '
          ORDER BY a.kode || ' ' || a.nama
        ) FILTER (
          WHERE jl.unit_usaha_id = $2::uuid
            AND NOT (
              a.kode LIKE '1.1.01.%'
              OR a.kode LIKE '1.1.02.%'
            )
        ) AS counterpart_accounts,
        STRING_AGG(
          DISTINCT line_unit.kode || ' ' || line_unit.nama,
          ', '
          ORDER BY line_unit.kode || ' ' || line_unit.nama
        ) FILTER (
          WHERE jl.unit_usaha_id IS DISTINCT FROM $2::uuid
            AND (
              a.kode LIKE '1.1.01.%'
              OR a.kode LIKE '1.1.02.%'
            )
            AND line_unit.id IS NOT NULL
        ) AS other_unit_names
      FROM journal_header jh
      JOIN journal_line jl
        ON jl.journal_header_id = jh.id
      JOIN akun a
        ON a.id = jl.akun_id
      LEFT JOIN unit_usaha line_unit
        ON line_unit.id = jl.unit_usaha_id
      LEFT JOIN template_transaksi tt
        ON tt.id = jh.template_transaksi_id
      WHERE jh.bum_desa_id = $1::uuid
        AND jh.status = 'POSTED'
        AND jh.tanggal BETWEEN $3::date AND $4::date
      GROUP BY
        jh.id,
        jh.nomor_jurnal,
        jh.tanggal,
        tt.kode,
        tt.business_event_code,
        jh.sumber,
        jh.keterangan
      HAVING
        SUM(
          CASE
            WHEN jl.unit_usaha_id = $2::uuid
              AND (
                a.kode LIKE '1.1.01.%'
                OR a.kode LIKE '1.1.02.%'
              )
              THEN jl.debit + jl.kredit
            ELSE 0
          END
        ) > 0
      ORDER BY
        jh.tanggal ASC,
        jh.nomor_jurnal ASC
    `,
    [context.bumDesaId, context.unitUsahaId, startDate, endDate]
  );

  const allLines: CashFlowLine[] = journalResult.rows.map((row) => {
    const cashDebit = toFiniteNumber(row.cash_debit);
    const cashCredit = toFiniteNumber(row.cash_credit);
    const netAmount = cashDebit - cashCredit;
    const classification = classifyCashJournal(row);

    return {
      journalId: row.journal_id,
      journalNumber: row.journal_number,
      journalDate: row.journal_date,
      templateCode: row.template_code,
      businessEvent: row.business_event ?? row.journal_source,
      description: row.description ?? "-",
      category: classification.category,
      activityName: classification.activityName,
      cashIn: netAmount > 0 ? netAmount.toString() : "0",
      cashOut: netAmount < 0 ? Math.abs(netAmount).toString() : "0",
      netAmount: netAmount.toString(),
      counterpartCodes: row.counterpart_codes ?? [],
      counterpartAccounts:
        row.counterpart_accounts ??
        row.other_unit_names ??
        "Antar-akun kas atau setara kas",
      classificationBasis: classification.basis,
    };
  });

  const operatingLines = allLines.filter(
    (line) => line.category === "OPERATING"
  );
  const investingLines = allLines.filter(
    (line) => line.category === "INVESTING"
  );
  const financingLines = allLines.filter(
    (line) => line.category === "FINANCING"
  );
  const internalTransferLines = allLines.filter(
    (line) => line.category === "INTERNAL_TRANSFER"
  );
  const unclassifiedLines = allLines.filter(
    (line) => line.category === "UNCLASSIFIED"
  );

  const sections = [
    buildSection("OPERATING", operatingLines),
    buildSection("INVESTING", investingLines),
    buildSection("FINANCING", financingLines),
  ];

  const operatingCashFlow =
    sections.find((section) => section.key === "OPERATING")?.netCashFlow ?? "0";
  const investingCashFlow =
    sections.find((section) => section.key === "INVESTING")?.netCashFlow ?? "0";
  const financingCashFlow =
    sections.find((section) => section.key === "FINANCING")?.netCashFlow ?? "0";

  const classifiedLines = [
    ...operatingLines,
    ...investingLines,
    ...financingLines,
    ...unclassifiedLines,
  ];

  const totalCashIn = sumCurrency(
    classifiedLines.map((line) => line.cashIn)
  );
  const totalCashOut = sumCurrency(
    classifiedLines.map((line) => line.cashOut)
  );
  const netCashFlow = (
    toFiniteNumber(totalCashIn) - toFiniteNumber(totalCashOut)
  ).toString();

  const openingCashBalance =
    balanceResult.rows[0]?.opening_cash_balance ?? "0";
  const endingCashBalance =
    balanceResult.rows[0]?.ending_cash_balance ?? "0";

  const calculatedEndingCashBalance = (
    toFiniteNumber(openingCashBalance) + toFiniteNumber(netCashFlow)
  ).toString();

  const reconciliationDifference = (
    toFiniteNumber(endingCashBalance) -
    toFiniteNumber(calculatedEndingCashBalance)
  ).toString();

  const officialRows = buildOfficialRows(
    operatingLines,
    investingLines,
    financingLines,
    openingCashBalance,
    endingCashBalance
  );

  return {
    periods,
    selectedPeriod,
    startDate,
    endDate,
    showInternalTransfers,
    officialRows,
    sections,
    internalTransferLines: showInternalTransfers
      ? internalTransferLines
      : [],
    unclassifiedLines,
    openingCashBalance,
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
    totalCashIn,
    totalCashOut,
    netCashFlow,
    calculatedEndingCashBalance,
    endingCashBalance,
    reconciliationDifference,
    isReconciled: Math.abs(toFiniteNumber(reconciliationDifference)) < 0.005,
    visibleTransactionCount: classifiedLines.length,
    internalTransferCount: internalTransferLines.length,
    unclassifiedCount: unclassifiedLines.length,
  };
}
