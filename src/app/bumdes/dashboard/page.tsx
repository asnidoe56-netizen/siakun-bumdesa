import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { ResponsiveGrid } from "@/components/layouts/responsive-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";

export const dynamic = "force-dynamic";

const bumdesDashboardStyles = {
  content: "mt-6 space-y-6",
  cardDescription: "text-sm leading-6 text-slate-500",
};

export default function BumDesDashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard BUMDes"
        description="Ringkasan pengelolaan BUMDes, unit usaha, pengguna, dan laporan konsolidasi."
      />

      <div className={bumdesDashboardStyles.content}>
        <ResponsiveGrid columns={3}>
          <KpiCard
            title="Unit Usaha"
            value="0"
            description="Unit usaha aktif yang terdaftar."
          />
          <KpiCard
            title="Transaksi Bulan Ini"
            value="0"
            description="Transaksi yang sudah diposting."
          />
          <KpiCard
            title="Status Periode"
            value="Open"
            description="Periode akuntansi berjalan."
          />
        </ResponsiveGrid>

        <Card>
          <CardHeader>
            <CardTitle>Fondasi Dashboard BUMDes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={bumdesDashboardStyles.cardDescription}>
              Halaman ini disiapkan sebagai pusat kerja Admin BUMDes. Nanti
              data unit usaha, laporan konsolidasi, pengguna, dan status
              periode akan dibaca dari database sesuai hak akses BUMDes.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}