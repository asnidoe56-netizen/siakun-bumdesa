import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

type UnitContextBlockerProps = {
  context: UnitWorkContext;
  title: string;
  description: string;
  expectedContext: string;
};

const blockerStyles = {
  content: "mt-6 max-w-3xl space-y-6",
  backLink:
    "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950",
  backIcon: "h-4 w-4",
  iconWrap:
    "flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700",
  icon: "h-5 w-5",
  text: "text-sm leading-6 text-slate-600",
  detailGrid: "grid gap-3 sm:grid-cols-2",
  detailItem: "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2",
  detailLabel: "text-xs font-medium uppercase tracking-wide text-slate-500",
  detailValue: "mt-1 break-words font-semibold text-slate-900",
};

export function UnitContextBlocker({
  context,
  title,
  description,
  expectedContext,
}: UnitContextBlockerProps) {
  return (
    <PageContainer>
      <Link href="/unit/dashboard" className={blockerStyles.backLink}>
        <ArrowLeft className={blockerStyles.backIcon} />
        Kembali ke Dashboard
      </Link>

      <PageHeader title={title} description={description} />

      <div className={blockerStyles.content}>
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className={blockerStyles.iconWrap}>
                <AlertTriangle className={blockerStyles.icon} />
              </div>
              <div>
                <CardTitle>Konteks kerja tidak sesuai</CardTitle>
                <p className={blockerStyles.text}>
                  Halaman ini hanya tersedia untuk {expectedContext}. Saat ini
                  sistem membaca Anda berada pada konteks {context.unitTypeLabel}.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={blockerStyles.detailGrid}>
              <div className={blockerStyles.detailItem}>
                <p className={blockerStyles.detailLabel}>BUMDes</p>
                <p className={blockerStyles.detailValue}>{context.bumDesaName}</p>
              </div>

              <div className={blockerStyles.detailItem}>
                <p className={blockerStyles.detailLabel}>Unit Aktif</p>
                <p className={blockerStyles.detailValue}>
                  {context.unitUsahaName}
                </p>
              </div>

              <div className={blockerStyles.detailItem}>
                <p className={blockerStyles.detailLabel}>Kode Unit</p>
                <p className={blockerStyles.detailValue}>{context.unitCode}</p>
              </div>

              <div className={blockerStyles.detailItem}>
                <p className={blockerStyles.detailLabel}>Kategori</p>
                <p className={blockerStyles.detailValue}>
                  {context.businessCategoryName ?? "Belum diatur"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}