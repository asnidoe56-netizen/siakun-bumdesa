import { db } from "@/lib/db/pool";
import type { PoolClient } from "pg";

export type PostTemplateTransactionInput = {
  bumDesaId: string;
  unitUsahaId: string;
  templateCode: string;
  tanggal: string;
  payload: Record<string, unknown>;
  createdBy?: string | null;
  keterangan?: string | null;
};

export type PostTemplateTransactionResult = {
  journalHeaderId: string;
  nomorJurnal: string;
};

type PostTemplateTransactionRow = {
  journal_header_id: string;
  nomor_jurnal: string;
};

function requireNonEmpty(value: string | null | undefined, fieldName: string) {
  const cleanValue = value?.trim();

  if (!cleanValue) {
    throw new Error(`${fieldName} wajib diisi.`);
  }

  return cleanValue;
}

export async function postTemplateTransaction(
  input: PostTemplateTransactionInput,
  client?: PoolClient
): Promise<PostTemplateTransactionResult> {
  const bumDesaId = requireNonEmpty(input.bumDesaId, "BUMDes");
  const unitUsahaId = requireNonEmpty(input.unitUsahaId, "Unit usaha");
  const templateCode = requireNonEmpty(input.templateCode, "Template transaksi");
  const tanggal = requireNonEmpty(input.tanggal, "Tanggal transaksi");

  const queryExecutor = client ?? db;

  const result = await queryExecutor.query<PostTemplateTransactionRow>(
    `
      SELECT
        journal_header_id::text,
        nomor_jurnal
      FROM post_template_transaction(
        $1::uuid,
        $2::uuid,
        $3::text,
        $4::date,
        $5::jsonb,
        $6::uuid,
        $7::text
      )
    `,
    [
      bumDesaId,
      unitUsahaId,
      templateCode,
      tanggal,
      JSON.stringify(input.payload ?? {}),
      input.createdBy ?? null,
      input.keterangan ?? null,
    ]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("Journal Engine tidak mengembalikan hasil posting.");
  }

  return {
    journalHeaderId: row.journal_header_id,
    nomorJurnal: row.nomor_jurnal,
  };
}