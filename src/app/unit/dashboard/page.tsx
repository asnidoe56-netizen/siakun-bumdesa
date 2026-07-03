import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CircleDollarSign,
  ClipboardList,
  Factory,
  Package,
  PackagePlus,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { ResponsiveGrid } from "@/components/layouts/responsive-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  getUnitWorkContext,
  type UnitWorkContext,
} from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type DashboardAction = {
  title: string;
  description: string;
  href: string;
  icon: typeof PackagePlus;
  status: "Siap" | "Berikutnya";
};

const productionMainWorkflowActions: DashboardAction[] = [
  {
    title: "Beli Bahan",
    description:
      "Catat pembelian bahan tunai atau kredit. Stok bahan otomatis bertambah.",
    href: "/unit/dashboard/pembelian-bahan",
    icon: PackagePlus,
    status: "Siap",
  },
  {
    title: "Catat Produksi",
    description: "Catat pemakaian bahan dan hasil barang jadi dari proses produksi.",
    href: "/unit/dashboard/produksi/catat-produksi",
    icon: Factory,
    status: "Siap",
  },
  {
    title: "Jual Produk",
    description:
      "Catat penjualan barang jadi. Stok produk berkurang dan HPP dihitung otomatis.",
    href: "/unit/dashboard/penjualan-produk",
    icon: ShoppingCart,
    status: "Siap",
  },
];

const productionMonitoringActions: DashboardAction[] = [
  {
    title: "Stok Bahan",
    description: "Lihat posisi stok bahan baku, bahan pendukung, dan kemasan.",
    href: "/unit/dashboard/produksi/stok-bahan",
    icon: Package,
    status: "Siap",
  },
  {
    title: "Barang Jadi",
    description: "Lihat stok barang jadi yang siap dijual dan nilai persediaannya.",
    href: "/unit/dashboard/barang-jadi",
    icon: Package,
    status: "Siap",
  },
  {
    title: "Utang Supplier",
    description: "Lihat utang dari pembelian kredit dan catat pembayaran supplier.",
    href: "/unit/dashboard/pelunasan-utang-supplier",
    icon: Truck,
    status: "Siap",
  },
];

const productionGeneralActions: DashboardAction[] = [
  {
    title: "Transaksi Umum Non-Stok",
    description: "Gunakan untuk transaksi umum yang tidak menyentuh stok, produksi, atau HPP.",
    href: "/unit/dashboard/catat-transaksi",
    icon: ClipboardList,
    status: "Siap",
  },
];

const centralOfficeActions: DashboardAction[] = [
  {
    title: "Terima Modal",
    description:
      "Catat penerimaan penyertaan modal desa, masyarakat, atau modal donasi/sumbangan.",
    href: "/unit/dashboard/catat-transaksi/terima-modal",
    icon: Banknote,
    status: "Siap",
  },
  {
    title: "Transaksi Umum Non-Stok",
    description:
      "Gunakan untuk transaksi pusat yang tidak menyentuh stok produksi, barang jadi, atau HPP.",
    href: "/unit/dashboard/catat-transaksi",
    icon: ClipboardList,
    status: "Siap",
  },
];

const unitDashboardStyles = {
  content: "mt-6 space-y-6",
  sectionGrid: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]",
  sectionStack: "space-y-6",
  sectionDescription: "text-sm leading-6 text-slate-500",
  actionGrid: "grid gap-3 md:grid-cols-3",
  actionGridTwo: "grid gap-3 md:grid-cols-2",
  actionCard:
    "group block h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50",
  actionTop: "flex items-start justify-between gap-3",
  actionIcon:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700",
  actionTitle: "font-semibold text-slate-950",
  actionDescription: "mt-2 text-sm leading-6 text-slate-600",
  actionFooter:
    "mt-4 flex items-center justify-between border-t border-slate-100 pt-3",
  actionStatus:
    "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600",
  actionLink:
    "inline-flex items-center gap-2 text-sm font-semibold text-slate-900",
  actionLinkIcon: "h-4 w-4 transition group-hover:translate-x-0.5",
  guideList: "space-y-3 text-sm leading-6 text-slate-600",
  guideNumber:
    "mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700",
  warningBox:
    "rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900",
  infoBox:
    "rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600",
};

function ActionCard({ action }: { action: DashboardAction }) {
  const Icon = action.icon;

  return (
    <Link href={action.href} className={unitDashboardStyles.actionCard}>
      <div className={unitDashboardStyles.actionTop}>
        <div>
          <p className={unitDashboardStyles.actionTitle}>{action.title}</p>
          <p className={unitDashboardStyles.actionDescription}>
            {action.description}
          </p>
        </div>
        <div className={unitDashboardStyles.actionIcon}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className={unitDashboardStyles.actionFooter}>
        <span className={unitDashboardStyles.actionStatus}>
          {action.status}
        </span>
        <span className={unitDashboardStyles.actionLink}>
          Buka
          <ArrowRight className={unitDashboardStyles.actionLinkIcon} />
        </span>
      </div>
    </Link>
  );
}

function CentralOfficeDashboard({ context }: { context: UnitWorkContext }) {
  return (
    <PageContainer>
      <PageHeader
        title="Pusat Kerja BUMDes"
        description="Kelola transaksi tingkat pusat seperti penerimaan modal dan transaksi umum non-stok. Aktivitas produksi, stok, dan penjualan barang jadi dilakukan di unit usaha."
      />

      <div className={unitDashboardStyles.content}>
        <ResponsiveGrid columns={3}>
          <KpiCard
            title="Lingkup Kerja"
            value={context.unitTypeLabel}
            description={`Kode unit: ${context.unitCode}`}
          />
          <KpiCard
            title="Terima Modal"
            value="T19 siap"
            description="Penerimaan modal dicatat di pusat sebelum dialokasikan ke unit."
          />
          <KpiCard
            title="Pemisahan Unit"
            value="Wajib"
            description="Transaksi produksi tidak dicatat di kantor pusat."
          />
        </ResponsiveGrid>

        <div className={unitDashboardStyles.sectionGrid}>
          <div className={unitDashboardStyles.sectionStack}>
            <Card>
              <CardHeader>
                <CardTitle>Alur Pusat</CardTitle>
                <p className={unitDashboardStyles.sectionDescription}>
                  Gunakan bagian ini untuk transaksi tingkat BUMDes induk.
                </p>
              </CardHeader>
              <CardContent>
                <div className={unitDashboardStyles.actionGridTwo}>
                  {centralOfficeActions.map((action) => (
                    <ActionCard key={action.href} action={action} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Batasan Pusat</CardTitle>
                <p className={unitDashboardStyles.sectionDescription}>
                  Kantor pusat tidak digunakan untuk aktivitas stok dan HPP unit produksi.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={unitDashboardStyles.warningBox}>
                  Jangan mencatat pembelian bahan, pemakaian bahan, produksi barang
                  jadi, atau penjualan produk dari konteks PUSAT. Transaksi tersebut
                  harus dilakukan pada unit usaha yang sesuai.
                </div>

                <div className={unitDashboardStyles.infoBox}>
                  Alokasi modal dari pusat ke unit belum dibuka sebagai menu khusus.
                  Setelah unit usaha produksi dibuat, transaksi operasional akan
                  diarahkan ke konteks unit tersebut.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className={unitDashboardStyles.sectionStack}>
            <Card>
              <CardHeader>
                <CardTitle>Urutan Kerja Pusat</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className={unitDashboardStyles.guideList}>
                  <li>
                    <span className={unitDashboardStyles.guideNumber}>1</span>
                    Catat penerimaan modal desa, masyarakat, atau donasi.
                  </li>
                  <li>
                    <span className={unitDashboardStyles.guideNumber}>2</span>
                    Pastikan unit usaha operasional sudah dibuat dan aktif.
                  </li>
                  <li>
                    <span className={unitDashboardStyles.guideNumber}>3</span>
                    Jalankan pembelian, produksi, dan penjualan dari unit usaha,
                    bukan dari kantor pusat.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catatan Engineering</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={unitDashboardStyles.infoBox}>
                  Sistem membaca konteks saat ini sebagai{" "}
                  <strong>{context.unitType}</strong>. Karena itu menu produksi
                  disembunyikan dari navigasi pusat.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function ProductionFinishedGoodsDashboard() {
  return (
    <PageContainer>
      <PageHeader
        title="Pusat Kerja Unit Usaha"
        description="Mulai dari alur utama produksi, pantau stok dan utang supplier, lalu catat transaksi umum hanya jika tidak berkaitan dengan stok."
      />

      <div className={unitDashboardStyles.content}>
        <ResponsiveGrid columns={3}>
          <KpiCard
            title="Alur Utama"
            value="3 langkah"
            description="Beli bahan, catat produksi, lalu jual produk."
          />
          <KpiCard
            title="Kontrol Supplier"
            value="Aktif"
            description="Utang supplier dari pembelian kredit bisa dipantau dan dibayar."
          />
          <KpiCard
            title="Pembukuan"
            value="Otomatis"
            description="Jurnal dibuat melalui Template Transaksi dan Journal Engine."
          />
        </ResponsiveGrid>

        <div className={unitDashboardStyles.sectionGrid}>
          <div className={unitDashboardStyles.sectionStack}>
            <Card>
              <CardHeader>
                <CardTitle>Alur Utama Produksi</CardTitle>
                <p className={unitDashboardStyles.sectionDescription}>
                  Gunakan urutan ini untuk aktivitas produksi harian agar stok,
                  HPP, dan jurnal tetap rapi.
                </p>
              </CardHeader>
              <CardContent>
                <div className={unitDashboardStyles.actionGrid}>
                  {productionMainWorkflowActions.map((action) => (
                    <ActionCard key={action.href} action={action} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring Operasional</CardTitle>
                <p className={unitDashboardStyles.sectionDescription}>
                  Pantau posisi stok bahan, barang jadi, dan kewajiban supplier
                  sebelum mengambil keputusan.
                </p>
              </CardHeader>
              <CardContent>
                <div className={unitDashboardStyles.actionGrid}>
                  {productionMonitoringActions.map((action) => (
                    <ActionCard key={action.href} action={action} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaksi Umum</CardTitle>
                <p className={unitDashboardStyles.sectionDescription}>
                  Gunakan bagian ini hanya untuk transaksi yang tidak menambah
                  stok, tidak mengurangi stok, dan tidak memengaruhi HPP.
                </p>
              </CardHeader>
              <CardContent>
                <div className={unitDashboardStyles.actionGridTwo}>
                  {productionGeneralActions.map((action) => (
                    <ActionCard key={action.href} action={action} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className={unitDashboardStyles.sectionStack}>
            <Card>
              <CardHeader>
                <CardTitle>Urutan Kerja yang Disarankan</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className={unitDashboardStyles.guideList}>
                  <li>
                    <span className={unitDashboardStyles.guideNumber}>1</span>
                    Beli bahan jika stok bahan belum cukup.
                  </li>
                  <li>
                    <span className={unitDashboardStyles.guideNumber}>2</span>
                    Catat produksi saat bahan dipakai dan barang jadi dihasilkan.
                  </li>
                  <li>
                    <span className={unitDashboardStyles.guideNumber}>3</span>
                    Jual produk hanya jika barang jadi sudah tersedia.
                  </li>
                  <li>
                    <span className={unitDashboardStyles.guideNumber}>4</span>
                    Bayar utang supplier jika ada pembelian kredit yang belum
                    lunas.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catatan Penting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={unitDashboardStyles.warningBox}>
                  Jangan mencatat pembelian bahan, pemakaian bahan, atau
                  penjualan barang jadi melalui Transaksi Umum. Gunakan menu
                  khusus agar stok dan HPP tetap akurat.
                </div>

                <div className={unitDashboardStyles.infoBox}>
                  <div className="mb-2 flex items-center gap-2 font-semibold text-slate-950">
                    <CircleDollarSign className="h-4 w-4" />
                    Jurnal otomatis
                  </div>
                  Setiap transaksi utama akan membentuk jurnal sesuai template:
                  T21 untuk pembelian bahan tunai, T22 untuk pembelian bahan
                  kredit, T08 untuk pembayaran utang supplier, dan T20 untuk
                  penjualan produk.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function UnconfiguredUnitDashboard({ context }: { context: UnitWorkContext }) {
  return (
    <PageContainer>
      <PageHeader
        title="Unit Usaha Belum Dikonfigurasi"
        description="Unit ini belum memiliki kategori usaha aktif yang didukung oleh dashboard operasional."
      />

      <div className={unitDashboardStyles.content}>
        <ResponsiveGrid columns={3}>
          <KpiCard
            title="Unit"
            value={context.unitUsahaName}
            description={`Kode unit: ${context.unitCode}`}
          />
          <KpiCard
            title="Jenis"
            value={context.unitTypeLabel}
            description="Konteks kerja sudah terbaca dari database."
          />
          <KpiCard
            title="Kategori"
            value={context.businessCategoryName ?? "Belum diatur"}
            description="Pilih kategori usaha sebelum membuka workflow khusus."
          />
        </ResponsiveGrid>

        <Card>
          <CardHeader>
            <CardTitle>Transaksi yang Tersedia</CardTitle>
            <p className={unitDashboardStyles.sectionDescription}>
              Untuk sementara, gunakan transaksi umum non-stok sampai kategori
              usaha dan workflow unit dikonfigurasi.
            </p>
          </CardHeader>
          <CardContent>
            <div className={unitDashboardStyles.actionGridTwo}>
              {productionGeneralActions.map((action) => (
                <ActionCard key={action.href} action={action} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default async function UnitDashboardPage() {
  const context = await getUnitWorkContext();

  if (context.unitType === "kantor_pusat") {
    return <CentralOfficeDashboard context={context} />;
  }

  if (context.businessCategoryCode === "PRODUKSI_BARANG_JADI") {
    return <ProductionFinishedGoodsDashboard />;
  }

  return <UnconfiguredUnitDashboard context={context} />;
}