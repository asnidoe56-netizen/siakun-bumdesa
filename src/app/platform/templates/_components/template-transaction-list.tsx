import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  PlatformTemplateStatus,
  PlatformTemplateTransactionRow,
} from "@/lib/platform/get-platform-template-transaction-list";

type TemplateTransactionListProps = {
  templates: PlatformTemplateTransactionRow[];
};

const templateTransactionListStyles = {
  root: "space-y-3",
  mobileList: "space-y-3 lg:hidden",
  desktopList:
    "hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block",
  desktopHeader:
    "grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
  desktopRow:
    "grid grid-cols-12 gap-4 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0 hover:bg-slate-50",
  columns: {
    no: "col-span-1",
    code: "col-span-2",
    template: "col-span-3",
    category: "col-span-2",
    status: "col-span-1",
    field: "col-span-1",
    rule: "col-span-1",
    action: "col-span-1",
  },
  card: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
  cardHeader: "flex items-start justify-between gap-3",
  code: "text-xs font-medium uppercase tracking-wide text-slate-400",
  primaryText: "font-semibold text-slate-950",
  secondaryText: "mt-1 text-sm text-slate-500",
  mutedText: "text-sm text-slate-500",
  number: "text-sm font-semibold text-slate-400",
  metaGrid: "mt-4 grid gap-3 text-sm sm:grid-cols-2",
  metaLabel: "text-xs font-medium uppercase tracking-wide text-slate-400",
  metaValue: "mt-1 text-slate-700",
  ruleSummary:
    "mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600",
  detailLink:
    "inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950",
  mobileDetailLink:
    "mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950",
  empty: "rounded-2xl border border-dashed border-slate-300 bg-white p-6",
};

function getTemplateStatusBadge(status: PlatformTemplateStatus) {
  if (status === "ACTIVE") {
    return <Badge variant="success">Aktif</Badge>;
  }

  if (status === "DRAFT") {
    return <Badge variant="warning">Draft</Badge>;
  }

  if (status === "DEPRECATED") {
    return <Badge variant="danger">Deprecated</Badge>;
  }

  return <Badge variant="muted">Nonaktif</Badge>;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function TemplateTransactionList({
  templates,
}: TemplateTransactionListProps) {
  if (templates.length === 0) {
    return (
      <div className={templateTransactionListStyles.empty}>
        <EmptyState
          title="Belum ada template transaksi"
          description="Template transaksi global akan tampil di sini setelah data tersedia di database."
        />
      </div>
    );
  }

  return (
    <div className={templateTransactionListStyles.root}>
      <div className={templateTransactionListStyles.mobileList}>
        {templates.map((template) => (
          <article
            key={template.id}
            className={templateTransactionListStyles.card}
          >
            <div className={templateTransactionListStyles.cardHeader}>
              <div>
                <p className={templateTransactionListStyles.code}>
                  No. {template.nomor} - {template.kode}
                </p>
                <h2 className={templateTransactionListStyles.primaryText}>
                  {template.user_facing_name}
                </h2>
                <p className={templateTransactionListStyles.secondaryText}>
                  {template.kategori}
                </p>
              </div>

              {getTemplateStatusBadge(template.status)}
            </div>

            <div className={templateTransactionListStyles.metaGrid}>
              <div>
                <p className={templateTransactionListStyles.metaLabel}>
                  Kode Event
                </p>
                <p className={templateTransactionListStyles.metaValue}>
                  {template.business_event_code || "-"}
                </p>
              </div>

              <div>
                <p className={templateTransactionListStyles.metaLabel}>Versi</p>
                <p className={templateTransactionListStyles.metaValue}>
                  v{template.versi}
                </p>
              </div>

              <div>
                <p className={templateTransactionListStyles.metaLabel}>
                  Sumber Regulasi
                </p>
                <p className={templateTransactionListStyles.metaValue}>
                  {template.sumber_regulasi || "-"}
                </p>
              </div>

              <div>
                <p className={templateTransactionListStyles.metaLabel}>
                  Update Terakhir
                </p>
                <p className={templateTransactionListStyles.metaValue}>
                  {formatDate(template.updated_at)}
                </p>
              </div>
            </div>

            <p className={templateTransactionListStyles.ruleSummary}>
              {template.input_field_count} field input - {template.rule_count} rule
              jurnal
            </p>

            <Link
              href={`/platform/templates/${template.id}`}
              className={templateTransactionListStyles.mobileDetailLink}
            >
              Lihat Detail
            </Link>
          </article>
        ))}
      </div>

      <div className={templateTransactionListStyles.desktopList}>
        <div className={templateTransactionListStyles.desktopHeader}>
          <span className={templateTransactionListStyles.columns.no}>No</span>
          <span className={templateTransactionListStyles.columns.code}>Kode</span>
          <span className={templateTransactionListStyles.columns.template}>
            Template
          </span>
          <span className={templateTransactionListStyles.columns.category}>
            Kategori
          </span>
          <span className={templateTransactionListStyles.columns.status}>
            Status
          </span>
          <span className={templateTransactionListStyles.columns.field}>
            Field
          </span>
          <span className={templateTransactionListStyles.columns.rule}>Rule</span>
          <span className={templateTransactionListStyles.columns.action}>
            Aksi
          </span>
        </div>

        {templates.map((template) => (
          <div
            key={template.id}
            className={templateTransactionListStyles.desktopRow}
          >
            <p
              className={`${templateTransactionListStyles.columns.no} ${templateTransactionListStyles.number}`}
            >
              {template.nomor}
            </p>

            <div className={templateTransactionListStyles.columns.code}>
              <p className={templateTransactionListStyles.primaryText}>
                {template.kode}
              </p>
              <p className={templateTransactionListStyles.secondaryText}>
                {template.business_event_code || "-"}
              </p>
            </div>

            <div className={templateTransactionListStyles.columns.template}>
              <p className={templateTransactionListStyles.primaryText}>
                {template.user_facing_name}
              </p>
              <p className={templateTransactionListStyles.secondaryText}>
                {template.sumber_regulasi || "Sumber regulasi belum diisi"}
              </p>
            </div>

            <p
              className={`${templateTransactionListStyles.columns.category} ${templateTransactionListStyles.mutedText}`}
            >
              {template.kategori}
            </p>

            <div className={templateTransactionListStyles.columns.status}>
              {getTemplateStatusBadge(template.status)}
            </div>

            <p
              className={`${templateTransactionListStyles.columns.field} ${templateTransactionListStyles.mutedText}`}
            >
              {template.input_field_count}
            </p>

            <p
              className={`${templateTransactionListStyles.columns.rule} ${templateTransactionListStyles.mutedText}`}
            >
              {template.rule_count}
            </p>

            <div className={templateTransactionListStyles.columns.action}>
              <Link
                href={`/platform/templates/${template.id}`}
                className={templateTransactionListStyles.detailLink}
              >
                Detail
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}