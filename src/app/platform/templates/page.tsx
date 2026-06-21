import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { ResponsiveGrid } from "@/components/layouts/responsive-grid";
import { KpiCard } from "@/components/ui/kpi-card";
import { TemplateTransactionList } from "@/app/platform/templates/_components/template-transaction-list";
import { getPlatformTemplateTransactionList } from "@/lib/platform/get-platform-template-transaction-list";

export const dynamic = "force-dynamic";

const templatePageStyles = {
  content: "mt-6 space-y-6",
};

export default async function PlatformTemplatesPage() {
  const data = await getPlatformTemplateTransactionList();
  const inactiveOrDraft =
    data.summary.inactive + data.summary.draft + data.summary.deprecated;

  return (
    <PageContainer>
      <PageHeader
        title="Template Transaksi"
        description="Kelola katalog aturan transaksi global yang dipakai sistem untuk membentuk jurnal otomatis tanpa menampilkan debit/kredit kepada pengguna akhir."
      />

      <div className={templatePageStyles.content}>
        <ResponsiveGrid columns={3}>
          <KpiCard
            title="Total Template"
            value={data.summary.total}
            description="Template transaksi global yang tersedia di platform."
          />
          <KpiCard
            title="Aktif"
            value={data.summary.active}
            description="Template yang dapat dipakai oleh BUMDes dan unit usaha."
          />
          <KpiCard
            title="Nonaktif / Draft"
            value={inactiveOrDraft}
            description="Template yang belum atau tidak sedang dipakai."
          />
        </ResponsiveGrid>

        <TemplateTransactionList templates={data.templates} />
      </div>
    </PageContainer>
  );
}
