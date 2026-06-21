import { Badge } from "@/components/ui/badge";
import type {
  PlatformTemplateInputField,
  PlatformTemplateRuleRow,
  PlatformTemplateRuleSide,
  PlatformTemplateTransactionDetail,
} from "@/lib/platform/get-platform-template-transaction-detail";
import type { PlatformTemplateStatus } from "@/lib/platform/get-platform-template-transaction-list";

type TemplateTransactionDetailViewProps = {
  template: PlatformTemplateTransactionDetail;
};

const templateDetailStyles = {
  root: "space-y-6",
  section: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
  sectionHeader: "mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between",
  sectionTitle: "text-base font-semibold text-slate-950",
  sectionDescription: "text-sm text-slate-500",
  metaGrid: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
  metaItem: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3",
  metaLabel: "text-xs font-medium uppercase tracking-wide text-slate-400",
  metaValue: "mt-1 text-sm font-semibold text-slate-800",
  description: "mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600",
  fieldList: "grid gap-3 md:grid-cols-2",
  fieldCard: "rounded-xl border border-slate-200 bg-white p-4",
  fieldHeader: "flex items-start justify-between gap-3",
  fieldTitle: "font-semibold text-slate-950",
  fieldKey: "mt-1 text-xs font-medium text-slate-400",
  fieldMeta: "mt-3 space-y-1 text-sm text-slate-600",
  ruleList: "space-y-3",
  ruleCard: "rounded-xl border border-slate-200 bg-white p-4",
  ruleHeader: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
  ruleTitle: "font-semibold text-slate-950",
  ruleMeta: "mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4",
  ruleMetaItem: "rounded-lg bg-slate-50 px-3 py-2",
  mutedText: "text-sm text-slate-500",
  smallLabel: "text-xs font-medium uppercase tracking-wide text-slate-400",
  smallValue: "mt-1 text-slate-700",
  emptyText: "rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500",
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

function getRuleSideBadge(side: PlatformTemplateRuleSide) {
  if (side === "DEBIT") {
    return <Badge variant="default">Debit</Badge>;
  }

  return <Badge variant="muted">Kredit</Badge>;
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

function formatRequired(value?: boolean) {
  return value ? "Wajib" : "Opsional";
}

function formatAccountSource(rule: PlatformTemplateRuleRow) {
  if (rule.account_source === "FIXED_CODE") {
    return `${rule.account_code ?? "-"} - ${rule.account_name ?? "Akun tetap"}`;
  }

  if (rule.account_source === "INPUT_ACCOUNT") {
    return `Dari field input: ${rule.account_input_key ?? "-"}`;
  }

  return `Prefix akun: ${rule.account_code_prefix ?? "-"}`;
}

function FieldCard({ field }: { field: PlatformTemplateInputField }) {
  return (
    <article className={templateDetailStyles.fieldCard}>
      <div className={templateDetailStyles.fieldHeader}>
        <div>
          <h3 className={templateDetailStyles.fieldTitle}>{field.label}</h3>
          <p className={templateDetailStyles.fieldKey}>{field.key}</p>
        </div>

        <Badge variant={field.required ? "warning" : "muted"}>
          {formatRequired(field.required)}
        </Badge>
      </div>

      <div className={templateDetailStyles.fieldMeta}>
        <p>Jenis input: {field.type}</p>
        <p>Prefix akun: {field.account_prefix ?? "-"}</p>
        <p>Normal saldo: {field.normal_balance ?? "-"}</p>
      </div>
    </article>
  );
}

function RuleCard({ rule }: { rule: PlatformTemplateRuleRow }) {
  return (
    <article className={templateDetailStyles.ruleCard}>
      <div className={templateDetailStyles.ruleHeader}>
        <div>
          <h3 className={templateDetailStyles.ruleTitle}>
            {rule.urutan}. {rule.rule_label ?? "Rule jurnal"}
          </h3>
          <p className={templateDetailStyles.mutedText}>
            {formatAccountSource(rule)}
          </p>
        </div>

        {getRuleSideBadge(rule.side)}
      </div>

      <div className={templateDetailStyles.ruleMeta}>
        <div className={templateDetailStyles.ruleMetaItem}>
          <p className={templateDetailStyles.smallLabel}>Sumber Akun</p>
          <p className={templateDetailStyles.smallValue}>{rule.account_source}</p>
        </div>

        <div className={templateDetailStyles.ruleMetaItem}>
          <p className={templateDetailStyles.smallLabel}>Formula Nominal</p>
          <p className={templateDetailStyles.smallValue}>{rule.amount_formula}</p>
        </div>

        <div className={templateDetailStyles.ruleMetaItem}>
          <p className={templateDetailStyles.smallLabel}>Harus Detail</p>
          <p className={templateDetailStyles.smallValue}>
            {rule.account_must_be_detail ? "Ya" : "Tidak"}
          </p>
        </div>

        <div className={templateDetailStyles.ruleMetaItem}>
          <p className={templateDetailStyles.smallLabel}>Urutan</p>
          <p className={templateDetailStyles.smallValue}>{rule.urutan}</p>
        </div>
      </div>
    </article>
  );
}

export function TemplateTransactionDetailView({
  template,
}: TemplateTransactionDetailViewProps) {
  return (
    <div className={templateDetailStyles.root}>
      <section className={templateDetailStyles.section}>
        <div className={templateDetailStyles.sectionHeader}>
          <div>
            <h2 className={templateDetailStyles.sectionTitle}>
              {template.kode} - {template.user_facing_name}
            </h2>
            <p className={templateDetailStyles.sectionDescription}>
              Template global untuk membentuk jurnal otomatis berdasarkan input pengguna.
            </p>
          </div>

          {getTemplateStatusBadge(template.status)}
        </div>

        <div className={templateDetailStyles.metaGrid}>
          <div className={templateDetailStyles.metaItem}>
            <p className={templateDetailStyles.metaLabel}>Kategori</p>
            <p className={templateDetailStyles.metaValue}>{template.kategori}</p>
          </div>

          <div className={templateDetailStyles.metaItem}>
            <p className={templateDetailStyles.metaLabel}>Kode Event</p>
            <p className={templateDetailStyles.metaValue}>
              {template.business_event_code ?? "-"}
            </p>
          </div>

          <div className={templateDetailStyles.metaItem}>
            <p className={templateDetailStyles.metaLabel}>Sumber Regulasi</p>
            <p className={templateDetailStyles.metaValue}>
              {template.sumber_regulasi ?? "-"}
            </p>
          </div>

          <div className={templateDetailStyles.metaItem}>
            <p className={templateDetailStyles.metaLabel}>Versi</p>
            <p className={templateDetailStyles.metaValue}>v{template.versi}</p>
          </div>

          <div className={templateDetailStyles.metaItem}>
            <p className={templateDetailStyles.metaLabel}>Urutan</p>
            <p className={templateDetailStyles.metaValue}>{template.sort_order}</p>
          </div>

          <div className={templateDetailStyles.metaItem}>
            <p className={templateDetailStyles.metaLabel}>Template Sistem</p>
            <p className={templateDetailStyles.metaValue}>
              {template.is_system_template ? "Ya" : "Tidak"}
            </p>
          </div>

          <div className={templateDetailStyles.metaItem}>
            <p className={templateDetailStyles.metaLabel}>Dibuat</p>
            <p className={templateDetailStyles.metaValue}>
              {formatDate(template.created_at)}
            </p>
          </div>

          <div className={templateDetailStyles.metaItem}>
            <p className={templateDetailStyles.metaLabel}>Diubah</p>
            <p className={templateDetailStyles.metaValue}>
              {formatDate(template.updated_at)}
            </p>
          </div>
        </div>

        <p className={templateDetailStyles.description}>
          {template.deskripsi ?? "Deskripsi template belum diisi."}
        </p>
      </section>

      <section className={templateDetailStyles.section}>
        <div className={templateDetailStyles.sectionHeader}>
          <div>
            <h2 className={templateDetailStyles.sectionTitle}>
              Field Input Operator
            </h2>
            <p className={templateDetailStyles.sectionDescription}>
              Field ini akan menjadi dasar form sederhana di menu Catat Transaksi.
            </p>
          </div>

          <Badge variant="muted">{template.input_schema.length} field</Badge>
        </div>

        {template.input_schema.length > 0 ? (
          <div className={templateDetailStyles.fieldList}>
            {template.input_schema.map((field) => (
              <FieldCard key={field.key} field={field} />
            ))}
          </div>
        ) : (
          <p className={templateDetailStyles.emptyText}>
            Belum ada field input untuk template ini.
          </p>
        )}
      </section>

      <section className={templateDetailStyles.section}>
        <div className={templateDetailStyles.sectionHeader}>
          <div>
            <h2 className={templateDetailStyles.sectionTitle}>
              Rule Jurnal Backend
            </h2>
            <p className={templateDetailStyles.sectionDescription}>
              Bagian ini hanya untuk Super Admin Platform. Operator tidak melihat debit dan kredit.
            </p>
          </div>

          <Badge variant="muted">{template.rules.length} rule</Badge>
        </div>

        {template.rules.length > 0 ? (
          <div className={templateDetailStyles.ruleList}>
            {template.rules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
          </div>
        ) : (
          <p className={templateDetailStyles.emptyText}>
            Belum ada rule jurnal untuk template ini.
          </p>
        )}
      </section>
    </div>
  );
}

