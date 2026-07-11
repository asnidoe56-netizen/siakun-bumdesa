import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  Boxes,
  Package,
  ReceiptText,
  Scale,
  ShoppingCart,
  Truck,
  TrendingUp,
  Landmark,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitContextBlocker } from "@/components/unit/unit-context-blocker";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  getUnitReportRecentJournals,
  getUnitReportSummary,
} from "@/lib/unit/get-unit-report-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type ReportShortcut = {
  title: string;
  description: string;
  href: string;
  icon: typeof Banknote;
};

const reportShortcuts: ReportShortcut[] = [
  {
    title: "Kas Unit",
    description: "Pantau saldo Kas Tunai, kas masuk, dan kas keluar.",
    href: "/unit/dashboard/catat-transaksi",
    icon: Banknote,
  },
  {
    title: "Utang Supplier",
    description: "Lihat utang terbuka dan riwayat pembayaran supplier.",
    href: "/unit/dashboard/pelunasan-utang-supplier",
    icon: Truck,
  },
  {
    title: "Stok Bahan",
    description: "Lihat saldo bahan produksi berdasarkan mutasi stok.",
    href: "/unit/dashboard/produksi/stok-bahan",
    icon: Boxes,
  },
  {
    title: "Barang Jadi",
    description: "Pantau stok barang jadi dan nilai persediaannya.",
    href: "/unit/dashboard/barang-jadi",
    icon: Package,
  },
  {
    title: "Penjualan Produk",
    description: "Lihat riwayat penjualan, HPP, dan laba kotor sederhana.",
    href: "/unit/dashboard/penjualan-produk",
    icon: ShoppingCart,
  },
  {
    title: "Buku Besar",
    description: "Lihat mutasi debit, kredit, saldo awal, dan saldo berjalan per akun.",
    href: "/unit/dashboard/laporan/buku-besar",
    icon: BookOpen,
  },
  {
    title: "Neraca Saldo",
    description: "Cek keseimbangan total debit dan kredit seluruh akun detail.",
    href: "/unit/dashboard/laporan/neraca-saldo",
    icon: Scale,
  },
  {
    title: "Laba Rugi",
    description: "Lihat pendapatan, HPP, beban usaha, dan laba/rugi bersih periode berjalan.",
    href: "/unit/dashboard/laporan/laba-rugi",
    icon: TrendingUp,
  },
  {
    title: "Neraca",
    description: "Lihat posisi aset, kewajiban, ekuitas, dan keseimbangan laporan.",
    href: "/unit/dashboard/laporan/neraca",
    icon: Landmark,
  },
  {
    title: "Perubahan Ekuitas",
    description: "Lihat saldo awal, penambahan, pengurangan, laba/rugi berjalan, dan saldo akhir ekuitas.",
    href: "/unit/dashboard/laporan/perubahan-ekuitas",
    icon: TrendingUp,
  },
];

const reportPageStyles = {
  content: "mt-6 w-full min-w-0 space-y-6",
  topBar:
    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
  backLink:
    "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950",
  backIcon: "h-4 w-4",
  summaryGrid: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
  sectionGrid: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]",
  sectionStack: "space-y-6",
  sectionDescription: "text-sm leading-6 text-slate-500",
  shortcutGrid: "grid gap-3 md:grid-cols-2 xl:grid-cols-3",
  shortcutCard:
    "group block h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50",
  shortcutTop: "flex items-start justify-between gap-3",
  shortcutTitle: "font-semibold text-slate-950",
  shortcutDescription: "mt-2 text-sm leading-6 text-slate-600",
  shortcutIcon:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700",
  shortcutFooter:
    "mt-4 flex items-center justify-between border-t border-slate-100 pt-3",
  shortcutStatus:
    "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600",
  shortcutAction:
    "inline-flex items-center gap-2 text-sm font-semibold text-slate-900",
  shortcutActionIcon: "h-4 w-4 transition group-hover:translate-x-0.5",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto lg:overflow-x-visible",
  table: "w-full table-fixed divide-y divide-slate-200 text-sm",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "break-words px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "break-words px-4 py-3 align-top text-slate-700",
  tableCellStrong:
    "break-words px-4 py-3 align-top font-semibold text-slate-950",
  noteBox:
    "rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900",
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

function formatNumber(value: string | number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function ReportShortcutCard({ shortcut }: { shortcut: ReportShortcut }) {
  const Icon = shortcut.icon;

  return (
    <Link href={shortcut.href} className={reportPageStyles.shortcutCard}>
      <div className={reportPageStyles.shortcutTop}>
        <div>
          <p className={reportPageStyles.shortcutTitle}>{shortcut.title}</p>
          <p className={reportPageStyles.shortcutDescription}>
            {shortcut.description}
          </p>
        </div>
        <div className={reportPageStyles.shortcutIcon}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className={reportPageStyles.shortcutFooter}>
        <span className={reportPageStyles.shortcutStatus}>Siap</span>
        <span className={reportPageStyles.shortcutAction}>
          Buka
          <ArrowRight className={reportPageStyles.shortcutActionIcon} />
        </span>
      </div>
    </Link>
  );
}

export default async function UnitReportPage() {
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Laporan Unit Tidak Tersedia"
        description="Laporan operasional unit ini hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  const [summary, recentJournals] = await Promise.all([
    getUnitReportSummary(context),
    getUnitReportRecentJournals(context),
  ]);

  return (
    <PageContainer>
      <div className={reportPageStyles.topBar}>
        <Link href="/unit/dashboard" className={reportPageStyles.backLink}>
          <ArrowLeft className={reportPageStyles.backIcon} />
          Kembali ke Dashboard Unit
        </Link>
      </div>

      <PageHeader
        title="Laporan Unit"
        description="Pusat ringkasan operasional unit berdasarkan transaksi yang sudah diposting. Tahap ini berfokus pada kas, stok, utang supplier, penjualan, dan jurnal transaksi."
      />

      <div className={reportPageStyles.content}>
        <div className={reportPageStyles.summaryGrid}>
          <KpiCard
            title="Saldo Kas Tunai"
            value={formatCurrency(summary.cashBalance)}
            description={`Masuk ${formatCurrency(
              summary.cashIn
            )} - keluar ${formatCurrency(summary.cashOut)}.`}
          />
          <KpiCard
            title="Utang Supplier"
            value={formatCurrency(summary.openPayableAmount)}
            description={`${summary.openPayableCount} utang supplier masih terbuka.`}
          />
          <KpiCard
            title="Nilai Stok"
            value={formatCurrency(
              Number(summary.materialStockValue) +
                Number(summary.finishedGoodsStockValue)
            )}
            description={`Bahan ${formatCurrency(
              summary.materialStockValue
            )}, barang jadi ${formatCurrency(summary.finishedGoodsStockValue)}.`}
          />
          <KpiCard
            title="Laba Kotor Sederhana"
            value={formatCurrency(summary.grossProfitAmount)}
            description={`${formatNumber(
              summary.salesCount
            )} penjualan, HPP ${formatCurrency(summary.totalCogsAmount)}.`}
          />
        </div>

        <div className={reportPageStyles.sectionGrid}>
          <div className={reportPageStyles.sectionStack}>
            <Card>
              <CardHeader>
                <CardTitle>Pusat Laporan Operasional</CardTitle>
                <p className={reportPageStyles.sectionDescription}>
                  Gunakan pintasan ini untuk melihat laporan yang sudah didukung
                  oleh data transaksi saat ini.
                </p>
              </CardHeader>
              <CardContent>
                <div className={reportPageStyles.shortcutGrid}>
                  {reportShortcuts.map((shortcut) => (
                    <ReportShortcutCard
                      key={shortcut.title}
                      shortcut={shortcut}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jurnal Transaksi Terakhir</CardTitle>
                <p className={reportPageStyles.sectionDescription}>
                  Menampilkan maksimal 20 jurnal posted terbaru dari unit ini.
                </p>
              </CardHeader>
              <CardContent>
                {recentJournals.length > 0 ? (
                  <div className={reportPageStyles.tableWrapper}>
                    <div className={reportPageStyles.tableScroll}>
                      <table className={reportPageStyles.table}>
                        <thead className={reportPageStyles.tableHead}>
                          <tr>
                            <th className={reportPageStyles.tableHeadCell}>
                              Nomor
                            </th>
                            <th className={reportPageStyles.tableHeadCell}>
                              Tanggal
                            </th>
                            <th className={reportPageStyles.tableHeadCell}>
                              Template
                            </th>
                            <th className={reportPageStyles.tableHeadCell}>
                              Debit
                            </th>
                            <th className={reportPageStyles.tableHeadCell}>
                              Kredit
                            </th>
                          </tr>
                        </thead>
                        <tbody className={reportPageStyles.tableBody}>
                          {recentJournals.map((journal) => (
                            <tr key={journal.journalId}>
                              <td className={reportPageStyles.tableCellStrong}>
                                {journal.journalNumber}
                              </td>
                              <td className={reportPageStyles.tableCell}>
                                {journal.journalDate}
                              </td>
                              <td className={reportPageStyles.tableCell}>
                                {journal.templateCode ?? journal.source}
                              </td>
                              <td className={reportPageStyles.tableCell}>
                                {formatCurrency(journal.totalDebit)}
                              </td>
                              <td className={reportPageStyles.tableCell}>
                                {formatCurrency(journal.totalCredit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={reportPageStyles.emptyState}>
                    <div className={reportPageStyles.emptyIcon}>
                      <ReceiptText className="h-6 w-6" />
                    </div>
                    <h2 className={reportPageStyles.emptyTitle}>
                      Belum ada jurnal posted
                    </h2>
                    <p className={reportPageStyles.emptyDescription}>
                      Jurnal akan muncul setelah transaksi unit dicatat dan
                      diposting.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className={reportPageStyles.sectionStack}>
            <Card>
              <CardHeader>
                <CardTitle>Batasan Laporan Saat Ini</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={reportPageStyles.noteBox}>
                  Halaman ini adalah laporan operasional awal. Ini belum
                  menggantikan laporan keuangan final seperti Neraca, Laba Rugi
                  formal, Arus Kas formal, atau Perubahan Modal.
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                  Laporan formal akan dibuat setelah siklus modal, biaya
                  operasional, penyesuaian, penyusutan, dan penutupan periode
                  sudah lengkap.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Angka Utama</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                <p>Total penjualan: {formatCurrency(summary.totalSalesAmount)}</p>
                <p>Total HPP: {formatCurrency(summary.totalCogsAmount)}</p>
                <p>
                  Nilai stok bahan: {formatCurrency(summary.materialStockValue)}
                </p>
                <p>
                  Nilai barang jadi:{" "}
                  {formatCurrency(summary.finishedGoodsStockValue)}
                </p>
                <p>Jurnal posted: {formatNumber(summary.postedJournalCount)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
