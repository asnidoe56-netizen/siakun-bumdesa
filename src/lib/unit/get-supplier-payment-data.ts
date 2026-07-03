import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type SupplierPayableOption = {
  payableId: string;
  payableCode: string;
  supplierId: string;
  supplierName: string;
  purchaseCode: string;
  payableDate: string;
  dueDate: string | null;
  originalAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  status: string;
  payableAccountCode: string;
};

export type SupplierPaymentHistoryItem = {
  paymentId: string;
  paymentCode: string;
  paymentDate: string;
  supplierName: string;
  paymentMethod: string;
  totalPaymentAmount: string;
  status: string;
  journalNumber: string | null;
  lineCount: number;
};

type SupplierPayableOptionRow = {
  payable_id: string;
  payable_code: string;
  supplier_id: string;
  supplier_name: string;
  purchase_code: string;
  payable_date: string;
  due_date: string | null;
  original_amount: string;
  paid_amount: string;
  outstanding_amount: string;
  status: string;
  payable_account_code: string;
};

type SupplierPaymentHistoryRow = {
  payment_id: string;
  payment_code: string;
  payment_date: string;
  supplier_name: string;
  payment_method: string;
  total_payment_amount: string;
  status: string;
  journal_number: string | null;
  line_count: number;
};

export async function getOpenSupplierPayableOptions(
  context: UnitWorkContext
): Promise<SupplierPayableOption[]> {
  const result = await db.query<SupplierPayableOptionRow>(
    `
      SELECT
        sp.id::text AS payable_id,
        sp.code AS payable_code,
        sp.supplier_id::text AS supplier_id,
        s.name AS supplier_name,
        mp.code AS purchase_code,
        sp.payable_date::text AS payable_date,
        sp.due_date::text AS due_date,
        sp.original_amount::text AS original_amount,
        sp.paid_amount::text AS paid_amount,
        sp.outstanding_amount::text AS outstanding_amount,
        sp.status,
        sp.payable_account_code
      FROM supplier_payable sp
      JOIN supplier s
        ON s.id = sp.supplier_id
      JOIN material_purchase mp
        ON mp.id = sp.purchase_id
      WHERE sp.bum_desa_id = $1::uuid
        AND sp.unit_usaha_id = $2::uuid
        AND sp.status IN ('UNPAID', 'PARTIAL')
        AND sp.outstanding_amount > 0
      ORDER BY sp.payable_date ASC, sp.created_at ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    payableId: row.payable_id,
    payableCode: row.payable_code,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    purchaseCode: row.purchase_code,
    payableDate: row.payable_date,
    dueDate: row.due_date,
    originalAmount: row.original_amount,
    paidAmount: row.paid_amount,
    outstandingAmount: row.outstanding_amount,
    status: row.status,
    payableAccountCode: row.payable_account_code,
  }));
}

export async function getSupplierPaymentHistoryList(
  context: UnitWorkContext
): Promise<SupplierPaymentHistoryItem[]> {
  const result = await db.query<SupplierPaymentHistoryRow>(
    `
      SELECT
        spm.id::text AS payment_id,
        spm.code AS payment_code,
        spm.payment_date::text AS payment_date,
        s.name AS supplier_name,
        spm.payment_method,
        spm.total_payment_amount::text AS total_payment_amount,
        spm.status,
        jh.nomor_jurnal AS journal_number,
        COUNT(spl.id)::int AS line_count
      FROM supplier_payment spm
      JOIN supplier s
        ON s.id = spm.supplier_id
      LEFT JOIN supplier_payment_line spl
        ON spl.supplier_payment_id = spm.id
      LEFT JOIN journal_header jh
        ON jh.id = spm.journal_header_id
      WHERE spm.bum_desa_id = $1::uuid
        AND spm.unit_usaha_id = $2::uuid
      GROUP BY
        spm.id,
        spm.code,
        spm.payment_date,
        s.name,
        spm.payment_method,
        spm.total_payment_amount,
        spm.status,
        jh.nomor_jurnal
      ORDER BY spm.payment_date DESC, spm.created_at DESC
      LIMIT 30
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    paymentId: row.payment_id,
    paymentCode: row.payment_code,
    paymentDate: row.payment_date,
    supplierName: row.supplier_name,
    paymentMethod: row.payment_method,
    totalPaymentAmount: row.total_payment_amount,
    status: row.status,
    journalNumber: row.journal_number,
    lineCount: row.line_count,
  }));
}