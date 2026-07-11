import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Filter,
  Landmark,
  RotateCcw,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnitContextBlocker } from "@/components/unit/unit-context-blocker";
import {
  getBalanceSheetReportData,
  type BalanceSheetLine,
  type BalanceSheetSection,
} from "@/lib/unit/get-balance-sheet-report-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type BalanceSheetPageProps = {
  searchParams: Promise<{
    periodId?: string;
    endDate?: string;
    showZeroAccounts?: string;
  }>;
};

const balanceSheetPageStyles = {
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
  reportSheet:
    "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
  reportHeader:
    "border-b border-slate-200 bg-white px-5 py-6 text-center sm:px-8",
  reportTitle:
    "text-base font-bold uppercase tracking-wide text-slate-950 sm:text-lg",
  reportSubtitle: "mt-1 text-sm font-medium text-slate-700",
  reportMeta: "mt-1 text-xs text-slate-500 sm:text-sm",
  officialTable: "w-full table-fixed border-collapse text-sm",
  numberColumn: "w-16 sm:w-20",
  amountColumn: "w-36 sm:w-48",
  tableHeadCell:
    "border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5",
  tableHeadCellRight:
    "border-b border-slate-200 bg-slate-50 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-5",
  tableCell:
    "border-b border-slate-100 px-3 py-2.5 align-top text-slate-700 sm:px-5",
  tableCellRight:
    "border-b border-slate-100 px-3 py-2.5 align-top text-right font-medium text-slate-800 sm:px-5",
  groupRow: "bg-slate-100 font-bold uppercase text-slate-950",
  sectionRow: "bg-slate-50 font-semibold text-slate-900",
  accountName: "break-words",
  accountCode: "mt-0.5 text-xs text-slate-500",
  totalRow: "bg-white font-semibold text-slate-950",
  grandTotalRow: "bg-slate-950 font-bold text-white",
  badgeWrap: "mt-1 flex flex-wrap gap-1.5",
  badge:
    "inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium",
  autoBadge: "bg-slate-100 text-slate-600",
  contraBadge: "bg-amber-50 text-amber-700",
  negativeBadge: "bg-rose-50 text-rose-700",
  officialFooter:
    "border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs leading-5 text-slate-500 sm:px-8",
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

function formatPresentationCurrency(value: string | number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "-";
  }

  const formattedValue = formatCurrency(Math.abs(numberValue));

  if (numberValue < 0) {
    return `(${formattedValue})`;
  }

  return formattedValue;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function isContraAccount(line: BalanceSheetLine) {
  const name = line.nama.toLowerCase();

  return (
    name.includes("penyisihan") ||
    name.includes("akumulasi") ||
    name.includes("amortisasi")
  );
}

function AccountBadges({ line }: { line: BalanceSheetLine }) {
  const isNegative = Number(line.amount) < 0;
  const isContra = isContraAccount(line);

  if (!line.isSynthetic && !isNegative && !isContra) {
    return null;
  }

  return (
    <span className={balanceSheetPageStyles.badgeWrap}>
      {line.isSynthetic ? (
        <span
          className={[
            balanceSheetPageStyles.badge,
            balanceSheetPageStyles.autoBadge,
          ].join(" ")}
        >
          otomatis
        </span>
      ) : null}

      {isContra ? (
        <span
          className={[
            balanceSheetPageStyles.badge,
            balanceSheetPageStyles.contraBadge,
          ].join(" ")}
        >
          pengurang
        </span>
      ) : null}

      {isNegative && !isContra ? (
        <span
          className={[
            balanceSheetPageStyles.badge,
            balanceSheetPageStyles.negativeBadge,
          ].join(" ")}
        >
          saldo negatif
        </span>
      ) : null}
    </span>
  );
}

function ReportLineRow({
  number,
  line,
}: {
  number: string;
  line: BalanceSheetLine;
}) {
  return (
    <tr>
      <td className={balanceSheetPageStyles.tableCell}>{number}</td>
      <td className={balanceSheetPageStyles.tableCell}>
        <div className={balanceSheetPageStyles.accountName}>{line.nama}</div>
        <div className={balanceSheetPageStyles.accountCode}>{line.kode}</div>
        <AccountBadges line={line} />
      </td>
      <td className={balanceSheetPageStyles.tableCellRight}>
        {formatPresentationCurrency(line.amount)}
      </td>
    </tr>
  );
}

function ReportSectionRows({
  prefix,
  section,
}: {
  prefix: string;
  section: BalanceSheetSection;
}) {
  return (
    <>
      <tr className={balanceSheetPageStyles.sectionRow}>
        <td className={balanceSheetPageStyles.tableCell}>{prefix}</td>
        <td className={balanceSheetPageStyles.tableCell}>{section.title}</td>
        <td className={balanceSheetPageStyles.tableCellRight} />
      </tr>

      {section.lines.length > 0 ? (
        section.lines.map((line, index) => (
          <ReportLineRow
            key={line.accountId}
            number={`${prefix}.${index + 1}`}
            line={line}
          />
        ))
      ) : (
        <tr>
          <td className={balanceSheetPageStyles.tableCell} />
          <td className={balanceSheetPageStyles.tableCell}>
            <span className="text-slate-400">Tidak ada akun bernilai</span>
          </td>
          <td className={balanceSheetPageStyles.tableCellRight}>-</td>
        </tr>
      )}

      <tr className={balanceSheetPageStyles.totalRow}>
        <td className={balanceSheetPageStyles.tableCell} />
        <td className={balanceSheetPageStyles.tableCell}>
          Total {section.title}
        </td>
        <td className={balanceSheetPageStyles.tableCellRight}>
          {formatPresentationCurrency(section.total)}
        </td>
      </tr>
    </>
  );
}

function GroupHeaderRow({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <tr className={balanceSheetPageStyles.groupRow}>
      <td className={balanceSheetPageStyles.tableCell}>{number}</td>
      <td className={balanceSheetPageStyles.tableCell}>{title}</td>
      <td className={balanceSheetPageStyles.tableCellRight} />
    </tr>
  );
}

export default async function BalanceSheetPage({
  searchParams,
}: BalanceSheetPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Neraca Tidak Tersedia"
        description="Neraca unit hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  const report = await getBalanceSheetReportData(context, {
    periodId: params.periodId,
    endDate: params.endDate,
    showZeroAccounts: params.showZeroAccounts === "true",
  });

  const differenceAmount = Math.abs(Number(report.difference));
  const hasLines =
    report.assetSections.some((section) => section.lines.length > 0) ||
    report.liabilitySections.some((section) => section.lines.length > 0) ||
    report.equitySections.some((section) => section.lines.length > 0);

  return (
    <PageContainer>
      <div className={balanceSheetPageStyles.topBar}>
        <Link
          href="/unit/dashboard/laporan"
          className={balanceSheetPageStyles.backLink}
        >
          <ArrowLeft className={balanceSheetPageStyles.backIcon} />
          Kembali ke Laporan Unit
        </Link>

        <div className={balanceSheetPageStyles.actionGroup}>
          <Link
            href="/unit/dashboard/laporan/laba-rugi"
            className={balanceSheetPageStyles.secondaryAction}
          >
            Laba Rugi
          </Link>
          <Link
            href="/unit/dashboard/laporan/neraca-saldo"
            className={balanceSheetPageStyles.secondaryAction}
          >
            Neraca Saldo
          </Link>
        </div>
      </div>

      <PageHeader
        title="Laporan Posisi Keuangan (Neraca)"
        description="Format penyajian posisi aset, kewajiban, dan ekuitas unit usaha sampai tanggal laporan."
      />

      <div className={balanceSheetPageStyles.content}>
        <div className={balanceSheetPageStyles.summaryGrid}>
          <div className={balanceSheetPageStyles.summaryBox}>
            <p className={balanceSheetPageStyles.summaryLabel}>Total aset</p>
            <p className={balanceSheetPageStyles.summaryValue}>
              {formatPresentationCurrency(report.totalAssets)}
            </p>
            <p className={balanceSheetPageStyles.summaryHelp}>
              Total seluruh kelompok aset.
            </p>
          </div>

          <div className={balanceSheetPageStyles.summaryBox}>
            <p className={balanceSheetPageStyles.summaryLabel}>
              Total kewajiban
            </p>
            <p className={balanceSheetPageStyles.summaryValue}>
              {formatPresentationCurrency(report.totalLiabilities)}
            </p>
            <p className={balanceSheetPageStyles.summaryHelp}>
              Kewajiban jangka pendek dan panjang.
            </p>
          </div>

          <div className={balanceSheetPageStyles.summaryBox}>
            <p className={balanceSheetPageStyles.summaryLabel}>Total ekuitas</p>
            <p className={balanceSheetPageStyles.summaryValue}>
              {formatPresentationCurrency(report.totalEquity)}
            </p>
            <p className={balanceSheetPageStyles.summaryHelp}>
              Termasuk laba/rugi periode berjalan.
            </p>
          </div>

          <div className={balanceSheetPageStyles.summaryBox}>
            <p className={balanceSheetPageStyles.summaryLabel}>Selisih</p>
            <p className={balanceSheetPageStyles.summaryValue}>
              {formatCurrency(differenceAmount)}
            </p>
            <p className={balanceSheetPageStyles.summaryHelp}>
              Selisih aset dengan kewajiban + ekuitas.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Neraca</CardTitle>
            <p className="text-sm leading-6 text-slate-500">
              Pilih periode, tanggal laporan, dan cakupan akun untuk menyusun
              posisi keuangan.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <div className={balanceSheetPageStyles.filterGrid}>
                <div className={balanceSheetPageStyles.fieldGroup}>
                  <Label
                    htmlFor="periodId"
                    className={balanceSheetPageStyles.label}
                  >
                    Periode Akuntansi
                  </Label>
                  <select
                    id="periodId"
                    name="periodId"
                    className={balanceSheetPageStyles.select}
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
                  <p className={balanceSheetPageStyles.helperText}>
                    Default memakai periode akuntansi yang masih terbuka.
                  </p>
                </div>

                <div className={balanceSheetPageStyles.fieldGroup}>
                  <Label
                    htmlFor="endDate"
                    className={balanceSheetPageStyles.label}
                  >
                    Tanggal Laporan
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={report.endDate}
                  />
                  <p className={balanceSheetPageStyles.helperText}>
                    Saldo dihitung sampai tanggal ini.
                  </p>
                </div>

                <div className={balanceSheetPageStyles.fieldGroup}>
                  <Label
                    htmlFor="showZeroAccounts"
                    className={balanceSheetPageStyles.label}
                  >
                    Cakupan Akun
                  </Label>
                  <select
                    id="showZeroAccounts"
                    name="showZeroAccounts"
                    className={balanceSheetPageStyles.select}
                    defaultValue={report.showZeroAccounts ? "true" : "false"}
                  >
                    <option value="false">Hanya akun yang bernilai</option>
                    <option value="true">Semua akun termasuk nilai nol</option>
                  </select>
                  <p className={balanceSheetPageStyles.helperText}>
                    Default dibuat ringan agar tabel tidak terlalu panjang.
                  </p>
                </div>
              </div>

              <div className={balanceSheetPageStyles.formActions}>
                <Link
                  href="/unit/dashboard/laporan/neraca"
                  className={balanceSheetPageStyles.secondaryAction}
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
            balanceSheetPageStyles.validationBox,
            report.isBalanced
              ? balanceSheetPageStyles.validationOk
              : balanceSheetPageStyles.validationWarning,
          ].join(" ")}
        >
          <div>
            <p className={balanceSheetPageStyles.validationTitle}>
              {report.isBalanced ? (
                <CheckCircle2 className={balanceSheetPageStyles.validationIcon} />
              ) : (
                <AlertTriangle
                  className={balanceSheetPageStyles.validationIcon}
                />
              )}
              {report.isBalanced
                ? "Neraca Seimbang"
                : "Neraca Belum Seimbang"}
            </p>
            <p className="mt-1">
              {report.isBalanced
                ? "Total aset sudah sama dengan total kewajiban dan ekuitas."
                : "Ada selisih antara aset dan kewajiban + ekuitas. Periksa jurnal posted atau akun laba/rugi berjalan."}
            </p>
          </div>
          <div className="font-semibold">
            Selisih: {formatCurrency(differenceAmount)}
          </div>
        </div>

        {hasLines ? (
          <div className={balanceSheetPageStyles.reportSheet}>
            <div className={balanceSheetPageStyles.reportHeader}>
              <p className={balanceSheetPageStyles.reportTitle}>
                Laporan Posisi Keuangan (Neraca)
              </p>
              <p className={balanceSheetPageStyles.reportSubtitle}>
                Unit Usaha BUM Desa
              </p>
              <p className={balanceSheetPageStyles.reportMeta}>
                Per {report.endDate ? formatDate(report.endDate) : "-"} · dalam
                Rupiah
              </p>
            </div>

            <table className={balanceSheetPageStyles.officialTable}>
              <thead>
                <tr>
                  <th
                    className={[
                      balanceSheetPageStyles.tableHeadCell,
                      balanceSheetPageStyles.numberColumn,
                    ].join(" ")}
                  >
                    No.
                  </th>
                  <th className={balanceSheetPageStyles.tableHeadCell}>
                    Uraian
                  </th>
                  <th
                    className={[
                      balanceSheetPageStyles.tableHeadCellRight,
                      balanceSheetPageStyles.amountColumn,
                    ].join(" ")}
                  >
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody>
                <GroupHeaderRow number="A" title="Aset" />
                {report.assetSections.map((section, index) => (
                  <ReportSectionRows
                    key={section.key}
                    prefix={`A.${index + 1}`}
                    section={section}
                  />
                ))}
                <tr className={balanceSheetPageStyles.grandTotalRow}>
                  <td className={balanceSheetPageStyles.tableCell} />
                  <td className={balanceSheetPageStyles.tableCell}>
                    Total Aset
                  </td>
                  <td className={balanceSheetPageStyles.tableCellRight}>
                    {formatPresentationCurrency(report.totalAssets)}
                  </td>
                </tr>

                <GroupHeaderRow number="B" title="Kewajiban" />
                {report.liabilitySections.map((section, index) => (
                  <ReportSectionRows
                    key={section.key}
                    prefix={`B.${index + 1}`}
                    section={section}
                  />
                ))}
                <tr className={balanceSheetPageStyles.totalRow}>
                  <td className={balanceSheetPageStyles.tableCell} />
                  <td className={balanceSheetPageStyles.tableCell}>
                    Total Kewajiban
                  </td>
                  <td className={balanceSheetPageStyles.tableCellRight}>
                    {formatPresentationCurrency(report.totalLiabilities)}
                  </td>
                </tr>

                <GroupHeaderRow number="C" title="Ekuitas" />
                {report.equitySections.map((section, index) => (
                  <ReportSectionRows
                    key={section.key}
                    prefix={`C.${index + 1}`}
                    section={section}
                  />
                ))}
                <tr className={balanceSheetPageStyles.totalRow}>
                  <td className={balanceSheetPageStyles.tableCell} />
                  <td className={balanceSheetPageStyles.tableCell}>
                    Ekuitas sebelum laba/rugi periode berjalan
                  </td>
                  <td className={balanceSheetPageStyles.tableCellRight}>
                    {formatPresentationCurrency(
                      report.totalEquityBeforeCurrentProfit
                    )}
                  </td>
                </tr>
                <tr className={balanceSheetPageStyles.totalRow}>
                  <td className={balanceSheetPageStyles.tableCell} />
                  <td className={balanceSheetPageStyles.tableCell}>
                    Laba/Rugi Periode Berjalan
                  </td>
                  <td className={balanceSheetPageStyles.tableCellRight}>
                    {formatPresentationCurrency(report.currentPeriodProfit)}
                  </td>
                </tr>
                <tr className={balanceSheetPageStyles.totalRow}>
                  <td className={balanceSheetPageStyles.tableCell} />
                  <td className={balanceSheetPageStyles.tableCell}>
                    Total Ekuitas
                  </td>
                  <td className={balanceSheetPageStyles.tableCellRight}>
                    {formatPresentationCurrency(report.totalEquity)}
                  </td>
                </tr>

                <tr className={balanceSheetPageStyles.grandTotalRow}>
                  <td className={balanceSheetPageStyles.tableCell} />
                  <td className={balanceSheetPageStyles.tableCell}>
                    Total Kewajiban dan Ekuitas
                  </td>
                  <td className={balanceSheetPageStyles.tableCellRight}>
                    {formatPresentationCurrency(
                      report.totalLiabilitiesAndEquity
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className={balanceSheetPageStyles.officialFooter}>
              Angka dalam tanda kurung menunjukkan saldo negatif atau akun
              pengurang. Saldo negatif pada kas/piutang/persediaan perlu
              ditinjau sebagai indikasi jurnal atau transaksi yang perlu
              diperiksa.
            </div>
          </div>
        ) : (
          <div className={balanceSheetPageStyles.emptyState}>
            <div className={balanceSheetPageStyles.emptyIcon}>
              <Landmark className="h-6 w-6" />
            </div>
            <h2 className={balanceSheetPageStyles.emptyTitle}>
              Belum ada data Neraca
            </h2>
            <p className={balanceSheetPageStyles.emptyDescription}>
              Belum ada jurnal posted pada akun aset, kewajiban, atau ekuitas
              untuk tanggal laporan ini.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
