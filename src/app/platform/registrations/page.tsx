import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { ResponsiveGrid } from "@/components/layouts/responsive-grid";
import { KpiCard } from "@/components/ui/kpi-card";
import { RegistrationList } from "@/app/platform/registrations/_components/registration-list";
import { getBumDesaRegistrations } from "@/lib/platform/get-bum-desa-registrations";

export const dynamic = "force-dynamic";

const registrationsPageStyles = {
  content: "mt-6 space-y-6",
};

export default async function PlatformRegistrationsPage() {
  const data = await getBumDesaRegistrations();

  return (
    <PageContainer>
      <PageHeader
        title="Pendaftaran BUMDes"
        description="Review pendaftaran BUMDes yang masuk ke platform sebelum disetujui menjadi tenant aktif."
      />

      <div className={registrationsPageStyles.content}>
        <ResponsiveGrid columns={4}>
          <KpiCard
            title="Total Pendaftaran"
            value={data.summary.total}
            description="Seluruh pendaftaran yang masuk."
          />
          <KpiCard
            title="Menunggu Review"
            value={data.summary.pending}
            description="Perlu ditinjau Super Admin."
          />
          <KpiCard
            title="Disetujui"
            value={data.summary.approved}
            description="Sudah menjadi data BUMDes."
          />
          <KpiCard
            title="Ditolak"
            value={data.summary.rejected}
            description="Tidak memenuhi proses review."
          />
        </ResponsiveGrid>

        <RegistrationList registrations={data.registrations} />
      </div>
    </PageContainer>
  );
}
