import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { TemplateTransactionDetailView } from "@/app/platform/templates/_components/template-transaction-detail-view";
import { getPlatformTemplateTransactionDetail } from "@/lib/platform/get-platform-template-transaction-detail";

export const dynamic = "force-dynamic";

type PlatformTemplateDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const templateDetailPageStyles = {
  content: "mt-6 space-y-6",
  backLink:
    "inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-950",
};

export default async function PlatformTemplateDetailPage({
  params,
}: PlatformTemplateDetailPageProps) {
  const { id } = await params;
  const template = await getPlatformTemplateTransactionDetail(id);

  if (!template) {
    notFound();
  }

  return (
    <PageContainer>
      <Link href="/platform/templates" className={templateDetailPageStyles.backLink}>
        Kembali ke Template Transaksi
      </Link>

      <div className={templateDetailPageStyles.content}>
        <PageHeader
          title={`${template.kode} - ${template.user_facing_name}`}
          description="Detail template transaksi global, field input operator, dan rule jurnal backend."
        />

        <TemplateTransactionDetailView template={template} />
      </div>
    </PageContainer>
  );
}