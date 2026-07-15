import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Filter,
  RefreshCcw,
  RotateCcw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnitContextBlocker } from "@/components/unit/unit-context-blocker";
import {
  getCashFlowReportData,
  type CashFlowLine,
  type CashFlowOfficialRow,
} from "@/lib/unit/get-cash-flow-report-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type CashFlowPageProps = {
  searchParams: Promise<{
    periodId?: string;
    startDate?: string;
    endDate?: string;
    showInternalTransfers?: string;
  }>;
};

const cashFlowPageStyles = {
  content: "mt-6 w-full min-w-0 space-y-6",
  topBar:
    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
  backLink:
    "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950",
  backIcon: "h-4 w-4",
  actionGroup: "flex flex-col gap-2 sm:flex-row sm:items-center",
  secondaryAction:
    "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50",
  summaryGrid: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
  summaryBox: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
  summaryLabel: "text-xs font-medium uppercase tracking-wide text-slate-500",
  summaryValue: "mt-2 break-words text-xl font-semibold text-slate-950",
  positiveValue: "mt-2 break-words text-xl font-semibold text-emerald-700",
  negativeValue: "mt-2 break-words text-xl font-semibold text-rose-700",
  summaryHelp: "mt-1 text-sm leading-6 text-slate-500",
  filterGrid:
    "grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_260px]",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  select:
    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50",
  helperText: "text-xs leading-5 text-slate-500",
  formActions:
    "flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end",
  resultBox:
    "flex flex-col gap-3 rounded-xl border p-4 text-sm leading-6 sm:flex-row sm:items-start sm:justify-between",
  reconciledBox: "border-emerald-200 bg-emerald-50 text-emerald-900",
  unreconciledBox: "border-rose-200 bg-rose-50 text-rose-900",
  resultTitle: "flex items-center gap-2 font-semibold",
  resultIcon: "h-4 w-4",
  formulaCard: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
  formulaRow:
    "flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-b-0",
  formulaLabel: "text-slate-600",
  formulaValue: "text-right font-semibold text-slate-950",
  sectionStack: "space-y-6",
  sectionDescription: "text-sm leading-6 text-slate-500",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto lg:overflow-x-visible",
  table: "min-w-[1120px] w-full divide-y divide-slate-200 text-sm lg:min-w-0 lg:table-fixed",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableHeadCellRight:
    "px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "break-words px-3 py-3 align-top text-slate-700",
  tableCellStrong:
    "px-3 py-3 align-top font-semibold text-slate-950",
  tableCellRight:
    "whitespace-nowrap px-3 py-3 align-top text-right text-slate-700",
  tableCellRightStrong:
    "whitespace-nowrap px-3 py-3 align-top text-right font-semibold text-slate-950",
  tableFooter: "border-t border-slate-200 bg-slate-50",
  positiveText: "text-emerald-700",
  negativeText: "text-rose-700",
  badge:
    "inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600",
  warningBox:
    "rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900",
  transferBox:
    "rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900",
  emptyState:
    "rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center",
  emptyIcon:
    "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600",
  emptyTitle: "mt-4 text-base font-semibold text-slate-950",
  emptyDescription: "mt-2 text-sm leading-6 text-slate-600",
};

function formatCurrency(value: string | number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function formatOfficialCurrency(
  value: string | number,
  forceParentheses = false
) {
  const numberValue = Number(value);

  if (
    !Number.isFinite(numberValue) ||
    Math.abs(numberValue) < 0.005
  ) {
    return "Rp -";
  }

  const formattedValue = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.abs(numberValue));

  if (numberValue < 0 || forceParentheses) {
    return `Rp(${formattedValue})`;
  }

  return `Rp${formattedValue}`;
}

function formatLongDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function CashFlowTable({
  lines,
  totalCashIn,
  totalCashOut,
  netCashFlow,
  totalLabel,
}: {
  lines: CashFlowLine[];
  totalCashIn: string;
  totalCashOut: string;
  netCashFlow: string;
  totalLabel: string;
}) {
  return (
    <div className={cashFlowPageStyles.tableWrapper}>
      <div className={cashFlowPageStyles.tableScroll}>
        <table className={cashFlowPageStyles.table}>
          <thead className={cashFlowPageStyles.tableHead}>
            <tr>
              <th className={cashFlowPageStyles.tableHeadCell}>Tanggal</th>
              <th className={cashFlowPageStyles.tableHeadCell}>Nomor Jurnal</th>
              <th className={cashFlowPageStyles.tableHeadCell}>Aktivitas</th>
              <th className={cashFlowPageStyles.tableHeadCell}>Keterangan</th>
              <th className={cashFlowPageStyles.tableHeadCell}>Akun Lawan</th>
              <th className={cashFlowPageStyles.tableHeadCellRight}>
                Kas Masuk
              </th>
              <th className={cashFlowPageStyles.tableHeadCellRight}>
                Kas Keluar
              </th>
              <th className={cashFlowPageStyles.tableHeadCellRight}>Bersih</th>
            </tr>
          </thead>
          <tbody className={cashFlowPageStyles.tableBody}>
            {lines.map((line) => (
              <tr key={line.journalId}>
                <td className={cashFlowPageStyles.tableCellStrong}>
                  {formatDate(line.journalDate)}
                </td>
                <td className={cashFlowPageStyles.tableCell}>
                  <div className="break-all font-medium text-slate-950">
                    {line.journalNumber}
                  </div>
                  <div className="mt-1">
                    <span className={cashFlowPageStyles.badge}>
                      {line.templateCode ?? line.businessEvent}
                    </span>
                  </div>
                </td>
                <td className={cashFlowPageStyles.tableCell}>
                  <div className="break-all font-medium text-slate-950">
                    {line.activityName}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {line.classificationBasis}
                  </p>
                </td>
                <td className={cashFlowPageStyles.tableCell}>
                  {line.description}
                </td>
                <td className={cashFlowPageStyles.tableCell}>
                  {line.counterpartAccounts}
                </td>
                <td className={cashFlowPageStyles.tableCellRight}>
                  {formatCurrency(line.cashIn)}
                </td>
                <td className={cashFlowPageStyles.tableCellRight}>
                  {formatCurrency(line.cashOut)}
                </td>
                <td
                  className={[
                    cashFlowPageStyles.tableCellRightStrong,
                    Number(line.netAmount) >= 0
                      ? cashFlowPageStyles.positiveText
                      : cashFlowPageStyles.negativeText,
                  ].join(" ")}
                >
                  {formatCurrency(line.netAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className={cashFlowPageStyles.tableFooter}>
            <tr>
              <td
                className={cashFlowPageStyles.tableCellStrong}
                colSpan={5}
              >
                {totalLabel}
              </td>
              <td className={cashFlowPageStyles.tableCellRightStrong}>
                {formatCurrency(totalCashIn)}
              </td>
              <td className={cashFlowPageStyles.tableCellRightStrong}>
                {formatCurrency(totalCashOut)}
              </td>
              <td
                className={[
                  cashFlowPageStyles.tableCellRightStrong,
                  Number(netCashFlow) >= 0
                    ? cashFlowPageStyles.positiveText
                    : cashFlowPageStyles.negativeText,
                ].join(" ")}
              >
                {formatCurrency(netCashFlow)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function isOfficialOutflowRow(row: CashFlowOfficialRow) {
  const description = row.description.toLowerCase();

  return (
    description.includes("pengeluaran kas") ||
    description.includes("pembayaran") ||
    description.includes("jumlah arus kas keluar")
  );
}

function getOfficialRowClass(row: CashFlowOfficialRow) {
  if (row.rowType === "SECTION") {
    return "bg-slate-100 font-bold text-slate-950";
  }

  if (row.rowType === "SUBSECTION") {
    return "bg-slate-50 font-semibold text-slate-900";
  }

  if (row.rowType === "TOTAL") {
    return "border-t border-slate-300 font-semibold text-slate-950";
  }

  if (row.rowType === "NET") {
    return "border-y border-slate-300 bg-slate-50 font-bold text-slate-950";
  }

  if (row.rowType === "SUMMARY") {
    return "border-t border-slate-300 font-bold text-slate-950";
  }

  return "text-slate-700";
}

function OfficialCashFlowTable({
  rows,
  bumDesaName,
  unitUsahaName,
  endDate,
}: {
  rows: CashFlowOfficialRow[];
  bumDesaName: string;
  unitUsahaName: string;
  endDate: string;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b border-slate-200 px-4 py-7 text-center sm:px-8">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-950">
            {bumDesaName}
          </p>
          <p className="mt-1 text-sm font-medium uppercase text-slate-600">
            {unitUsahaName}
          </p>
          <h2 className="mt-5 text-xl font-bold uppercase tracking-wide text-slate-950">
            Laporan Arus Kas
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Untuk periode yang berakhir pada tanggal{" "}
            {endDate ? formatLongDate(endDate) : "-"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Metode langsung · Format penyajian Kepmendesa 136 Tahun 2022
          </p>
        </div>

        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-14 sm:w-20" />
              <col />
              <col className="w-32 sm:w-48" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-300 bg-slate-50">
                <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600 sm:px-4">
                  No.
                </th>
                <th className="px-2 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 sm:px-4">
                  Uraian
                </th>
                <th className="px-2 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600 sm:px-4">
                  Jumlah (Rp)
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.number}-${row.description}`}
                  className={[
                    "border-b border-slate-100 last:border-b-0",
                    getOfficialRowClass(row),
                  ].join(" ")}
                >
                  <td className="px-2 py-2.5 text-center align-top sm:px-4">
                    {row.number}
                  </td>

                  <td
                    className={[
                      "break-words px-2 py-2.5 align-top leading-6 sm:px-4",
                      row.rowType === "DETAIL" ? "pl-5 sm:pl-8" : "",
                    ].join(" ")}
                  >
                    <span>{row.description}</span>

                    {row.isSupplemental && row.note ? (
                      <span className="mt-1 block text-xs font-normal leading-5 text-amber-700">
                        {row.note}
                      </span>
                    ) : null}
                  </td>

                  <td className="whitespace-nowrap px-2 py-2.5 text-right align-top tabular-nums sm:px-4">
                    {row.amount === null
                      ? ""
                      : formatOfficialCurrency(
                          row.amount,
                          isOfficialOutflowRow(row)
                        )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500 sm:px-8">
          Pos tambahan bertanda keterangan merupakan kebutuhan laporan unit dan
          dieliminasi dalam laporan gabungan BUM Desa apabila berasal dari
          transaksi antarunit.
        </div>
      </CardContent>
    </Card>
  );
}

export default async function CashFlowPage({
  searchParams,
}: CashFlowPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Laporan Arus Kas Tidak Tersedia"
        description="Laporan Arus Kas unit hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  const report = await getCashFlowReportData(context, {
    periodId: params.periodId,
    startDate: params.startDate,
    endDate: params.endDate,
    showInternalTransfers: params.showInternalTransfers === "true",
  });

  const hasClassifiedLines = report.sections.some(
    (section) => section.lines.length > 0
  );
  const netCashFlowNumber = Number(report.netCashFlow);

  return (
    <PageContainer>
      <div className={cashFlowPageStyles.topBar}>
        <Link
          href="/unit/dashboard/laporan"
          className={cashFlowPageStyles.backLink}
        >
          <ArrowLeft className={cashFlowPageStyles.backIcon} />
          Kembali ke Laporan Unit
        </Link>

        <div className={cashFlowPageStyles.actionGroup}>
          <Link
            href="/unit/dashboard/laporan/laba-rugi"
            className={cashFlowPageStyles.secondaryAction}
          >
            Laba Rugi
          </Link>
          <Link
            href="/unit/dashboard/laporan/neraca"
            className={cashFlowPageStyles.secondaryAction}
          >
            Neraca
          </Link>
        </div>
      </div>

      <PageHeader
        title="Laporan Arus Kas"
        description="Menyajikan penerimaan dan pengeluaran kas berdasarkan aktivitas operasi, investasi, dan pendanaan dengan metode langsung."
      />

      <div className={cashFlowPageStyles.content}>
        <div className={cashFlowPageStyles.summaryGrid}>
          <div className={cashFlowPageStyles.summaryBox}>
            <p className={cashFlowPageStyles.summaryLabel}>Saldo Kas Awal</p>
            <p className={cashFlowPageStyles.summaryValue}>
              {formatCurrency(report.openingCashBalance)}
            </p>
            <p className={cashFlowPageStyles.summaryHelp}>
              Saldo kas dan setara kas sebelum tanggal awal laporan.
            </p>
          </div>

          <div className={cashFlowPageStyles.summaryBox}>
            <p className={cashFlowPageStyles.summaryLabel}>Total Kas Masuk</p>
            <p className={cashFlowPageStyles.positiveValue}>
              {formatCurrency(report.totalCashIn)}
            </p>
            <p className={cashFlowPageStyles.summaryHelp}>
              Penerimaan kas eksternal selama periode laporan.
            </p>
          </div>

          <div className={cashFlowPageStyles.summaryBox}>
            <p className={cashFlowPageStyles.summaryLabel}>Total Kas Keluar</p>
            <p className={cashFlowPageStyles.negativeValue}>
              {formatCurrency(report.totalCashOut)}
            </p>
            <p className={cashFlowPageStyles.summaryHelp}>
              Pengeluaran kas eksternal selama periode laporan.
            </p>
          </div>

          <div className={cashFlowPageStyles.summaryBox}>
            <p className={cashFlowPageStyles.summaryLabel}>Saldo Kas Akhir</p>
            <p
              className={
                Number(report.endingCashBalance) >= 0
                  ? cashFlowPageStyles.positiveValue
                  : cashFlowPageStyles.negativeValue
              }
            >
              {formatCurrency(report.endingCashBalance)}
            </p>
            <p className={cashFlowPageStyles.summaryHelp}>
              Saldo aktual kas dan setara kas pada tanggal akhir.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Laporan Arus Kas</CardTitle>
            <p className="text-sm leading-6 text-slate-500">
              Pilih periode, rentang tanggal, dan apakah transfer internal kas
              perlu ditampilkan.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <div className={cashFlowPageStyles.filterGrid}>
                <div className={cashFlowPageStyles.fieldGroup}>
                  <Label
                    htmlFor="periodId"
                    className={cashFlowPageStyles.label}
                  >
                    Periode Akuntansi
                  </Label>
                  <select
                    id="periodId"
                    name="periodId"
                    className={cashFlowPageStyles.select}
                    defaultValue={report.selectedPeriod?.id ?? ""}
                  >
                    {report.periods.length > 0 ? (
                      report.periods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {period.nama} ({period.status})
                        </option>
                      ))
                    ) : (
                      <option value="">Belum ada periode</option>
                    )}
                  </select>
                  <p className={cashFlowPageStyles.helperText}>
                    Default memakai periode akuntansi yang masih terbuka.
                  </p>
                </div>

                <div className={cashFlowPageStyles.fieldGroup}>
                  <Label
                    htmlFor="startDate"
                    className={cashFlowPageStyles.label}
                  >
                    Tanggal Awal
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={report.startDate}
                  />
                  <p className={cashFlowPageStyles.helperText}>
                    Menentukan saldo awal dan awal transaksi.
                  </p>
                </div>

                <div className={cashFlowPageStyles.fieldGroup}>
                  <Label
                    htmlFor="endDate"
                    className={cashFlowPageStyles.label}
                  >
                    Tanggal Akhir
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={report.endDate}
                  />
                  <p className={cashFlowPageStyles.helperText}>
                    Menentukan akhir periode laporan.
                  </p>
                </div>

                <div className={cashFlowPageStyles.fieldGroup}>
                  <Label
                    htmlFor="showInternalTransfers"
                    className={cashFlowPageStyles.label}
                  >
                    Transfer Internal
                  </Label>
                  <select
                    id="showInternalTransfers"
                    name="showInternalTransfers"
                    className={cashFlowPageStyles.select}
                    defaultValue={
                      report.showInternalTransfers ? "true" : "false"
                    }
                  >
                    <option value="false">Sembunyikan rinciannya</option>
                    <option value="true">Tampilkan rinciannya</option>
                  </select>
                  <p className={cashFlowPageStyles.helperText}>
                    Transfer antar-kas tidak mengubah arus kas bersih.
                  </p>
                </div>
              </div>

              <div className={cashFlowPageStyles.formActions}>
                <Link
                  href="/unit/dashboard/laporan/arus-kas"
                  className={cashFlowPageStyles.secondaryAction}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filter
                </Link>
                <Button type="submit">
                  <Filter className="mr-2 h-4 w-4" />
                  Terapkan Filter
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <OfficialCashFlowTable
          rows={report.officialRows}
          bumDesaName={context.bumDesaName}
          unitUsahaName={context.unitUsahaName}
          endDate={report.endDate}
        />

        <div
          className={[
            cashFlowPageStyles.resultBox,
            report.isReconciled
              ? cashFlowPageStyles.reconciledBox
              : cashFlowPageStyles.unreconciledBox,
          ].join(" ")}
        >
          <div>
            <p className={cashFlowPageStyles.resultTitle}>
              {report.isReconciled ? (
                <CheckCircle2 className={cashFlowPageStyles.resultIcon} />
              ) : (
                <AlertTriangle className={cashFlowPageStyles.resultIcon} />
              )}
              {report.isReconciled
                ? "Saldo kas berhasil direkonsiliasi"
                : "Terdapat selisih rekonsiliasi kas"}
            </p>
            <p className="mt-1">
              Periode{" "}
              {report.startDate ? formatDate(report.startDate) : "-"} sampai{" "}
              {report.endDate ? formatDate(report.endDate) : "-"} memuat{" "}
              {report.visibleTransactionCount} transaksi arus kas. Transfer
              internal terdeteksi sebanyak {report.internalTransferCount} jurnal.
            </p>
          </div>
          <div className="font-semibold">
            Selisih {formatCurrency(report.reconciliationDifference)}
          </div>
        </div>

        <div className={cashFlowPageStyles.formulaCard}>
          <h2 className="text-base font-semibold text-slate-950">
            Rekonsiliasi Saldo Kas
          </h2>
          <div className="mt-3">
            <div className={cashFlowPageStyles.formulaRow}>
              <span className={cashFlowPageStyles.formulaLabel}>
                Saldo Kas Awal
              </span>
              <span className={cashFlowPageStyles.formulaValue}>
                {formatCurrency(report.openingCashBalance)}
              </span>
            </div>
            <div className={cashFlowPageStyles.formulaRow}>
              <span className={cashFlowPageStyles.formulaLabel}>
                Arus Kas Bersih Aktivitas Operasi
              </span>
              <span className={cashFlowPageStyles.formulaValue}>
                {formatCurrency(report.operatingCashFlow)}
              </span>
            </div>
            <div className={cashFlowPageStyles.formulaRow}>
              <span className={cashFlowPageStyles.formulaLabel}>
                Arus Kas Bersih Aktivitas Investasi
              </span>
              <span className={cashFlowPageStyles.formulaValue}>
                {formatCurrency(report.investingCashFlow)}
              </span>
            </div>
            <div className={cashFlowPageStyles.formulaRow}>
              <span className={cashFlowPageStyles.formulaLabel}>
                Arus Kas Bersih Aktivitas Pendanaan
              </span>
              <span className={cashFlowPageStyles.formulaValue}>
                {formatCurrency(report.financingCashFlow)}
              </span>
            </div>
            <div className={cashFlowPageStyles.formulaRow}>
              <span className={cashFlowPageStyles.formulaLabel}>
                Kenaikan/Penurunan Bersih Kas
              </span>
              <span
                className={[
                  cashFlowPageStyles.formulaValue,
                  netCashFlowNumber >= 0
                    ? cashFlowPageStyles.positiveText
                    : cashFlowPageStyles.negativeText,
                ].join(" ")}
              >
                {formatCurrency(report.netCashFlow)}
              </span>
            </div>
            <div className={cashFlowPageStyles.formulaRow}>
              <span className={cashFlowPageStyles.formulaLabel}>
                Saldo Kas Akhir Hasil Perhitungan
              </span>
              <span className={cashFlowPageStyles.formulaValue}>
                {formatCurrency(report.calculatedEndingCashBalance)}
              </span>
            </div>
            <div className={cashFlowPageStyles.formulaRow}>
              <span className="font-semibold text-slate-950">
                Saldo Kas Akhir Aktual
              </span>
              <span className={cashFlowPageStyles.formulaValue}>
                {formatCurrency(report.endingCashBalance)}
              </span>
            </div>
          </div>
        </div>

        {report.unclassifiedCount > 0 ? (
          <div className={cashFlowPageStyles.warningBox}>
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              {report.unclassifiedCount} transaksi belum terklasifikasi
            </p>
            <p className="mt-1">
              Transaksi tetap dimasukkan dalam rekonsiliasi kas, tetapi perlu
              diperiksa agar aktivitas operasi, investasi, atau pendanaannya
              dapat ditetapkan secara tepat.
            </p>
          </div>
        ) : null}

        {hasClassifiedLines ? (
          <div className={cashFlowPageStyles.sectionStack}>
            {report.sections.map((section) => (
              <Card key={section.key}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  <p className={cashFlowPageStyles.sectionDescription}>
                    {section.description}
                  </p>
                </CardHeader>
                <CardContent>
                  {section.lines.length > 0 ? (
                    <CashFlowTable
                      lines={section.lines}
                      totalCashIn={section.totalCashIn}
                      totalCashOut={section.totalCashOut}
                      netCashFlow={section.netCashFlow}
                      totalLabel={`Total ${section.title}`}
                    />
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-500">
                      Tidak ada transaksi pada aktivitas ini untuk periode yang
                      dipilih.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className={cashFlowPageStyles.emptyState}>
            <div className={cashFlowPageStyles.emptyIcon}>
              <FileText className="h-6 w-6" />
            </div>
            <h2 className={cashFlowPageStyles.emptyTitle}>
              Belum ada transaksi arus kas
            </h2>
            <p className={cashFlowPageStyles.emptyDescription}>
              Belum ada jurnal posted yang memengaruhi kas atau setara kas
              selama periode yang dipilih.
            </p>
          </div>
        )}

        {report.unclassifiedLines.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Transaksi Belum Terklasifikasi</CardTitle>
              <p className={cashFlowPageStyles.sectionDescription}>
                Daftar ini perlu diperiksa sebelum laporan dijadikan laporan
                keuangan final.
              </p>
            </CardHeader>
            <CardContent>
              <CashFlowTable
                lines={report.unclassifiedLines}
                totalCashIn={report.unclassifiedLines
                  .reduce((total, line) => total + Number(line.cashIn), 0)
                  .toString()}
                totalCashOut={report.unclassifiedLines
                  .reduce((total, line) => total + Number(line.cashOut), 0)
                  .toString()}
                netCashFlow={report.unclassifiedLines
                  .reduce((total, line) => total + Number(line.netAmount), 0)
                  .toString()}
                totalLabel="Total Belum Terklasifikasi"
              />
            </CardContent>
          </Card>
        ) : null}

        {report.internalTransferCount > 0 ? (
          <div className={cashFlowPageStyles.transferBox}>
            <p className="flex items-center gap-2 font-semibold">
              <RefreshCcw className="h-4 w-4" />
              Transfer internal kas terdeteksi
            </p>
            <p className="mt-1">
              Terdapat {report.internalTransferCount} jurnal pemindahan dana
              antar-akun kas atau setara kas. Transaksi ini tidak dimasukkan ke
              aktivitas operasi, investasi, atau pendanaan.
            </p>
          </div>
        ) : null}

        {report.showInternalTransfers &&
        report.internalTransferLines.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Rincian Transfer Internal Kas</CardTitle>
              <p className={cashFlowPageStyles.sectionDescription}>
                Ditampilkan untuk transparansi, tetapi tidak memengaruhi
                kenaikan atau penurunan bersih kas.
              </p>
            </CardHeader>
            <CardContent>
              <CashFlowTable
                lines={report.internalTransferLines}
                totalCashIn="0"
                totalCashOut="0"
                netCashFlow="0"
                totalLabel="Dampak Bersih Transfer Internal"
              />
            </CardContent>
          </Card>
        ) : null}

        <div
          className={[
            cashFlowPageStyles.resultBox,
            netCashFlowNumber >= 0
              ? cashFlowPageStyles.reconciledBox
              : cashFlowPageStyles.unreconciledBox,
          ].join(" ")}
        >
          <div>
            <p className={cashFlowPageStyles.resultTitle}>
              {netCashFlowNumber >= 0 ? (
                <TrendingUp className={cashFlowPageStyles.resultIcon} />
              ) : (
                <TrendingDown className={cashFlowPageStyles.resultIcon} />
              )}
              {netCashFlowNumber > 0
                ? "Kas bersih meningkat selama periode"
                : netCashFlowNumber < 0
                  ? "Kas bersih menurun selama periode"
                  : "Kas bersih tidak berubah selama periode"}
            </p>
            <p className="mt-1">
              Hasil ini berasal dari seluruh transaksi eksternal yang
              memengaruhi kas dan setara kas.
            </p>
          </div>
          <div className="font-semibold">
            {formatCurrency(report.netCashFlow)}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
