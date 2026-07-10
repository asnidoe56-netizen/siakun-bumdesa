import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Filter,
  RotateCcw,
  Scale,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnitContextBlocker } from "@/components/unit/unit-context-blocker";
import { getTrialBalanceReportData } from "@/lib/unit/get-trial-balance-report-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type TrialBalancePageProps = {
  searchParams: Promise<{
    periodId?: string;
    endDate?: string;
    showZeroAccounts?: string;
  }>;
};

const trialBalancePageStyles = {
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
  filterGrid: "grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_260px]",
  formActions:
    "flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  select:
    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50",
  helperText: "text-xs leading-5 text-slate-500",
  validationBox:
    "flex flex-col gap-3 rounded-xl border p-4 text-sm leading-6 sm:flex-row sm:items-start sm:justify-between",
  validationOk: "border-emerald-200 bg-emerald-50 text-emerald-900",
  validationWarning: "border-amber-200 bg-amber-50 text-amber-900",
  validationTitle: "flex items-center gap-2 font-semibold",
  validationIcon: "h-4 w-4",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto",
  table: "min-w-[820px] w-full divide-y divide-slate-200 text-sm",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableHeadCellRight:
    "whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "whitespace-nowrap px-4 py-3 align-top text-slate-700",
  tableCellStrong:
    "whitespace-nowrap px-4 py-3 align-top font-semibold text-slate-950",
  tableCellRight: "whitespace-nowrap px-4 py-3 align-top text-right text-slate-700",
  tableCellRightStrong:
    "whitespace-nowrap px-4 py-3 align-top text-right font-semibold text-slate-950",
  tableFooter: "border-t border-slate-200 bg-slate-50",
  badge:
    "inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600",
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

function formatBalanceSide(value: string) {
  if (value === "DEBIT") {
    return "Debit";
  }

  if (value === "KREDIT") {
    return "Kredit";
  }

  return "Nol";
}

export default async function TrialBalancePage({
  searchParams,
}: TrialBalancePageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Neraca Saldo Tidak Tersedia"
        description="Neraca Saldo unit hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  const report = await getTrialBalanceReportData(context, {
    periodId: params.periodId,
    endDate: params.endDate,
    showZeroAccounts: params.showZeroAccounts === "true",
  });

  const differenceAmount = Math.abs(Number(report.difference));

  return (
    <PageContainer>
      <div className={trialBalancePageStyles.topBar}>
        <Link href="/unit/dashboard/laporan" className={trialBalancePageStyles.backLink}>
          <ArrowLeft className={trialBalancePageStyles.backIcon} />
          Kembali ke Laporan Unit
        </Link>

        <div className={trialBalancePageStyles.actionGroup}>
          <Link href="/unit/dashboard/laporan/buku-besar" className={trialBalancePageStyles.secondaryAction}>
            Buku Besar
          </Link>
          <Link href="/unit/dashboard/laporan" className={trialBalancePageStyles.secondaryAction}>
            Pusat Laporan
          </Link>
        </div>
      </div>

      <PageHeader
        title="Neraca Saldo"
        description="Ringkasan saldo seluruh akun detail untuk memastikan total debit dan kredit seimbang sebelum laporan formal disusun."
      />

      <div className={trialBalancePageStyles.content}>
        <div className={trialBalancePageStyles.summaryGrid}>
          <div className={trialBalancePageStyles.summaryBox}>
            <p className={trialBalancePageStyles.summaryLabel}>Total debit</p>
            <p className={trialBalancePageStyles.summaryValue}>
              {formatCurrency(report.totalDebit)}
            </p>
            <p className={trialBalancePageStyles.summaryHelp}>
              Total saldo debit seluruh akun.
            </p>
          </div>

          <div className={trialBalancePageStyles.summaryBox}>
            <p className={trialBalancePageStyles.summaryLabel}>Total kredit</p>
            <p className={trialBalancePageStyles.summaryValue}>
              {formatCurrency(report.totalKredit)}
            </p>
            <p className={trialBalancePageStyles.summaryHelp}>
              Total saldo kredit seluruh akun.
            </p>
          </div>

          <div className={trialBalancePageStyles.summaryBox}>
            <p className={trialBalancePageStyles.summaryLabel}>Selisih</p>
            <p className={trialBalancePageStyles.summaryValue}>
              {formatCurrency(differenceAmount)}
            </p>
            <p className={trialBalancePageStyles.summaryHelp}>
              Selisih antara total debit dan total kredit.
            </p>
          </div>

          <div className={trialBalancePageStyles.summaryBox}>
            <p className={trialBalancePageStyles.summaryLabel}>Akun tampil</p>
            <p className={trialBalancePageStyles.summaryValue}>
              {report.visibleAccountCount} akun
            </p>
            <p className={trialBalancePageStyles.summaryHelp}>
              {report.nonZeroAccountCount} akun bersaldo dari {report.accountCount} akun detail aktif.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Neraca Saldo</CardTitle>
            <p className="text-sm leading-6 text-slate-500">
              Pilih periode, tanggal akhir, dan cakupan akun untuk menyusun Neraca Saldo.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <div className={trialBalancePageStyles.filterGrid}>
                <div className={trialBalancePageStyles.fieldGroup}>
                  <Label htmlFor="periodId" className={trialBalancePageStyles.label}>
                    Periode Akuntansi
                  </Label>
                  <select
                    id="periodId"
                    name="periodId"
                    className={trialBalancePageStyles.select}
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
                  <p className={trialBalancePageStyles.helperText}>
                    Default memakai periode akuntansi yang masih terbuka.
                  </p>
                </div>

                <div className={trialBalancePageStyles.fieldGroup}>
                  <Label htmlFor="endDate" className={trialBalancePageStyles.label}>
                    Tanggal Akhir
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={report.endDate}
                  />
                  <p className={trialBalancePageStyles.helperText}>
                    Saldo dihitung sampai tanggal ini.
                  </p>
                </div>

                <div className={trialBalancePageStyles.fieldGroup}>
                  <Label htmlFor="showZeroAccounts" className={trialBalancePageStyles.label}>
                    Cakupan Akun
                  </Label>
                  <select
                    id="showZeroAccounts"
                    name="showZeroAccounts"
                    className={trialBalancePageStyles.select}
                    defaultValue={report.showZeroAccounts ? "true" : "false"}
                  >
                    <option value="false">Hanya akun bersaldo</option>
                    <option value="true">Semua akun termasuk saldo nol</option>
                  </select>
                  <p className={trialBalancePageStyles.helperText}>
                    Default dibuat ringan agar tabel tidak terlalu panjang.
                  </p>
                </div>
              </div>

              <div className={trialBalancePageStyles.formActions}>
                <Link
                  href="/unit/dashboard/laporan/neraca-saldo"
                  className={trialBalancePageStyles.secondaryAction}
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
            trialBalancePageStyles.validationBox,
            report.isBalanced
              ? trialBalancePageStyles.validationOk
              : trialBalancePageStyles.validationWarning,
          ].join(" ")}
        >
          <div>
            <p className={trialBalancePageStyles.validationTitle}>
              {report.isBalanced ? (
                <CheckCircle2 className={trialBalancePageStyles.validationIcon} />
              ) : (
                <AlertTriangle className={trialBalancePageStyles.validationIcon} />
              )}
              {report.isBalanced ? "Neraca Saldo Balance" : "Neraca Saldo Belum Balance"}
            </p>
            <p className="mt-1">
              {report.isBalanced
                ? "Total debit dan total kredit sudah sama. Laporan berikutnya dapat disusun dari saldo ini."
                : "Ada selisih antara total debit dan kredit. Periksa jurnal posted sebelum melanjutkan ke Laba Rugi dan Neraca."}
            </p>
          </div>
          <div className="font-semibold">
            Selisih: {formatCurrency(differenceAmount)}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Neraca Saldo</CardTitle>
            <div className="space-y-2 text-sm leading-6 text-slate-500">
              <p>
                Tanggal akhir:{" "}
                <span className="font-semibold text-slate-800">
                  {report.endDate ? formatDate(report.endDate) : "-"}
                </span>
              </p>
              {report.selectedPeriod ? (
                <span className={trialBalancePageStyles.badge}>
                  {report.selectedPeriod.nama}
                </span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {report.lines.length > 0 ? (
              <div className={trialBalancePageStyles.tableWrapper}>
                <div className={trialBalancePageStyles.tableScroll}>
                  <table className={trialBalancePageStyles.table}>
                    <thead className={trialBalancePageStyles.tableHead}>
                      <tr>
                        <th className={trialBalancePageStyles.tableHeadCell}>
                          Kode Akun
                        </th>
                        <th className={trialBalancePageStyles.tableHeadCell}>
                          Nama Akun
                        </th>
                        <th className={trialBalancePageStyles.tableHeadCell}>
                          Saldo Normal
                        </th>
                        <th className={trialBalancePageStyles.tableHeadCellRight}>
                          Mutasi Debit
                        </th>
                        <th className={trialBalancePageStyles.tableHeadCellRight}>
                          Mutasi Kredit
                        </th>
                        <th className={trialBalancePageStyles.tableHeadCellRight}>
                          Saldo Debit
                        </th>
                        <th className={trialBalancePageStyles.tableHeadCellRight}>
                          Saldo Kredit
                        </th>
                      </tr>
                    </thead>
                    <tbody className={trialBalancePageStyles.tableBody}>
                      {report.lines.map((line) => (
                        <tr key={line.accountId}>
                          <td className={trialBalancePageStyles.tableCellStrong}>
                            {line.kode}
                          </td>
                          <td className={trialBalancePageStyles.tableCell}>
                            {line.nama}
                          </td>
                          <td className={trialBalancePageStyles.tableCell}>
                            <span className={trialBalancePageStyles.badge}>
                              {line.normalBalance} / {formatBalanceSide(line.balanceSide)}
                            </span>
                          </td>
                          <td className={trialBalancePageStyles.tableCellRight}>
                            {formatCurrency(line.debitMovement)}
                          </td>
                          <td className={trialBalancePageStyles.tableCellRight}>
                            {formatCurrency(line.kreditMovement)}
                          </td>
                          <td className={trialBalancePageStyles.tableCellRightStrong}>
                            {Number(line.debitBalance) > 0
                              ? formatCurrency(line.debitBalance)
                              : "-"}
                          </td>
                          <td className={trialBalancePageStyles.tableCellRightStrong}>
                            {Number(line.kreditBalance) > 0
                              ? formatCurrency(line.kreditBalance)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className={trialBalancePageStyles.tableFooter}>
                      <tr>
                        <td className={trialBalancePageStyles.tableCellStrong} colSpan={5}>
                          Total
                        </td>
                        <td className={trialBalancePageStyles.tableCellRightStrong}>
                          {formatCurrency(report.totalDebit)}
                        </td>
                        <td className={trialBalancePageStyles.tableCellRightStrong}>
                          {formatCurrency(report.totalKredit)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className={trialBalancePageStyles.emptyState}>
                <div className={trialBalancePageStyles.emptyIcon}>
                  <Scale className="h-6 w-6" />
                </div>
                <h2 className={trialBalancePageStyles.emptyTitle}>
                  Belum ada data Neraca Saldo
                </h2>
                <p className={trialBalancePageStyles.emptyDescription}>
                  Belum ada akun detail aktif atau periode akuntansi untuk
                  menyusun Neraca Saldo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
