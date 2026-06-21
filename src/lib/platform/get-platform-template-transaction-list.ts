import { db } from "@/lib/db/pool";

export type PlatformTemplateStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "DEPRECATED";

export type PlatformTemplateTransactionRow = {
  nomor: number;
  id: string;
  kode: string;
  nama: string;
  user_facing_name: string;
  kategori: string;
  status: PlatformTemplateStatus;
  business_event_code: string | null;
  sumber_regulasi: string | null;
  versi: number;
  sort_order: number;
  input_field_count: number;
  rule_count: number;
  is_system_template: boolean;
  updated_at: string;
};

export type PlatformTemplateTransactionSummary = {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  deprecated: number;
};

export type PlatformTemplateTransactionListData = {
  summary: PlatformTemplateTransactionSummary;
  templates: PlatformTemplateTransactionRow[];
};

const INITIAL_TEMPLATE_LIMIT = 50;

export async function getPlatformTemplateTransactionList(): Promise<PlatformTemplateTransactionListData> {
  const [listResult, summaryResult] = await Promise.all([
    db.query<PlatformTemplateTransactionRow>(
      `
        SELECT
          ROW_NUMBER() OVER (ORDER BY sort_order ASC, kode ASC)::int AS nomor,
          tt.id::text,
          tt.kode,
          tt.nama,
          tt.user_facing_name,
          tt.kategori,
          tt.status::text AS status,
          tt.business_event_code,
          tt.sumber_regulasi,
          tt.versi,
          tt.sort_order,
          COALESCE(jsonb_array_length(tt.input_schema), 0)::int AS input_field_count,
          COUNT(tjr.id)::int AS rule_count,
          tt.is_system_template,
          tt.updated_at::text
        FROM template_transaksi tt
        LEFT JOIN template_jurnal_rule tjr
          ON tjr.template_transaksi_id = tt.id
        GROUP BY tt.id
        ORDER BY tt.sort_order ASC, tt.kode ASC
        LIMIT $1
      `,
      [INITIAL_TEMPLATE_LIMIT]
    ),
    db.query<{
      total: string;
      active: string;
      inactive: string;
      draft: string;
      deprecated: string;
    }>(
      `
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE')::text AS active,
          COUNT(*) FILTER (WHERE status = 'INACTIVE')::text AS inactive,
          COUNT(*) FILTER (WHERE status = 'DRAFT')::text AS draft,
          COUNT(*) FILTER (WHERE status = 'DEPRECATED')::text AS deprecated
        FROM template_transaksi
      `
    ),
  ]);

  const summary = summaryResult.rows[0];

  return {
    summary: {
      total: Number(summary?.total ?? 0),
      active: Number(summary?.active ?? 0),
      inactive: Number(summary?.inactive ?? 0),
      draft: Number(summary?.draft ?? 0),
      deprecated: Number(summary?.deprecated ?? 0),
    },
    templates: listResult.rows,
  };
}
