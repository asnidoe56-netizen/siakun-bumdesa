import Link from "next/link";
import { ArrowLeft, BookOpen, Filter, RotateCcw } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnitContextBlocker } from "@/components/unit/unit-context-blocker";
import { getGeneralLedgerReportData } from "@/lib/unit/get-general-ledger-report-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type GeneralLedgerPageProps = {
  searchParams: Promise<{
    periodId?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

const ledgerPageStyles = {
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
  filterGrid: "grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px]",
  formActions:
    "flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  select:
    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50",
  helperText: "text-xs leading-5 text-slate-500",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto",
  table: "min-w-[980px] w-full divide-y divide-slate-200 text-sm",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "whitespace-nowrap px-4 py-3 align-top text-slate-700",
  tableCellStrong:
    "whitespace-nowrap px-4 py-3 align-top font-semibold text-slate-950",
  tableCellRight: "whitespace-nowrap px-4 py-3 align-top text-right text-slate-700",
  tableCellRightStrong:
    "whitespace-nowrap px-4 py-3 align-top text-right font-semibold text-slate-950",
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

function getSourceLabel(value: string) {
  if (value === "TEMPLATE") {
    return "Template";
  }

  if (value === "MANUAL") {
    return "Manual";
  }

  if (value === "ADJUSTMENT") {
    return "Penyesuaian";
  }

  if (value === "SYSTEM") {
    return "Sistem";
  }

  return value;
}

export default async function GeneralLedgerPage({
  searchParams,
}: GeneralLedgerPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Buku Besar Tidak Tersedia"
        description="Buku Besar unit hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  const report = await getGeneralLedgerReportData(context, {
    periodId: params.periodId,
    accountId: params.accountId,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const selectedAccountLabel = report.selectedAccount
    ? `${report.selectedAccount.kode} - ${report.selectedAccount.nama}`
    : "Belum ada akun";

  return (
    <PageContainer>
      <div className={ledgerPageStyles.topBar}>
        <Link href="/unit/dashboard/laporan" className={ledgerPageStyles.backLink}>
          <ArrowLeft className={ledgerPageStyles.backIcon} />
          Kembali ke Laporan Unit
        </Link>

        <div className={ledgerPageStyles.actionGroup}>
          <Link href="/unit/dashboard/laporan" className={ledgerPageStyles.secondaryAction}>
            Pusat Laporan
          </Link>
        </div>
      </div>

      <PageHeader
        title="Buku Besar"
        description="Lihat mutasi debit, kredit, saldo awal, dan saldo berjalan setiap akun berdasarkan jurnal yang sudah diposting."
      />

      <div className={ledgerPageStyles.content}>
        <div className={ledgerPageStyles.summaryGrid}>
          <div className={ledgerPageStyles.summaryBox}>
            <p className={ledgerPageStyles.summaryLabel}>Saldo awal</p>
            <p className={ledgerPageStyles.summaryValue}>
              {formatCurrency(report.openingBalance)}
            </p>
            <p className={ledgerPageStyles.summaryHelp}>
              Saldo akun sebelum tanggal mulai laporan.
            </p>
          </div>

          <div className={ledgerPageStyles.summaryBox}>
            <p className={ledgerPageStyles.summaryLabel}>Total debit</p>
            <p className={ledgerPageStyles.summaryValue}>
              {formatCurrency(report.totalDebit)}
            </p>
            <p className={ledgerPageStyles.summaryHelp}>
              Total mutasi debit dalam periode terpilih.
            </p>
          </div>

          <div className={ledgerPageStyles.summaryBox}>
            <p className={ledgerPageStyles.summaryLabel}>Total kredit</p>
            <p className={ledgerPageStyles.summaryValue}>
              {formatCurrency(report.totalKredit)}
            </p>
            <p className={ledgerPageStyles.summaryHelp}>
              Total mutasi kredit dalam periode terpilih.
            </p>
          </div>

          <div className={ledgerPageStyles.summaryBox}>
            <p className={ledgerPageStyles.summaryLabel}>Saldo akhir</p>
            <p className={ledgerPageStyles.summaryValue}>
              {formatCurrency(report.endingBalance)}
            </p>
            <p className={ledgerPageStyles.summaryHelp}>
              Saldo akhir sesuai saldo normal akun.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Buku Besar</CardTitle>
            <p className="text-sm leading-6 text-slate-500">
              Pilih periode, akun, dan rentang tanggal untuk melihat mutasi Buku
              Besar.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <div className={ledgerPageStyles.filterGrid}>
                <div className={ledgerPageStyles.fieldGroup}>
                  <Label htmlFor="periodId" className={ledgerPageStyles.label}>
                    Periode Akuntansi
                  </Label>
                  <select
                    id="periodId"
                    name="periodId"
                    className={ledgerPageStyles.select}
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
                </div>

                <div className={ledgerPageStyles.fieldGroup}>
                  <Label htmlFor="startDate" className={ledgerPageStyles.label}>
                    Tanggal Awal
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={report.startDate}
                  />
                </div>

                <div className={ledgerPageStyles.fieldGroup}>
                  <Label htmlFor="endDate" className={ledgerPageStyles.label}>
                    Tanggal Akhir
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={report.endDate}
                  />
                </div>
              </div>

              <div className={ledgerPageStyles.fieldGroup}>
                <Label htmlFor="accountId" className={ledgerPageStyles.label}>
                  Akun
                </Label>
                <select
                  id="accountId"
                  name="accountId"
                  className={ledgerPageStyles.select}
                  defaultValue={report.selectedAccount?.id ?? ""}
                >
                  {report.accounts.length > 0 ? (
                    report.accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.kode} - {account.nama}
                      </option>
                    ))
                  ) : (
                    <option value="">Belum ada akun detail aktif</option>
                  )}
                </select>
                <p className={ledgerPageStyles.helperText}>
                  Buku Besar hanya menampilkan akun detail aktif yang dipakai
                  untuk posting jurnal.
                </p>
              </div>

              <div className={ledgerPageStyles.formActions}>
                <Link
                  href="/unit/dashboard/laporan/buku-besar"
                  className={ledgerPageStyles.secondaryAction}
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

        <Card>
          <CardHeader>
            <CardTitle>Mutasi Buku Besar</CardTitle>
            <div className="space-y-2 text-sm leading-6 text-slate-500">
              <p>
                Akun:{" "}
                <span className="font-semibold text-slate-800">
                  {selectedAccountLabel}
                </span>
              </p>
              <p>
                Periode:{" "}
                <span className="font-semibold text-slate-800">
                  {report.startDate ? formatDate(report.startDate) : "-"} s.d.{" "}
                  {report.endDate ? formatDate(report.endDate) : "-"}
                </span>
              </p>
              {report.selectedAccount ? (
                <span className={ledgerPageStyles.badge}>
                  Saldo normal: {report.selectedAccount.normalBalance}
                </span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {report.lines.length > 0 ? (
              <div className={ledgerPageStyles.tableWrapper}>
                <div className={ledgerPageStyles.tableScroll}>
                  <table className={ledgerPageStyles.table}>
                    <thead className={ledgerPageStyles.tableHead}>
                      <tr>
                        <th className={ledgerPageStyles.tableHeadCell}>
                          Tanggal
                        </th>
                        <th className={ledgerPageStyles.tableHeadCell}>
                          Nomor Jurnal
                        </th>
                        <th className={ledgerPageStyles.tableHeadCell}>
                          Sumber
                        </th>
                        <th className={ledgerPageStyles.tableHeadCell}>
                          Keterangan
                        </th>
                        <th className={ledgerPageStyles.tableHeadCell}>
                          Debit
                        </th>
                        <th className={ledgerPageStyles.tableHeadCell}>
                          Kredit
                        </th>
                        <th className={ledgerPageStyles.tableHeadCell}>
                          Saldo Berjalan
                        </th>
                      </tr>
                    </thead>
                    <tbody className={ledgerPageStyles.tableBody}>
                      <tr>
                        <td className={ledgerPageStyles.tableCellStrong}>
                          {report.startDate ? formatDate(report.startDate) : "-"}
                        </td>
                        <td className={ledgerPageStyles.tableCell}>-</td>
                        <td className={ledgerPageStyles.tableCell}>
                          Saldo Awal
                        </td>
                        <td className={ledgerPageStyles.tableCell}>
                          Saldo sebelum periode laporan
                        </td>
                        <td className={ledgerPageStyles.tableCellRight}>-</td>
                        <td className={ledgerPageStyles.tableCellRight}>-</td>
                        <td className={ledgerPageStyles.tableCellRightStrong}>
                          {formatCurrency(report.openingBalance)}
                        </td>
                      </tr>

                      {report.lines.map((line) => (
                        <tr key={line.entryId}>
                          <td className={ledgerPageStyles.tableCell}>
                            {formatDate(line.journalDate)}
                          </td>
                          <td className={ledgerPageStyles.tableCellStrong}>
                            {line.journalNumber}
                          </td>
                          <td className={ledgerPageStyles.tableCell}>
                            {getSourceLabel(line.source)}
                          </td>
                          <td className={ledgerPageStyles.tableCell}>
                            {line.lineDescription ??
                              line.journalDescription ??
                              "-"}
                          </td>
                          <td className={ledgerPageStyles.tableCellRight}>
                            {formatCurrency(line.debit)}
                          </td>
                          <td className={ledgerPageStyles.tableCellRight}>
                            {formatCurrency(line.kredit)}
                          </td>
                          <td className={ledgerPageStyles.tableCellRightStrong}>
                            {formatCurrency(line.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className={ledgerPageStyles.emptyState}>
                <div className={ledgerPageStyles.emptyIcon}>
                  <BookOpen className="h-6 w-6" />
                </div>
                <h2 className={ledgerPageStyles.emptyTitle}>
                  Belum ada mutasi akun
                </h2>
                <p className={ledgerPageStyles.emptyDescription}>
                  Tidak ada jurnal posted untuk akun dan periode yang dipilih.
                  Coba pilih akun lain atau ubah rentang tanggal.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
