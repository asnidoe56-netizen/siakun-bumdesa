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
import { getIncomeStatementReportData } from "@/lib/unit/get-income-statement-report-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type IncomeStatementPageProps = {
  searchParams: Promise<{
    periodId?: string;
    startDate?: string;
    endDate?: string;
    showZeroAccounts?: string;
  }>;
};

const incomeStatementPageStyles = {
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
  profitValue: "mt-2 break-words text-xl font-semibold text-emerald-700",
  lossValue: "mt-2 break-words text-xl font-semibold text-rose-700",
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
  profitBox: "border-emerald-200 bg-emerald-50 text-emerald-900",
  lossBox: "border-rose-200 bg-rose-50 text-rose-900",
  resultTitle: "flex items-center gap-2 font-semibold",
  resultIcon: "h-4 w-4",
  sectionGrid: "grid gap-6 xl:grid-cols-2",
  sectionDescription: "text-sm leading-6 text-slate-500",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto",
  table: "min-w-[680px] w-full divide-y divide-slate-200 text-sm",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableHeadCellRight:
    "whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "whitespace-nowrap px-4 py-3 align-top text-slate-700",
  tableCellStrong:
    "whitespace-nowrap px-4 py-3 align-top font-semibold text-slate-950",
  tableCellRight:
    "whitespace-nowrap px-4 py-3 align-top text-right text-slate-700",
  tableCellRightStrong:
    "whitespace-nowrap px-4 py-3 align-top text-right font-semibold text-slate-950",
  tableFooter: "border-t border-slate-200 bg-slate-50",
  badge:
    "inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600",
  formulaCard: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
  formulaRow:
    "flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-b-0",
  formulaLabel: "text-slate-600",
  formulaValue: "text-right font-semibold text-slate-950",
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

export default async function IncomeStatementPage({
  searchParams,
}: IncomeStatementPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Laporan Laba Rugi Tidak Tersedia"
        description="Laporan Laba Rugi unit hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  const report = await getIncomeStatementReportData(context, {
    periodId: params.periodId,
    startDate: params.startDate,
    endDate: params.endDate,
    showZeroAccounts: params.showZeroAccounts === "true",
  });

  const netProfitAmount = Math.abs(Number(report.netProfit));
  const hasLines = report.sections.some((section) => section.lines.length > 0);

  return (
    <PageContainer>
      <div className={incomeStatementPageStyles.topBar}>
        <Link
          href="/unit/dashboard/laporan"
          className={incomeStatementPageStyles.backLink}
        >
          <ArrowLeft className={incomeStatementPageStyles.backIcon} />
          Kembali ke Laporan Unit
        </Link>

        <div className={incomeStatementPageStyles.actionGroup}>
          <Link
            href="/unit/dashboard/laporan/neraca-saldo"
            className={incomeStatementPageStyles.secondaryAction}
          >
            Neraca Saldo
          </Link>
          <Link
            href="/unit/dashboard/laporan"
            className={incomeStatementPageStyles.secondaryAction}
          >
            Pusat Laporan
          </Link>
        </div>
      </div>

      <PageHeader
        title="Laporan Laba Rugi"
        description="Ringkasan pendapatan, harga pokok, beban usaha, pendapatan dan beban lain-lain untuk menghitung laba/rugi bersih periode berjalan."
      />

      <div className={incomeStatementPageStyles.content}>
        <div className={incomeStatementPageStyles.summaryGrid}>
          <div className={incomeStatementPageStyles.summaryBox}>
            <p className={incomeStatementPageStyles.summaryLabel}>
              Pendapatan Usaha
            </p>
            <p className={incomeStatementPageStyles.summaryValue}>
              {formatCurrency(report.operatingRevenue)}
            </p>
            <p className={incomeStatementPageStyles.summaryHelp}>
              Total akun 4.x periode berjalan.
            </p>
          </div>

          <div className={incomeStatementPageStyles.summaryBox}>
            <p className={incomeStatementPageStyles.summaryLabel}>Laba Kotor</p>
            <p
              className={
                Number(report.grossProfit) >= 0
                  ? incomeStatementPageStyles.profitValue
                  : incomeStatementPageStyles.lossValue
              }
            >
              {formatCurrency(report.grossProfit)}
            </p>
            <p className={incomeStatementPageStyles.summaryHelp}>
              Pendapatan usaha dikurangi HPP.
            </p>
          </div>

          <div className={incomeStatementPageStyles.summaryBox}>
            <p className={incomeStatementPageStyles.summaryLabel}>
              Laba Operasi
            </p>
            <p
              className={
                Number(report.operatingProfit) >= 0
                  ? incomeStatementPageStyles.profitValue
                  : incomeStatementPageStyles.lossValue
              }
            >
              {formatCurrency(report.operatingProfit)}
            </p>
            <p className={incomeStatementPageStyles.summaryHelp}>
              Laba kotor dikurangi beban usaha.
            </p>
          </div>

          <div className={incomeStatementPageStyles.summaryBox}>
            <p className={incomeStatementPageStyles.summaryLabel}>
              Laba/Rugi Bersih
            </p>
            <p
              className={
                report.isProfit
                  ? incomeStatementPageStyles.profitValue
                  : incomeStatementPageStyles.lossValue
              }
            >
              {formatCurrency(report.netProfit)}
            </p>
            <p className={incomeStatementPageStyles.summaryHelp}>
              Hasil akhir periode berjalan.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Laporan Laba Rugi</CardTitle>
            <p className="text-sm leading-6 text-slate-500">
              Pilih periode, rentang tanggal, dan cakupan akun untuk menyusun
              Laba Rugi.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <div className={incomeStatementPageStyles.filterGrid}>
                <div className={incomeStatementPageStyles.fieldGroup}>
                  <Label
                    htmlFor="periodId"
                    className={incomeStatementPageStyles.label}
                  >
                    Periode Akuntansi
                  </Label>
                  <select
                    id="periodId"
                    name="periodId"
                    className={incomeStatementPageStyles.select}
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
                  <p className={incomeStatementPageStyles.helperText}>
                    Default memakai periode akuntansi yang masih terbuka.
                  </p>
                </div>

                <div className={incomeStatementPageStyles.fieldGroup}>
                  <Label
                    htmlFor="startDate"
                    className={incomeStatementPageStyles.label}
                  >
                    Tanggal Awal
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={report.startDate}
                  />
                  <p className={incomeStatementPageStyles.helperText}>
                    Awal periode laporan.
                  </p>
                </div>

                <div className={incomeStatementPageStyles.fieldGroup}>
                  <Label
                    htmlFor="endDate"
                    className={incomeStatementPageStyles.label}
                  >
                    Tanggal Akhir
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={report.endDate}
                  />
                  <p className={incomeStatementPageStyles.helperText}>
                    Akhir periode laporan.
                  </p>
                </div>

                <div className={incomeStatementPageStyles.fieldGroup}>
                  <Label
                    htmlFor="showZeroAccounts"
                    className={incomeStatementPageStyles.label}
                  >
                    Cakupan Akun
                  </Label>
                  <select
                    id="showZeroAccounts"
                    name="showZeroAccounts"
                    className={incomeStatementPageStyles.select}
                    defaultValue={report.showZeroAccounts ? "true" : "false"}
                  >
                    <option value="false">Hanya akun yang bernilai</option>
                    <option value="true">Semua akun termasuk nilai nol</option>
                  </select>
                  <p className={incomeStatementPageStyles.helperText}>
                    Default dibuat ringan agar tabel tidak terlalu panjang.
                  </p>
                </div>
              </div>

              <div className={incomeStatementPageStyles.formActions}>
                <Link
                  href="/unit/dashboard/laporan/laba-rugi"
                  className={incomeStatementPageStyles.secondaryAction}
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
            incomeStatementPageStyles.resultBox,
            report.isProfit
              ? incomeStatementPageStyles.profitBox
              : incomeStatementPageStyles.lossBox,
          ].join(" ")}
        >
          <div>
            <p className={incomeStatementPageStyles.resultTitle}>
              {report.isProfit ? (
                <TrendingUp className={incomeStatementPageStyles.resultIcon} />
              ) : (
                <TrendingDown
                  className={incomeStatementPageStyles.resultIcon}
                />
              )}
              {report.isProfit ? "Unit mencatat laba bersih" : "Unit mencatat rugi bersih"}
            </p>
            <p className="mt-1">
              Periode{" "}
              {report.startDate ? formatDate(report.startDate) : "-"} sampai{" "}
              {report.endDate ? formatDate(report.endDate) : "-"} menampilkan{" "}
              {report.visibleAccountCount} akun, dengan{" "}
              {report.nonZeroAccountCount} akun bernilai.
            </p>
          </div>
          <div className="font-semibold">
            {formatCurrency(netProfitAmount)}
          </div>
        </div>

        <div className={incomeStatementPageStyles.formulaCard}>
          <h2 className="text-base font-semibold text-slate-950">
            Ringkasan Perhitungan
          </h2>
          <div className="mt-3">
            <div className={incomeStatementPageStyles.formulaRow}>
              <span className={incomeStatementPageStyles.formulaLabel}>
                Pendapatan Usaha
              </span>
              <span className={incomeStatementPageStyles.formulaValue}>
                {formatCurrency(report.operatingRevenue)}
              </span>
            </div>
            <div className={incomeStatementPageStyles.formulaRow}>
              <span className={incomeStatementPageStyles.formulaLabel}>
                Harga Pokok Produksi dan Penjualan
              </span>
              <span className={incomeStatementPageStyles.formulaValue}>
                ({formatCurrency(report.cogs)})
              </span>
            </div>
            <div className={incomeStatementPageStyles.formulaRow}>
              <span className={incomeStatementPageStyles.formulaLabel}>
                Laba Kotor
              </span>
              <span className={incomeStatementPageStyles.formulaValue}>
                {formatCurrency(report.grossProfit)}
              </span>
            </div>
            <div className={incomeStatementPageStyles.formulaRow}>
              <span className={incomeStatementPageStyles.formulaLabel}>
                Beban Usaha
              </span>
              <span className={incomeStatementPageStyles.formulaValue}>
                ({formatCurrency(report.operatingExpenses)})
              </span>
            </div>
            <div className={incomeStatementPageStyles.formulaRow}>
              <span className={incomeStatementPageStyles.formulaLabel}>
                Laba Operasi
              </span>
              <span className={incomeStatementPageStyles.formulaValue}>
                {formatCurrency(report.operatingProfit)}
              </span>
            </div>
            <div className={incomeStatementPageStyles.formulaRow}>
              <span className={incomeStatementPageStyles.formulaLabel}>
                Pendapatan Lain-lain
              </span>
              <span className={incomeStatementPageStyles.formulaValue}>
                {formatCurrency(report.otherIncome)}
              </span>
            </div>
            <div className={incomeStatementPageStyles.formulaRow}>
              <span className={incomeStatementPageStyles.formulaLabel}>
                Beban Lain-lain dan Pajak
              </span>
              <span className={incomeStatementPageStyles.formulaValue}>
                ({formatCurrency(report.otherExpenses)})
              </span>
            </div>
            <div className={incomeStatementPageStyles.formulaRow}>
              <span className="font-semibold text-slate-950">
                Laba/Rugi Bersih
              </span>
              <span
                className={[
                  incomeStatementPageStyles.formulaValue,
                  report.isProfit ? "text-emerald-700" : "text-rose-700",
                ].join(" ")}
              >
                {formatCurrency(report.netProfit)}
              </span>
            </div>
          </div>
        </div>

        {hasLines ? (
          <div className={incomeStatementPageStyles.sectionGrid}>
            {report.sections.map((section) => (
              <Card key={section.key}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  <p className={incomeStatementPageStyles.sectionDescription}>
                    {section.description}
                  </p>
                </CardHeader>
                <CardContent>
                  {section.lines.length > 0 ? (
                    <div className={incomeStatementPageStyles.tableWrapper}>
                      <div className={incomeStatementPageStyles.tableScroll}>
                        <table className={incomeStatementPageStyles.table}>
                          <thead className={incomeStatementPageStyles.tableHead}>
                            <tr>
                              <th
                                className={
                                  incomeStatementPageStyles.tableHeadCell
                                }
                              >
                                Kode Akun
                              </th>
                              <th
                                className={
                                  incomeStatementPageStyles.tableHeadCell
                                }
                              >
                                Nama Akun
                              </th>
                              <th
                                className={
                                  incomeStatementPageStyles.tableHeadCellRight
                                }
                              >
                                Nilai
                              </th>
                            </tr>
                          </thead>
                          <tbody className={incomeStatementPageStyles.tableBody}>
                            {section.lines.map((line) => (
                              <tr key={line.accountId}>
                                <td
                                  className={
                                    incomeStatementPageStyles.tableCellStrong
                                  }
                                >
                                  {line.kode}
                                </td>
                                <td
                                  className={incomeStatementPageStyles.tableCell}
                                >
                                  {line.nama}
                                </td>
                                <td
                                  className={
                                    incomeStatementPageStyles.tableCellRight
                                  }
                                >
                                  {formatCurrency(line.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className={incomeStatementPageStyles.tableFooter}>
                            <tr>
                              <td
                                className={
                                  incomeStatementPageStyles.tableCellStrong
                                }
                                colSpan={2}
                              >
                                Total {section.title}
                              </td>
                              <td
                                className={
                                  incomeStatementPageStyles.tableCellRightStrong
                                }
                              >
                                {formatCurrency(section.total)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-500">
                      Tidak ada akun bernilai pada bagian ini.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className={incomeStatementPageStyles.emptyState}>
            <div className={incomeStatementPageStyles.emptyIcon}>
              <FileText className="h-6 w-6" />
            </div>
            <h2 className={incomeStatementPageStyles.emptyTitle}>
              Belum ada data Laba Rugi
            </h2>
            <p className={incomeStatementPageStyles.emptyDescription}>
              Belum ada jurnal posted pada akun pendapatan, HPP, beban usaha,
              pendapatan lain-lain, atau beban lain-lain untuk periode ini.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
