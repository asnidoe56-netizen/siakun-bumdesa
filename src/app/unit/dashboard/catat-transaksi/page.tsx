import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CircleDollarSign,
  Landmark,
  ReceiptText,
} from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { ResponsiveGrid } from "@/components/layouts/responsive-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

const centralOfficeTransactionGroups = [
  {
    title: "Terima Modal",
    description: "Catat penerimaan modal dari desa, masyarakat, atau sumber modal lain yang sah.",
    templateCode: "T19",
    href: "/unit/dashboard/catat-transaksi/terima-modal",
    icon: Banknote,
    status: "Siap",
  },
  {
    title: "Alokasi Kas ke Unit",
    description: "Catat pemindahan kas dari Kantor Pusat ke unit usaha aktif dalam BUMDes yang sama.",
    templateCode: "MANUAL",
    href: "/unit/dashboard/catat-transaksi/alokasi-kas-unit",
    icon: CircleDollarSign,
    status: "Siap",
  },
];

const defaultTransactionGroups = [
  {
    title: "Terima Pendapatan Tunai",
    description: "Catat penerimaan kas dari penjualan atau pendapatan usaha.",
    templateCode: "T01",
    href: "/unit/dashboard/catat-transaksi/terima-pendapatan-tunai",
    icon: CircleDollarSign,
    status: "Siap",
  },
  {
    title: "Setor Tunai ke Bank",
    description: "Catat pemindahan uang dari kas tunai ke rekening bank.",
    templateCode: "T02",
    href: null,
    icon: Landmark,
    status: "Berikutnya",
  },
  {
    title: "Beli Barang/Jasa Tunai",
    description: "Catat pengeluaran kas untuk pembelian barang atau jasa.",
    templateCode: "T06",
    href: null,
    icon: ReceiptText,
    status: "Berikutnya",
  },
];

const productionGeneralTransactionGroups = [
  {
    title: "Setor Tunai ke Bank",
    description: "Catat pemindahan uang dari kas tunai ke rekening bank.",
    templateCode: "T02",
    href: null,
    icon: Landmark,
    status: "Berikutnya",
  },
  {
    title: "Bayar/Lunasi Utang Usaha",
    description:
      "Catat pembayaran utang usaha yang sudah terbentuk dari transaksi kredit.",
    templateCode: "T08",
    href: null,
    icon: CircleDollarSign,
    status: "Berikutnya",
  },
  {
    title: "Biaya Operasional Non-Stok",
    description:
      "Untuk biaya umum yang tidak menambah stok bahan, tidak menambah barang jadi, dan tidak memengaruhi HPP produksi.",
    templateCode: "T06",
    href: null,
    icon: ReceiptText,
    status: "Dibatasi",
  },
];

const catatTransaksiStyles = {
  content: "mt-6 space-y-6",
  intro: "rounded-xl border border-slate-200 bg-white p-5",
  introTitle: "text-base font-semibold text-slate-950",
  introDescription: "mt-2 text-sm leading-6 text-slate-500",
  warning:
    "flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950",
  warningIcon:
    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700",
  warningTitle: "font-semibold",
  warningDescription: "mt-2 text-sm leading-6 text-amber-800",
  warningList: "mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-800",
  card: "h-full transition hover:border-slate-300 hover:shadow-sm",
  cardHeader: "space-y-4",
  iconWrap: "flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700",
  icon: "h-5 w-5",
  titleRow: "flex items-start justify-between gap-3",
  description: "text-sm leading-6 text-slate-500",
  footer: "mt-5 flex items-center justify-between border-t border-slate-100 pt-4",
  templateCode: "text-xs font-medium text-slate-500",
  action: "inline-flex items-center gap-2 text-sm font-semibold text-slate-900",
  disabledAction:
    "inline-flex items-center gap-2 text-sm font-semibold text-slate-400",
  actionIcon: "h-4 w-4",
};

export default async function CatatTransaksiPage() {
  const context = await getUnitWorkContext();
  const isCentralOffice = context.unitType === "kantor_pusat";
  const isProductionFinishedGoods =
    context.unitType === "unit_usaha" &&
    context.businessCategoryCode === "PRODUKSI_BARANG_JADI";

  const transactionGroups = isCentralOffice
    ? centralOfficeTransactionGroups
    : isProductionFinishedGoods
      ? productionGeneralTransactionGroups
      : defaultTransactionGroups;

  return (
    <PageContainer>
      <PageHeader
        title={
          isCentralOffice
            ? "Catat Transaksi Pusat"
            : isProductionFinishedGoods
              ? "Transaksi Umum Non-Stok"
              : "Catat Transaksi"
        }
        description={
          isCentralOffice
            ? "Gunakan halaman ini untuk transaksi tingkat BUMDes atau Kantor Pusat, seperti penerimaan modal."
            : isProductionFinishedGoods
              ? "Gunakan halaman ini hanya untuk transaksi umum yang tidak menyentuh stok produksi, barang jadi, atau HPP."
              : "Pilih jenis transaksi dengan bahasa bisnis. Sistem akan membuat jurnal otomatis melalui Journal Engine."
        }
      />

      <div className={catatTransaksiStyles.content}>
        {isProductionFinishedGoods ? (
          <section className={catatTransaksiStyles.warning}>
            <div className={catatTransaksiStyles.warningIcon}>
              <AlertTriangle className={catatTransaksiStyles.icon} />
            </div>
            <div>
              <h2 className={catatTransaksiStyles.warningTitle}>
                Jangan gunakan halaman ini untuk transaksi stok produksi
              </h2>
              <p className={catatTransaksiStyles.warningDescription}>
                Unit produksi barang jadi memiliki alur khusus agar stok, HPP,
                dan jurnal tetap akurat.
              </p>
              <ul className={catatTransaksiStyles.warningList}>
                <li>Penjualan barang jadi dicatat melalui menu Penjualan Produk.</li>
                <li>Pembelian bahan baku harus masuk ke alur bahan/stok produksi.</li>
                <li>Pemakaian bahan dan hasil produksi dicatat melalui Catat Produksi.</li>
              </ul>
            </div>
          </section>
        ) : (
          <section className={catatTransaksiStyles.intro}>
            <h2 className={catatTransaksiStyles.introTitle}>
              {isCentralOffice ? "Transaksi Kantor Pusat" : "Transaksi Unit Usaha"}
            </h2>
            <p className={catatTransaksiStyles.introDescription}>
              {isCentralOffice
                ? "Transaksi pusat dipakai untuk pencatatan yang menjadi kewenangan BUMDes, bukan transaksi operasional unit usaha."
                : "Operator cukup memilih jenis transaksi dan mengisi data usaha seperti tanggal, nominal, kas/bank, serta keterangan. Debit dan kredit tetap diproses oleh backend berdasarkan Template Transaksi aktif."}
            </p>
          </section>
        )}

        <ResponsiveGrid columns={2}>
          {transactionGroups.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.templateCode} className={catatTransaksiStyles.card}>
                <CardHeader className={catatTransaksiStyles.cardHeader}>
                  <div className={catatTransaksiStyles.titleRow}>
                    <div className={catatTransaksiStyles.iconWrap}>
                      <Icon className={catatTransaksiStyles.icon} />
                    </div>

                    <Badge variant={item.href ? "success" : "muted"}>
                      {item.status}
                    </Badge>
                  </div>

                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <p className={catatTransaksiStyles.description}>
                      {item.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className={catatTransaksiStyles.footer}>
                    <span className={catatTransaksiStyles.templateCode}>
                      Template {item.templateCode}
                    </span>

                    {item.href ? (
                      <Link
                        href={item.href}
                        className={catatTransaksiStyles.action}
                      >
                        Siapkan Form
                        <ArrowRight className={catatTransaksiStyles.actionIcon} />
                      </Link>
                    ) : (
                      <span className={catatTransaksiStyles.disabledAction}>
                        Segera
                        <ArrowRight className={catatTransaksiStyles.actionIcon} />
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </ResponsiveGrid>
      </div>
    </PageContainer>
  );
}