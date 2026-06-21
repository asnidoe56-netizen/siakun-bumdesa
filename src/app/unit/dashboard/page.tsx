import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { ResponsiveGrid } from "@/components/layouts/responsive-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";

export const dynamic = "force-dynamic";

const unitDashboardStyles = {
  content: "mt-6 space-y-6",
  cardDescription: "text-sm leading-6 text-slate-500",
};

export default function UnitDashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard Unit Usaha"
        description="Ringkasan aktivitas unit usaha, transaksi harian, kas/bank, dan status pembukuan."
      />

      <div className={unitDashboardStyles.content}>
        <ResponsiveGrid columns={3}>
          <KpiCard
            title="Transaksi Hari Ini"
            value="0"
            description="Transaksi unit yang sudah diposting hari ini."
          />
          <KpiCard
            title="Template Aktif"
            value="8"
            description="Template transaksi inti yang tersedia."
          />
          <KpiCard
            title="Status Pembukuan"
            value="Siap"
            description="Journal Engine sudah tersedia."
          />
        </ResponsiveGrid>

        <Card>
          <CardHeader>
            <CardTitle>Fondasi Dashboard Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={unitDashboardStyles.cardDescription}>
              Halaman ini disiapkan sebagai pusat kerja operator atau manager
              unit usaha. Tahap berikutnya adalah menambahkan menu Catat
              Transaksi yang memakai Template Transaksi aktif dan Journal Engine
              backend.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}