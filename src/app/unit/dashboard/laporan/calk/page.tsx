import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Filter,
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
  getFinancialStatementNotesData,
  type FinancialStatementNote,
  type FinancialStatementNotesLine,
} from "@/lib/unit/get-financial-statement-notes-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type FinancialStatementNotesPageProps = {
  searchParams: Promise<{
    periodId?: string;
    startDate?: string;
    endDate?: string;
    showZeroAccounts?: string;
  }>;
};

const notesPageStyles = {
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
  filterGrid:
    "grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_190px_190px_240px]",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  select:
    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50",
  helperText: "text-xs leading-5 text-slate-500",
  formActions:
    "flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end",
  validationBox:
    "flex flex-col gap-3 rounded-xl border p-4 text-sm leading-6 sm:flex-row sm:items-start sm:justify-between",
  validationOk: "border-emerald-200 bg-emerald-50 text-emerald-900",
  validationWarning: "border-amber-200 bg-amber-50 text-amber-900",
  validationTitle: "flex items-center gap-2 font-semibold",
  validationIcon: "h-4 w-4",
  reportSheet:
    "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
  reportHeader:
    "border-b border-slate-200 bg-white px-5 py-7 text-center sm:px-8",
  reportEntity:
    "text-sm font-semibold uppercase tracking-wide text-slate-700",
  reportTitle:
    "mt-2 text-base font-bold uppercase tracking-wide text-slate-950 sm:text-lg",
  reportSubtitle: "mt-1 text-sm font-medium text-slate-700",
  reportMeta: "mt-1 text-xs text-slate-500 sm:text-sm",
  reportBody: "space-y-8 px-4 py-6 sm:px-8 sm:py-8",
  section: "space-y-4",
  sectionHeading:
    "border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wide text-slate-950",
  paragraphList: "space-y-3 text-sm leading-7 text-slate-700",
  numberedParagraph:
    "grid grid-cols-[28px_minmax(0,1fr)] gap-2 text-sm leading-7 text-slate-700",
  identityGrid:
    "grid gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2",
  identityItem: "min-w-0",
  identityLabel:
    "text-xs font-semibold uppercase tracking-wide text-slate-500",
  identityValue: "mt-1 break-words font-medium text-slate-900",
  policyGrid: "grid gap-4 md:grid-cols-2",
  policyBox: "rounded-xl border border-slate-200 bg-white p-4",
  policyTitle: "font-semibold text-slate-950",
  policyDescription: "mt-2 text-sm leading-6 text-slate-600",
  noteList: "space-y-7",
  noteHeader:
    "flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-start sm:justify-between",
  noteTitle: "text-base font-bold text-slate-950",
  noteDescription: "mt-1 text-sm leading-6 text-slate-600",
  sourceBadge:
    "inline-flex w-fit shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600",
  tableWrapper:
    "overflow-hidden rounded-xl border border-slate-200 bg-white",
  table: "w-full table-fixed border-collapse text-sm",
  codeColumn: "w-24 sm:w-32",
  amountColumn: "w-32 sm:w-48",
  tableHeadCell:
    "border-b border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-4",
  tableHeadCellRight:
    "border-b border-slate-200 bg-slate-50 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-4",
  tableCell:
    "border-b border-slate-100 px-3 py-3 align-top text-slate-700 sm:px-4",
  tableCellRight:
    "border-b border-slate-100 px-3 py-3 text-right align-top font-medium text-slate-800 sm:px-4",
  accountName: "break-words",
  accountBadge:
    "mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600",
  totalRow: "bg-slate-50 font-semibold text-slate-950",
  emptyRow: "px-4 py-6 text-center text-sm text-slate-400",
  reportFooter:
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

  if (Math.abs(numberValue) < 0.005) {
    return "Rp -";
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

function NoteLineRow({
  line,
}: {
  line: FinancialStatementNotesLine;
}) {
  return (
    <tr>
      <td className={notesPageStyles.tableCell}>
        <span className="break-all">{line.kode}</span>
      </td>
      <td className={notesPageStyles.tableCell}>
        <div className={notesPageStyles.accountName}>{line.nama}</div>
        {line.isSynthetic ? (
          <span className={notesPageStyles.accountBadge}>otomatis</span>
        ) : null}
      </td>
      <td className={notesPageStyles.tableCellRight}>
        {formatPresentationCurrency(line.amount)}
      </td>
    </tr>
  );
}

function NoteDetailTable({ note }: { note: FinancialStatementNote }) {
  return (
    <div className={notesPageStyles.tableWrapper}>
      <table className={notesPageStyles.table}>
        <thead>
          <tr>
            <th
              className={[
                notesPageStyles.tableHeadCell,
                notesPageStyles.codeColumn,
              ].join(" ")}
            >
              Kode
            </th>
            <th className={notesPageStyles.tableHeadCell}>Uraian</th>
            <th
              className={[
                notesPageStyles.tableHeadCellRight,
                notesPageStyles.amountColumn,
              ].join(" ")}
            >
              Jumlah
            </th>
          </tr>
        </thead>
        <tbody>
          {note.lines.length > 0 ? (
            note.lines.map((line, index) => (
              <NoteLineRow
                key={`${note.key}-${line.accountId}-${index}`}
                line={line}
              />
            ))
          ) : (
            <tr>
              <td colSpan={3} className={notesPageStyles.emptyRow}>
                Belum ada saldo akun untuk catatan ini.
              </td>
            </tr>
          )}

          <tr className={notesPageStyles.totalRow}>
            <td className={notesPageStyles.tableCell} />
            <td className={notesPageStyles.tableCell}>
              Total {note.title}
            </td>
            <td className={notesPageStyles.tableCellRight}>
              {formatPresentationCurrency(note.total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default async function FinancialStatementNotesPage({
  searchParams,
}: FinancialStatementNotesPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="CaLK Tidak Tersedia"
        description="Catatan atas Laporan Keuangan unit hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  const report = await getFinancialStatementNotesData(context, {
    periodId: params.periodId,
    startDate: params.startDate,
    endDate: params.endDate,
    showZeroAccounts: params.showZeroAccounts === "true",
  });

  const balanceDifference = Math.abs(
    Number(report.validation.balanceDifference)
  );
  const profitDifference = Math.abs(
    Number(report.validation.profitDifference)
  );

  return (
    <PageContainer>
      <div className={notesPageStyles.topBar}>
        <Link
          href="/unit/dashboard/laporan"
          className={notesPageStyles.backLink}
        >
          <ArrowLeft className={notesPageStyles.backIcon} />
          Kembali ke Laporan Unit
        </Link>

        <div className={notesPageStyles.actionGroup}>
          <Link
            href="/unit/dashboard/laporan/neraca"
            className={notesPageStyles.secondaryAction}
          >
            Neraca
          </Link>
          <Link
            href="/unit/dashboard/laporan/laba-rugi"
            className={notesPageStyles.secondaryAction}
          >
            Laba Rugi
          </Link>
        </div>
      </div>

      <PageHeader
        title="Catatan atas Laporan Keuangan (CaLK)"
        description="Penjelasan identitas, basis penyusunan, kebijakan akuntansi, dan rincian akun yang mendukung laporan keuangan unit usaha."
      />

      <div className={notesPageStyles.content}>
        <div className={notesPageStyles.summaryGrid}>
          <div className={notesPageStyles.summaryBox}>
            <p className={notesPageStyles.summaryLabel}>Total aset</p>
            <p className={notesPageStyles.summaryValue}>
              {formatPresentationCurrency(report.totalAssets)}
            </p>
            <p className={notesPageStyles.summaryHelp}>
              Mengikuti Laporan Posisi Keuangan.
            </p>
          </div>

          <div className={notesPageStyles.summaryBox}>
            <p className={notesPageStyles.summaryLabel}>Total kewajiban</p>
            <p className={notesPageStyles.summaryValue}>
              {formatPresentationCurrency(report.totalLiabilities)}
            </p>
            <p className={notesPageStyles.summaryHelp}>
              Kewajiban jangka pendek dan panjang.
            </p>
          </div>

          <div className={notesPageStyles.summaryBox}>
            <p className={notesPageStyles.summaryLabel}>Total ekuitas</p>
            <p className={notesPageStyles.summaryValue}>
              {formatPresentationCurrency(report.totalEquity)}
            </p>
            <p className={notesPageStyles.summaryHelp}>
              Termasuk laba/rugi periode berjalan.
            </p>
          </div>

          <div className={notesPageStyles.summaryBox}>
            <p className={notesPageStyles.summaryLabel}>Laba/rugi bersih</p>
            <p className={notesPageStyles.summaryValue}>
              {formatPresentationCurrency(report.netProfit)}
            </p>
            <p className={notesPageStyles.summaryHelp}>
              Mengikuti Laporan Laba Rugi.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter CaLK</CardTitle>
            <p className="text-sm leading-6 text-slate-500">
              Gunakan periode dan rentang tanggal yang sama dengan Neraca serta
              Laporan Laba Rugi.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <div className={notesPageStyles.filterGrid}>
                <div className={notesPageStyles.fieldGroup}>
                  <Label
                    htmlFor="periodId"
                    className={notesPageStyles.label}
                  >
                    Periode Akuntansi
                  </Label>
                  <select
                    id="periodId"
                    name="periodId"
                    className={notesPageStyles.select}
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
                  <p className={notesPageStyles.helperText}>
                    Default memakai periode akuntansi terbuka.
                  </p>
                </div>

                <div className={notesPageStyles.fieldGroup}>
                  <Label
                    htmlFor="startDate"
                    className={notesPageStyles.label}
                  >
                    Tanggal Mulai
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={report.startDate}
                  />
                  <p className={notesPageStyles.helperText}>
                    Awal periode pendapatan dan beban.
                  </p>
                </div>

                <div className={notesPageStyles.fieldGroup}>
                  <Label
                    htmlFor="endDate"
                    className={notesPageStyles.label}
                  >
                    Tanggal Akhir
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={report.endDate}
                  />
                  <p className={notesPageStyles.helperText}>
                    Tanggal posisi aset, kewajiban, dan ekuitas.
                  </p>
                </div>

                <div className={notesPageStyles.fieldGroup}>
                  <Label
                    htmlFor="showZeroAccounts"
                    className={notesPageStyles.label}
                  >
                    Cakupan Akun
                  </Label>
                  <select
                    id="showZeroAccounts"
                    name="showZeroAccounts"
                    className={notesPageStyles.select}
                    defaultValue={report.showZeroAccounts ? "true" : "false"}
                  >
                    <option value="false">Hanya akun yang bernilai</option>
                    <option value="true">Semua akun termasuk nilai nol</option>
                  </select>
                  <p className={notesPageStyles.helperText}>
                    Akun nol dapat ditampilkan untuk pemeriksaan lengkap.
                  </p>
                </div>
              </div>

              <div className={notesPageStyles.formActions}>
                <Link
                  href="/unit/dashboard/laporan/calk"
                  className={notesPageStyles.secondaryAction}
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
            notesPageStyles.validationBox,
            report.validation.isConsistent
              ? notesPageStyles.validationOk
              : notesPageStyles.validationWarning,
          ].join(" ")}
        >
          <div>
            <p className={notesPageStyles.validationTitle}>
              {report.validation.isConsistent ? (
                <CheckCircle2 className={notesPageStyles.validationIcon} />
              ) : (
                <AlertTriangle className={notesPageStyles.validationIcon} />
              )}
              {report.validation.isConsistent
                ? "CaLK Konsisten dengan Laporan Utama"
                : "CaLK Memerlukan Pemeriksaan"}
            </p>
            <p className="mt-1">
              {report.validation.isConsistent
                ? "Neraca seimbang dan laba/rugi bersih sama dengan laba/rugi periode berjalan pada Neraca."
                : "Periksa keseimbangan Neraca dan konsistensi laba/rugi sebelum laporan disahkan."}
            </p>
          </div>

          <div className="space-y-1 font-semibold">
            <p>Selisih Neraca: {formatCurrency(balanceDifference)}</p>
            <p>Selisih Laba/Rugi: {formatCurrency(profitDifference)}</p>
          </div>
        </div>

        {!report.hasData ? (
          <div className={notesPageStyles.emptyState}>
            <div className={notesPageStyles.emptyIcon}>
              <FileText className="h-6 w-6" />
            </div>
            <h2 className={notesPageStyles.emptyTitle}>
              Belum ada saldo akun untuk CaLK
            </h2>
            <p className={notesPageStyles.emptyDescription}>
              Narasi CaLK tetap tersedia, tetapi rincian angka akan muncul
              setelah jurnal pada periode ini diposting.
            </p>
          </div>
        ) : null}

        <div className={notesPageStyles.reportSheet}>
          <div className={notesPageStyles.reportHeader}>
            <p className={notesPageStyles.reportEntity}>
              {report.identity.bumDesaName}
            </p>
            <p className={notesPageStyles.reportTitle}>
              Catatan atas Laporan Keuangan
            </p>
            <p className={notesPageStyles.reportSubtitle}>
              {report.identity.unitUsahaName}
            </p>
            <p className={notesPageStyles.reportMeta}>
              Untuk periode{" "}
              {report.startDate ? formatDate(report.startDate) : "-"} sampai{" "}
              {report.endDate ? formatDate(report.endDate) : "-"} · dalam Rupiah
            </p>
          </div>

          <div className={notesPageStyles.reportBody}>
            <section className={notesPageStyles.section}>
              <h2 className={notesPageStyles.sectionHeading}>
                A. Informasi Umum
              </h2>

              <div className={notesPageStyles.identityGrid}>
                <div className={notesPageStyles.identityItem}>
                  <p className={notesPageStyles.identityLabel}>BUM Desa</p>
                  <p className={notesPageStyles.identityValue}>
                    {report.identity.bumDesaName}
                  </p>
                </div>

                <div className={notesPageStyles.identityItem}>
                  <p className={notesPageStyles.identityLabel}>Unit Usaha</p>
                  <p className={notesPageStyles.identityValue}>
                    {report.identity.unitUsahaName}
                  </p>
                </div>

                <div className={notesPageStyles.identityItem}>
                  <p className={notesPageStyles.identityLabel}>Kode Unit</p>
                  <p className={notesPageStyles.identityValue}>
                    {report.identity.unitCode}
                  </p>
                </div>

                <div className={notesPageStyles.identityItem}>
                  <p className={notesPageStyles.identityLabel}>Jenis Unit</p>
                  <p className={notesPageStyles.identityValue}>
                    {report.identity.unitTypeLabel}
                  </p>
                </div>

                <div className={notesPageStyles.identityItem}>
                  <p className={notesPageStyles.identityLabel}>
                    Kategori Usaha
                  </p>
                  <p className={notesPageStyles.identityValue}>
                    {report.identity.businessCategoryName ?? "-"}
                  </p>
                </div>

                <div className={notesPageStyles.identityItem}>
                  <p className={notesPageStyles.identityLabel}>Disusun Oleh</p>
                  <p className={notesPageStyles.identityValue}>
                    {report.identity.preparedBy}
                  </p>
                </div>
              </div>
            </section>

            <section className={notesPageStyles.section}>
              <h2 className={notesPageStyles.sectionHeading}>
                B. Basis Penyusunan Laporan Keuangan
              </h2>

              <div className={notesPageStyles.paragraphList}>
                {report.basisOfPreparation.map((paragraph, index) => (
                  <div
                    key={paragraph}
                    className={notesPageStyles.numberedParagraph}
                  >
                    <span>{index + 1}.</span>
                    <p>{paragraph}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={notesPageStyles.section}>
              <h2 className={notesPageStyles.sectionHeading}>
                C. Ringkasan Kebijakan Akuntansi
              </h2>

              <div className={notesPageStyles.policyGrid}>
                {report.accountingPolicies.map((policy) => (
                  <div key={policy.title} className={notesPageStyles.policyBox}>
                    <h3 className={notesPageStyles.policyTitle}>
                      {policy.title}
                    </h3>
                    <p className={notesPageStyles.policyDescription}>
                      {policy.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className={notesPageStyles.section}>
              <h2 className={notesPageStyles.sectionHeading}>
                D. Penjelasan Pos-pos Laporan Keuangan
              </h2>

              <div className={notesPageStyles.noteList}>
                {report.notes.map((note) => (
                  <article key={note.key} className="space-y-4">
                    <div className={notesPageStyles.noteHeader}>
                      <div>
                        <h3 className={notesPageStyles.noteTitle}>
                          Catatan {note.number}. {note.title}
                        </h3>
                        <p className={notesPageStyles.noteDescription}>
                          {note.description}
                        </p>
                      </div>

                      <span className={notesPageStyles.sourceBadge}>
                        Sumber:{" "}
                        {note.sourceStatement === "NERACA"
                          ? "Neraca"
                          : "Laba Rugi"}
                      </span>
                    </div>

                    <NoteDetailTable note={note} />
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className={notesPageStyles.reportFooter}>
            Catatan ini disusun otomatis dari laporan keuangan unit yang
            bersumber dari jurnal berstatus POSTED. Narasi kebijakan akuntansi
            tahap awal perlu ditinjau dan dilengkapi oleh pengelola sebelum
            laporan ditetapkan atau dipublikasikan.
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
