import { db } from "@/lib/db/pool";
import type { PlatformTemplateStatus } from "@/lib/platform/get-platform-template-transaction-list";

export type PlatformTemplateInputField = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  account_prefix?: string;
  normal_balance?: "DEBIT" | "KREDIT";
};

export type PlatformTemplateRuleSide = "DEBIT" | "KREDIT";

export type PlatformTemplateRuleRow = {
  id: string;
  side: PlatformTemplateRuleSide;
  rule_label: string | null;
  account_source: "FIXED_CODE" | "INPUT_ACCOUNT" | "ACCOUNT_PREFIX";
  account_code: string | null;
  account_name: string | null;
  account_input_key: string | null;
  account_code_prefix: string | null;
  account_must_be_detail: boolean;
  amount_formula: string;
  urutan: number;
};

export type PlatformTemplateTransactionDetail = {
  id: string;
  kode: string;
  nama: string;
  user_facing_name: string;
  kategori: string;
  deskripsi: string | null;
  status: PlatformTemplateStatus;
  business_event_code: string | null;
  sumber_regulasi: string | null;
  versi: number;
  sort_order: number;
  is_system_template: boolean;
  input_schema: PlatformTemplateInputField[];
  created_at: string;
  updated_at: string;
  rules: PlatformTemplateRuleRow[];
};

type TemplateDetailRow = Omit<PlatformTemplateTransactionDetail, "rules">;

export async function getPlatformTemplateTransactionDetail(
  id: string
): Promise<PlatformTemplateTransactionDetail | null> {
  const [templateResult, rulesResult] = await Promise.all([
    db.query<TemplateDetailRow>(
      `
        SELECT
          id::text,
          kode,
          nama,
          user_facing_name,
          kategori,
          deskripsi,
          status::text AS status,
          business_event_code,
          sumber_regulasi,
          versi,
          sort_order,
          is_system_template,
          input_schema,
          created_at::text,
          updated_at::text
        FROM template_transaksi
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    ),
    db.query<PlatformTemplateRuleRow>(
      `
        SELECT
          tjr.id::text,
          tjr.side::text AS side,
          tjr.rule_label,
          tjr.account_source,
          tjr.account_code,
          akun.nama AS account_name,
          tjr.account_input_key,
          tjr.account_code_prefix,
          tjr.account_must_be_detail,
          tjr.amount_formula,
          tjr.urutan
        FROM template_jurnal_rule tjr
        LEFT JOIN akun
          ON akun.bum_desa_id IS NULL
          AND akun.kode = tjr.account_code
        WHERE tjr.template_transaksi_id = $1
        ORDER BY tjr.urutan ASC, tjr.created_at ASC
      `,
      [id]
    ),
  ]);

  const template = templateResult.rows[0];

  if (!template) {
    return null;
  }

  return {
    ...template,
    input_schema: template.input_schema ?? [],
    rules: rulesResult.rows,
  };
}
