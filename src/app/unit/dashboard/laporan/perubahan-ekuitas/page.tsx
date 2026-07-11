import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Filter,
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
import { getEquityChangesReportData } from "@/lib/unit/get-equity-changes-report-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type EquityChangesPageProps = {
  searchParams: Promise<{
    periodId?: string;
    startDate?: string;
    endDate?: string;
    showZeroAccounts?: string;
  }>;
};

const equityChangesPageStyles = {
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
  summaryHelp: "mt-1 text-sm leading-6 text-slate-500",
  increaseValue: "mt-2 break-words text-xl font-semibold text-emerald-700",
  decreaseValue: "mt-2 break-words text-xl font-semibold text-rose-700",
  filterGrid:
    "grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_260px]",
  formActions:
    "flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  select:
    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50",
  helperText: "text-xs leading-5 text-slate-500",
  resultBox:
    "flex flex-col gap-3 rounded-xl border p-4 text-sm leading-6 sm:flex-row sm:items-start sm:justify-between",
  increaseBox: "border-emerald-200 bg-emerald-50 text-emerald-900",
  decreaseBox: "border-rose-200 bg-rose-50 text-rose-900",
  resultTitle: "flex items-center gap-2 font-semibold",
  resultIcon: "h-4 w-4",
  formulaCard: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
  formulaRow:
    "flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-b-0",
  formulaLabel: "text-slate-600",
  formulaValue: "text-right font-semibold text-slate-950",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto",
  table: "min-w-[1040px] w-full divide-y divide-slate-200 text-sm",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableHeadCellRight:
    "whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "px-4 py-3 align-top text-slate-700",
  tableCellStrong:
    "whitespace-nowrap px-4 py-3 align-top font-semibold text-slate-950",
  tableCellRight:
    "whitespace-nowrap px-4 py-3 align-top text-right text-slate-700",
  tableCellRightStrong:
    "whitespace-nowrap px-4 py-3 align-top text-right font-semibold text-slate-950",
  syntheticRow: "bg-blue-50/60",
  syntheticBadge:
    "mt-1 inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700",
  tableFooter: "border-t border-slate-200 bg-slate-50",
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

export default async function EquityChangesPage({
  searchParams,
}: EquityChangesPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Laporan Perubahan Ekuitas Tidak Tersedia"
        description="Laporan Perubahan Ekuitas unit hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  const report = await getEquityChangesReportData(context, {
    periodId: params.periodId,
    startDate: params.startDate,
    endDate: params.endDate,
    showZeroAccounts: params.showZeroAccounts === "true",
  });

  const netChangeNumber = Number(report.netEquityChange);
  const isEquityIncreasing = netChangeNumber >= 0;
  const hasLines = report.lines.length > 0;

  return (
    <PageContainer>
      <div className={equityChangesPageStyles.topBar}>
        <Link
          href="/unit/dashboard/laporan"
          className={equityChangesPageStyles.backLink}
        >
          <ArrowLeft className={equityChangesPageStyles.backIcon} />
          Kembali ke Laporan Unit
        </Link>

        <div className={equityChangesPageStyles.actionGroup}>
          <Link
            href="/unit/dashboard/laporan/laba-rugi"
            className={equityChangesPageStyles.secondaryAction}
          >
            Laba Rugi
          </Link>
          <Link
            href="/unit/dashboard/laporan/neraca"
            className={equityChangesPageStyles.secondaryAction}
          >
            Neraca
          </Link>
        </div>
      </div>

      <PageHeader
        title="Laporan Perubahan Ekuitas"
        description="Menyajikan saldo awal, penambahan, pengurangan, surplus atau defisit periode berjalan, dan saldo akhir ekuitas unit usaha."
      />

      <div className={equityChangesPageStyles.content}>
        <div className={equityChangesPageStyles.summaryGrid}>
          <div className={equityChangesPageStyles.summaryBox}>
            <p className={equityChangesPageStyles.summaryLabel}>
              Ekuitas Awal
            </p>
            <p className={equityChangesPageStyles.summaryValue}>
              {formatCurrency(report.openingEquity)}
            </p>
            <p className={equityChangesPageStyles.summaryHelp}>
              Saldo akun ekuitas sebelum tanggal awal laporan.
            </p>
          </div>

          <div className={equityChangesPageStyles.summaryBox}>
            <p className={equityChangesPageStyles.summaryLabel}>
              Penambahan Ekuitas
            </p>
            <p className={equityChangesPageStyles.increaseValue}>
              {formatCurrency(report.equityAdditions)}
            </p>
            <p className={equityChangesPageStyles.summaryHelp}>
              Kredit akun ekuitas dan surplus periode berjalan.
            </p>
          </div>

          <div className={equityChangesPageStyles.summaryBox}>
            <p className={equityChangesPageStyles.summaryLabel}>
              Pengurangan Ekuitas
            </p>
            <p className={equityChangesPageStyles.decreaseValue}>
              {formatCurrency(report.equityReductions)}
            </p>
            <p className={equityChangesPageStyles.summaryHelp}>
              Debit akun ekuitas dan defisit periode berjalan.
            </p>
          </div>

          <div className={equityChangesPageStyles.summaryBox}>
            <p className={equityChangesPageStyles.summaryLabel}>
              Ekuitas Akhir
            </p>
            <p
              className={
                Number(report.endingEquity) >= 0
                  ? equityChangesPageStyles.increaseValue
                  : equityChangesPageStyles.decreaseValue
              }
            >
              {formatCurrency(report.endingEquity)}
            </p>
            <p className={equityChangesPageStyles.summaryHelp}>
              Ekuitas awal ditambah perubahan bersih periode.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Laporan Perubahan Ekuitas</CardTitle>
            <p className="text-sm leading-6 text-slate-500">
              Pilih periode, rentang tanggal, dan cakupan akun untuk menyusun
              perubahan ekuitas.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <div className={equityChangesPageStyles.filterGrid}>
                <div className={equityChangesPageStyles.fieldGroup}>
                  <Label
                    htmlFor="periodId"
                    className={equityChangesPageStyles.label}
                  >
                    Periode Akuntansi
                  </Label>
                  <select
                    id="periodId"
                    name="periodId"
                    className={equityChangesPageStyles.select}
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
                  <p className={equityChangesPageStyles.helperText}>
                    Default memakai periode akuntansi yang masih terbuka.
                  </p>
                </div>

                <div className={equityChangesPageStyles.fieldGroup}>
                  <Label
                    htmlFor="startDate"
                    className={equityChangesPageStyles.label}
                  >
                    Tanggal Awal
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={report.startDate}
                  />
                  <p className={equityChangesPageStyles.helperText}>
                    Menentukan batas saldo awal dan awal mutasi.
                  </p>
                </div>

                <div className={equityChangesPageStyles.fieldGroup}>
                  <Label
                    htmlFor="endDate"
                    className={equityChangesPageStyles.label}
                  >
                    Tanggal Akhir
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={report.endDate}
                  />
                  <p className={equityChangesPageStyles.helperText}>
                    Menentukan akhir periode perubahan ekuitas.
                  </p>
                </div>

                <div className={equityChangesPageStyles.fieldGroup}>
                  <Label
                    htmlFor="showZeroAccounts"
                    className={equityChangesPageStyles.label}
                  >
                    Cakupan Akun
                  </Label>
                  <select
                    id="showZeroAccounts"
                    name="showZeroAccounts"
                    className={equityChangesPageStyles.select}
                    defaultValue={report.showZeroAccounts ? "true" : "false"}
                  >
                    <option value="false">Hanya akun yang bernilai</option>
                    <option value="true">Semua akun termasuk nilai nol</option>
                  </select>
                  <p className={equityChangesPageStyles.helperText}>
                    Akun Ikhtisar Laba Rugi tidak dihitung dua kali.
                  </p>
                </div>
              </div>

              <div className={equityChangesPageStyles.formActions}>
                <Link
                  href="/unit/dashboard/laporan/perubahan-ekuitas"
                  className={equityChangesPageStyles.secondaryAction}
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

        <div
          className={[
            equityChangesPageStyles.resultBox,
            isEquityIncreasing
              ? equityChangesPageStyles.increaseBox
              : equityChangesPageStyles.decreaseBox,
          ].join(" ")}
        >
          <div>
            <p className={equityChangesPageStyles.resultTitle}>
              {isEquityIncreasing ? (
                <TrendingUp className={equityChangesPageStyles.resultIcon} />
              ) : (
                <TrendingDown className={equityChangesPageStyles.resultIcon} />
              )}
              {netChangeNumber > 0
                ? "Ekuitas unit meningkat"
                : netChangeNumber < 0
                  ? "Ekuitas unit menurun"
                  : "Ekuitas unit tidak mengalami perubahan bersih"}
            </p>
            <p className="mt-1">
              Periode{" "}
              {report.startDate ? formatDate(report.startDate) : "-"} sampai{" "}
              {report.endDate ? formatDate(report.endDate) : "-"} menampilkan{" "}
              {report.visibleAccountCount} baris, dengan{" "}
              {report.nonZeroAccountCount} baris bernilai.
            </p>
          </div>
          <div className="font-semibold">
            {formatCurrency(report.netEquityChange)}
          </div>
        </div>

        <div className={equityChangesPageStyles.formulaCard}>
          <h2 className="text-base font-semibold text-slate-950">
            Rekonsiliasi Ekuitas
          </h2>
          <div className="mt-3">
            <div className={equityChangesPageStyles.formulaRow}>
              <span className={equityChangesPageStyles.formulaLabel}>
                Ekuitas Awal
              </span>
              <span className={equityChangesPageStyles.formulaValue}>
                {formatCurrency(report.openingEquity)}
              </span>
            </div>
            <div className={equityChangesPageStyles.formulaRow}>
              <span className={equityChangesPageStyles.formulaLabel}>
                Penambahan Ekuitas
              </span>
              <span className={equityChangesPageStyles.formulaValue}>
                {formatCurrency(report.equityAdditions)}
              </span>
            </div>
            <div className={equityChangesPageStyles.formulaRow}>
              <span className={equityChangesPageStyles.formulaLabel}>
                Pengurangan Ekuitas
              </span>
              <span className={equityChangesPageStyles.formulaValue}>
                ({formatCurrency(report.equityReductions)})
              </span>
            </div>
            <div className={equityChangesPageStyles.formulaRow}>
              <span className={equityChangesPageStyles.formulaLabel}>
                Surplus/Defisit Periode Berjalan
              </span>
              <span
                className={[
                  equityChangesPageStyles.formulaValue,
                  report.isProfit ? "text-emerald-700" : "text-rose-700",
                ].join(" ")}
              >
                {formatCurrency(report.currentPeriodProfit)}
              </span>
            </div>
            <div className={equityChangesPageStyles.formulaRow}>
              <span className={equityChangesPageStyles.formulaLabel}>
                Perubahan Bersih Ekuitas
              </span>
              <span
                className={[
                  equityChangesPageStyles.formulaValue,
                  isEquityIncreasing
                    ? "text-emerald-700"
                    : "text-rose-700",
                ].join(" ")}
              >
                {formatCurrency(report.netEquityChange)}
              </span>
            </div>
            <div className={equityChangesPageStyles.formulaRow}>
              <span className="font-semibold text-slate-950">
                Ekuitas Akhir
              </span>
              <span className={equityChangesPageStyles.formulaValue}>
                {formatCurrency(report.endingEquity)}
              </span>
            </div>
          </div>
        </div>

        {hasLines ? (
          <Card>
            <CardHeader>
              <CardTitle>Rincian Perubahan Ekuitas</CardTitle>
              <p className="text-sm leading-6 text-slate-500">
                Saldo awal berasal dari jurnal sebelum tanggal awal. Penambahan
                dan pengurangan berasal dari mutasi selama periode laporan.
              </p>
            </CardHeader>
            <CardContent>
              <div className={equityChangesPageStyles.tableWrapper}>
                <div className={equityChangesPageStyles.tableScroll}>
                  <table className={equityChangesPageStyles.table}>
                    <thead className={equityChangesPageStyles.tableHead}>
                      <tr>
                        <th className={equityChangesPageStyles.tableHeadCell}>
                          Kode Akun
                        </th>
                        <th className={equityChangesPageStyles.tableHeadCell}>
                          Nama Akun
                        </th>
                        <th
                          className={
                            equityChangesPageStyles.tableHeadCellRight
                          }
                        >
                          Saldo Awal
                        </th>
                        <th
                          className={
                            equityChangesPageStyles.tableHeadCellRight
                          }
                        >
                          Penambahan
                        </th>
                        <th
                          className={
                            equityChangesPageStyles.tableHeadCellRight
                          }
                        >
                          Pengurangan
                        </th>
                        <th
                          className={
                            equityChangesPageStyles.tableHeadCellRight
                          }
                        >
                          Saldo Akhir
                        </th>
                      </tr>
                    </thead>
                    <tbody className={equityChangesPageStyles.tableBody}>
                      {report.lines.map((line) => (
                        <tr
                          key={line.accountId}
                          className={
                            line.isSynthetic
                              ? equityChangesPageStyles.syntheticRow
                              : undefined
                          }
                        >
                          <td
                            className={equityChangesPageStyles.tableCellStrong}
                          >
                            {line.kode}
                          </td>
                          <td className={equityChangesPageStyles.tableCell}>
                            <div className="font-medium text-slate-950">
                              {line.nama}
                            </div>
                            {line.isSynthetic ? (
                              <span
                                className={
                                  equityChangesPageStyles.syntheticBadge
                                }
                              >
                                Hasil Laporan Laba Rugi
                              </span>
                            ) : null}
                          </td>
                          <td
                            className={equityChangesPageStyles.tableCellRight}
                          >
                            {formatCurrency(line.openingBalance)}
                          </td>
                          <td
                            className={equityChangesPageStyles.tableCellRight}
                          >
                            {formatCurrency(line.additions)}
                          </td>
                          <td
                            className={equityChangesPageStyles.tableCellRight}
                          >
                            {formatCurrency(line.reductions)}
                          </td>
                          <td
                            className={
                              equityChangesPageStyles.tableCellRightStrong
                            }
                          >
                            {formatCurrency(line.endingBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className={equityChangesPageStyles.tableFooter}>
                      <tr>
                        <td
                          className={equityChangesPageStyles.tableCellStrong}
                          colSpan={2}
                        >
                          Total Ekuitas
                        </td>
                        <td
                          className={
                            equityChangesPageStyles.tableCellRightStrong
                          }
                        >
                          {formatCurrency(report.openingEquity)}
                        </td>
                        <td
                          className={
                            equityChangesPageStyles.tableCellRightStrong
                          }
                        >
                          {formatCurrency(report.equityAdditions)}
                        </td>
                        <td
                          className={
                            equityChangesPageStyles.tableCellRightStrong
                          }
                        >
                          {formatCurrency(report.equityReductions)}
                        </td>
                        <td
                          className={
                            equityChangesPageStyles.tableCellRightStrong
                          }
                        >
                          {formatCurrency(report.endingEquity)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={equityChangesPageStyles.emptyState}>
            <div className={equityChangesPageStyles.emptyIcon}>
              <FileText className="h-6 w-6" />
            </div>
            <h2 className={equityChangesPageStyles.emptyTitle}>
              Belum ada data perubahan ekuitas
            </h2>
            <p className={equityChangesPageStyles.emptyDescription}>
              Belum ada saldo atau mutasi pada akun ekuitas serta belum ada
              surplus atau defisit untuk periode yang dipilih.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
