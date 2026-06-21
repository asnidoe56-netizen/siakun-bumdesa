import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { ResponsiveGrid } from "@/components/layouts/responsive-grid";
import { KpiCard } from "@/components/ui/kpi-card";
import { BumDesaList } from "@/app/platform/bumdes/_components/bum-desa-list";
import { getPlatformBumDesaList } from "@/lib/platform/get-platform-bum-desa-list";

export const dynamic = "force-dynamic";

const bumDesaPageStyles = {
  content: "mt-6 space-y-6",
};

export default async function PlatformBumDesaPage() {
  const data = await getPlatformBumDesaList();

  return (
    <PageContainer>
      <PageHeader
        title="Data BUMDes"
        description="Kelola BUMDes yang sudah terdaftar di platform. Status aktif, suspend, dan hapus mengikuti data database."
      />

      <div className={bumDesaPageStyles.content}>
        <ResponsiveGrid columns={3}>
          <KpiCard
            title="Total BUMDes"
            value={data.summary.total}
            description="BUMDes yang belum dihapus dari platform."
          />
          <KpiCard
            title="Aktif"
            value={data.summary.active}
            description="BUMDes yang dapat menggunakan sistem."
          />
          <KpiCard
            title="Suspend"
            value={data.summary.suspended}
            description="BUMDes yang sedang dinonaktifkan sementara."
          />
        </ResponsiveGrid>

        <BumDesaList bumDesa={data.bumDesa} />
      </div>
    </PageContainer>
  );
}
