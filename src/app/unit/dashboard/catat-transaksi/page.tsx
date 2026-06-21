import Link from "next/link";
import {
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

export const dynamic = "force-dynamic";

const transactionGroups = [
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
  {
    title: "Terima Modal",
    description: "Catat penerimaan modal dari desa atau masyarakat.",
    templateCode: "T19",
    href: null,
    icon: Banknote,
    status: "Berikutnya",
  },
];

const catatTransaksiStyles = {
  content: "mt-6 space-y-6",
  intro: "rounded-xl border border-slate-200 bg-white p-5",
  introTitle: "text-base font-semibold text-slate-950",
  introDescription: "mt-2 text-sm leading-6 text-slate-500",
  card: "h-full transition hover:border-slate-300 hover:shadow-sm",
  cardHeader: "space-y-4",
  iconWrap: "flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700",
  icon: "h-5 w-5",
  titleRow: "flex items-start justify-between gap-3",
  description: "text-sm leading-6 text-slate-500",
  footer: "mt-5 flex items-center justify-between border-t border-slate-100 pt-4",
  templateCode: "text-xs font-medium text-slate-500",
  action: "inline-flex items-center gap-2 text-sm font-semibold text-slate-900",
  disabledAction: "inline-flex items-center gap-2 text-sm font-semibold text-slate-400",
  actionIcon: "h-4 w-4",
};

export default function CatatTransaksiPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Catat Transaksi"
        description="Pilih jenis transaksi dengan bahasa bisnis. Sistem akan membuat jurnal otomatis melalui Journal Engine."
      />

      <div className={catatTransaksiStyles.content}>
        <section className={catatTransaksiStyles.intro}>
          <h2 className={catatTransaksiStyles.introTitle}>
            Transaksi Unit Usaha
          </h2>
          <p className={catatTransaksiStyles.introDescription}>
            Operator cukup memilih jenis transaksi dan mengisi data usaha seperti
            tanggal, nominal, kas/bank, serta keterangan. Debit dan kredit tetap
            diproses oleh backend berdasarkan Template Transaksi aktif.
          </p>
        </section>

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