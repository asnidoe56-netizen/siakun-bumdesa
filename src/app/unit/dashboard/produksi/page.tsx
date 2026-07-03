import Link from "next/link";
import { UnitContextBlocker } from "@/components/unit/unit-context-blocker";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";
import {
  ArrowRight,
  Boxes,
  ClipboardList,
  Factory,
  FlaskConical,
  Package,
  Wheat,
} from "lucide-react";

const productionPageStyles = {
  page: "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8",
  header: "border-b border-slate-200 pb-6",
  title: "text-2xl font-bold tracking-tight text-slate-950",
  description: "mt-3 max-w-3xl text-sm leading-6 text-slate-600",
  infoBox:
    "mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm",
  section: "mt-8",
  sectionTitle: "text-base font-semibold text-slate-950",
  sectionDescription: "mt-2 text-sm leading-6 text-slate-600",
  grid: "mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3",
  card: "group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md",
  cardHeader: "flex items-start justify-between gap-4",
  iconBox: "rounded-xl bg-slate-100 p-3 text-slate-700",
  icon: "h-5 w-5",
  badge:
    "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600",
  cardTitle: "mt-5 text-base font-semibold text-slate-950",
  cardDescription: "mt-2 text-sm leading-6 text-slate-600",
  cardFooter:
    "mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold",
  footerLabel: "text-slate-500",
  action: "inline-flex items-center gap-2 text-slate-950",
  actionIcon: "h-4 w-4 transition group-hover:translate-x-1",
};

const productionCards = [
  {
    title: "Data Produk",
    description:
      "Daftarkan produk hasil produksi unit, seperti telur, es kristal, kopi kemasan, katering, atau olahan pangan.",
    href: "/unit/dashboard/produksi/data-produk",
    icon: Package,
    badge: "Tahap 1",
    footer: "Fondasi awal",
  },
  {
    title: "Bahan Baku / Komponen",
    description:
      "Catat bahan baku dan komponen produksi, seperti pakan, kemasan, air, bahan pangan, atau bahan pendukung lainnya.",
    href: "/unit/dashboard/produksi/bahan-baku",
    icon: Wheat,
    badge: "Tahap 2",
    footer: "Setelah produk",
  },
  {
    title: "Stok Bahan / Komponen",
    description:
      "Pantau saldo bahan baku dan komponen dari bahan masuk, bahan keluar, serta pemakaian produksi.",
    href: "/unit/dashboard/produksi/stok-bahan",
    icon: Boxes,
    badge: "Kontrol Stok",
    footer: "Monitoring",
  },
  {
    title: "Formula / Resep Produksi",
    description:
      "Atur hubungan produk dengan bahan baku agar sistem siap menghitung kebutuhan produksi dan HPP.",
    href: "/unit/dashboard/produksi/formula",
    icon: FlaskConical,
    badge: "Tahap 3",
    footer: "Opsional awal",
  },
  {
    title: "Catat Produksi",
    description:
      "Catat proses produksi harian: produk yang dihasilkan, jumlah produksi, bahan yang dipakai, dan biaya tambahan.",
    href: "/unit/dashboard/produksi/catat-produksi",
    icon: Factory,
    badge: "Tahap 4",
    footer: "Setelah master data",
  },

  {
    title: "Stok Produksi",
    description:
      "Lihat pergerakan stok hasil produksi sebelum masuk ke menu Barang Jadi dan Penjualan Produk.",
    href: "/unit/dashboard/barang-jadi",
    icon: ClipboardList,
    badge: "Tahap 6",
    footer: "Lanjutan",
  },
];

export default async function ProductionPage() {
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Produksi Tidak Tersedia"
        description="Menu produksi hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  return (
    <main className={productionPageStyles.page}>
      <div className={productionPageStyles.header}>
        <h1 className={productionPageStyles.title}>Produksi</h1>
        <p className={productionPageStyles.description}>
          Pusat kerja produksi barang jadi. Mulai dari data produk, bahan baku,
          formula produksi, pencatatan produksi, sampai stok hasil produksi.
        </p>

        <div className={productionPageStyles.infoBox}>
          Alur produksi dibuat bertahap agar bisa dipakai lintas BUMDes. Engine
          kategori dan mapping tetap global, sedangkan produk, bahan baku, stok,
          dan transaksi produksi menjadi data milik masing-masing unit usaha.
        </div>
      </div>

      <section className={productionPageStyles.section}>
        <h2 className={productionPageStyles.sectionTitle}>
          Urutan Kerja Produksi
        </h2>
        <p className={productionPageStyles.sectionDescription}>
          Kerjakan dari Data Produk terlebih dahulu. Setelah produk tersedia,
          baru lanjut ke bahan baku, formula, dan pencatatan produksi.
        </p>

        <div className={productionPageStyles.grid}>
          {productionCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.href}
                href={card.href}
                className={productionPageStyles.card}
              >
                <div className={productionPageStyles.cardHeader}>
                  <div className={productionPageStyles.iconBox}>
                    <Icon className={productionPageStyles.icon} />
                  </div>
                  <span className={productionPageStyles.badge}>
                    {card.badge}
                  </span>
                </div>

                <h3 className={productionPageStyles.cardTitle}>
                  {card.title}
                </h3>
                <p className={productionPageStyles.cardDescription}>
                  {card.description}
                </p>

                <div className={productionPageStyles.cardFooter}>
                  <span className={productionPageStyles.footerLabel}>
                    {card.footer}
                  </span>
                  <span className={productionPageStyles.action}>
                    Buka
                    <ArrowRight className={productionPageStyles.actionIcon} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}