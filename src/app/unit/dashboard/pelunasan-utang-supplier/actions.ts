"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postTemplateTransaction } from "@/lib/accounting/post-template-transaction";
import { db } from "@/lib/db/pool";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";
import { assertProductionFinishedGoodsContext } from "@/lib/unit/unit-context-guards";

type SupplierPayableRow = {
  payable_id: string;
  payable_code: string;
  supplier_id: string;
  supplier_name: string;
  purchase_id: string;
  purchase_code: string;
  original_amount: string;
  paid_amount: string;
  outstanding_amount: string;
  status: string;
  payable_account_code: string;
};

function getRequiredString(value: FormDataEntryValue | null, fieldName: string) {
  const cleanValue = value?.toString().trim();

  if (!cleanValue) {
    throw new Error(`${fieldName} wajib diisi.`);
  }

  return cleanValue;
}

function getOptionalString(value: FormDataEntryValue | null) {
  const cleanValue = value?.toString().trim();
  return cleanValue ? cleanValue : null;
}

function getPositiveNumber(value: FormDataEntryValue | null, fieldName: string) {
  const cleanValue = getRequiredString(value, fieldName);
  const numberValue = Number(cleanValue);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(`${fieldName} harus lebih besar dari 0.`);
  }

  return numberValue;
}

function getPaymentDate(value: FormDataEntryValue | null) {
  const cleanValue = value?.toString().trim();

  if (!cleanValue) {
    return new Date().toISOString().slice(0, 10);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    throw new Error("Tanggal pembayaran tidak valid.");
  }

  return cleanValue;
}

function createSupplierPaymentCode(paymentDate: string) {
  const datePart = paymentDate.replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

  return `SP-${datePart}-${suffix}`;
}

function toMoneyText(value: number) {
  return value.toFixed(2);
}

function toDecimalText(value: number) {
  return value.toFixed(6);
}

export async function createSupplierPaymentAction(formData: FormData) {
  const context = await getUnitWorkContext();

  assertProductionFinishedGoodsContext(context, "Pelunasan utang supplier");

  const payableId = getRequiredString(formData.get("payableId"), "Utang");
  const paymentDate = getPaymentDate(formData.get("paymentDate"));
  const paymentAmount = getPositiveNumber(
    formData.get("paymentAmount"),
    "Jumlah pembayaran"
  );
  const notes = getOptionalString(formData.get("notes"));

  const cashAccountCode = "1.1.01.01";
  const paymentMethod = "CASH";
  const paymentId = randomUUID();
  const paymentLineId = randomUUID();
  const paymentCode = createSupplierPaymentCode(paymentDate);
  const createdPaymentCode = paymentCode;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const payableResult = await client.query<SupplierPayableRow>(
      `
        SELECT
          sp.id::text AS payable_id,
          sp.code AS payable_code,
          sp.supplier_id::text AS supplier_id,
          s.name AS supplier_name,
          sp.purchase_id::text AS purchase_id,
          mp.code AS purchase_code,
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
        WHERE sp.id = $1::uuid
          AND sp.bum_desa_id = $2::uuid
          AND sp.unit_usaha_id = $3::uuid
          AND sp.status IN ('UNPAID', 'PARTIAL')
        FOR UPDATE OF sp
      `,
      [payableId, context.bumDesaId, context.unitUsahaId]
    );

    const payable = payableResult.rows[0];

    if (!payable) {
      throw new Error("Utang supplier tidak ditemukan atau sudah lunas.");
    }

    const outstandingAmount = Number(payable.outstanding_amount);
    const paidAmount = Number(payable.paid_amount);

    if (!Number.isFinite(outstandingAmount) || outstandingAmount <= 0) {
      throw new Error("Sisa utang tidak valid atau sudah lunas.");
    }

    if (paymentAmount > outstandingAmount) {
      throw new Error(
        `Jumlah pembayaran melebihi sisa utang. Sisa utang Rp${outstandingAmount.toLocaleString(
          "id-ID"
        )}.`
      );
    }

    const cashBalanceResult = await client.query<{ balance: string }>(
      `
        SELECT
          COALESCE(SUM(jl.debit - jl.kredit), 0)::text AS balance
        FROM journal_line jl
        JOIN journal_header jh
          ON jh.id = jl.journal_header_id
        JOIN akun a
          ON a.id = jl.akun_id
        WHERE jh.bum_desa_id = $1::uuid
          AND jl.unit_usaha_id = $2::uuid
          AND jh.status = 'POSTED'
          AND a.kode = $3
      `,
      [context.bumDesaId, context.unitUsahaId, cashAccountCode]
    );

    const cashBalance = Number(cashBalanceResult.rows[0]?.balance ?? 0);

    if (!Number.isFinite(cashBalance) || cashBalance < paymentAmount) {
      throw new Error(
        `Saldo Kas Tunai tidak cukup. Saldo saat ini Rp${cashBalance.toLocaleString(
          "id-ID"
        )}, kebutuhan Rp${paymentAmount.toLocaleString("id-ID")}.`
      );
    }

    const newPaidAmount = paidAmount + paymentAmount;
    const newOutstandingAmount = outstandingAmount - paymentAmount;
    const newPayableStatus = newOutstandingAmount <= 0 ? "PAID" : "PARTIAL";
    const newPurchasePaymentStatus =
      newOutstandingAmount <= 0 ? "PAID" : "PARTIAL";

    await client.query(
      `
        INSERT INTO supplier_payment (
          id,
          bum_desa_id,
          unit_usaha_id,
          supplier_id,
          code,
          payment_date,
          payment_method,
          cash_account_code,
          total_payment_amount,
          notes,
          status,
          metadata
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5,
          $6::date,
          $7,
          $8,
          $9,
          $10,
          'POSTED',
          jsonb_build_object(
            'created_from', 'supplier_payment_action',
            'payable_id', $11::text,
            'payable_code', $12::text,
            'purchase_code', $13::text,
            'supplier_name', $14::text
          )
        )
      `,
      [
        paymentId,
        context.bumDesaId,
        context.unitUsahaId,
        payable.supplier_id,
        paymentCode,
        paymentDate,
        paymentMethod,
        cashAccountCode,
        toDecimalText(paymentAmount),
        notes,
        payable.payable_id,
        payable.payable_code,
        payable.purchase_code,
        payable.supplier_name,
      ]
    );

    await client.query(
      `
        INSERT INTO supplier_payment_line (
          id,
          supplier_payment_id,
          supplier_payable_id,
          bum_desa_id,
          unit_usaha_id,
          line_number,
          payment_amount,
          notes,
          metadata
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5::uuid,
          1,
          $6,
          $7,
          jsonb_build_object(
            'payable_code', $8::text,
            'purchase_code', $9::text
          )
        )
      `,
      [
        paymentLineId,
        paymentId,
        payable.payable_id,
        context.bumDesaId,
        context.unitUsahaId,
        toDecimalText(paymentAmount),
        notes,
        payable.payable_code,
        payable.purchase_code,
      ]
    );

    await client.query(
      `
        UPDATE supplier_payable
        SET
          paid_amount = $1,
          outstanding_amount = $2,
          status = $3,
          updated_at = now(),
          metadata = metadata || jsonb_build_object(
            'last_payment_code', $4::text,
            'last_payment_date', $5::text
          )
        WHERE id = $6::uuid
      `,
      [
        toDecimalText(newPaidAmount),
        toDecimalText(Math.max(newOutstandingAmount, 0)),
        newPayableStatus,
        paymentCode,
        paymentDate,
        payable.payable_id,
      ]
    );

    await client.query(
      `
        UPDATE material_purchase
        SET
          payment_status = $1,
          updated_at = now(),
          metadata = metadata || jsonb_build_object(
            'last_supplier_payment_code', $2::text
          )
        WHERE id = $3::uuid
      `,
      [newPurchasePaymentStatus, paymentCode, payable.purchase_id]
    );

    const journalResult = await postTemplateTransaction(
      {
        bumDesaId: context.bumDesaId,
        unitUsahaId: context.unitUsahaId,
        templateCode: "T08",
        tanggal: paymentDate,
        payload: {
          nominal: toMoneyText(paymentAmount),
          debt_account_code: payable.payable_account_code,
          cash_or_bank_account_code: cashAccountCode,
          keterangan: `Pelunasan utang supplier ${payable.payable_code}`,
        },
        createdBy: context.userId,
        keterangan: `Pelunasan utang supplier ${paymentCode}`,
      },
      client
    );

    await client.query(
      `
        UPDATE supplier_payment
        SET
          journal_header_id = $1::uuid,
          metadata = metadata || jsonb_build_object(
            'journal_number', $2::text
          )
        WHERE id = $3::uuid
      `,
      [journalResult.journalHeaderId, journalResult.nomorJurnal, paymentId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/unit/dashboard/pelunasan-utang-supplier");
  revalidatePath("/unit/dashboard/pembelian-bahan");

  redirect(
    `/unit/dashboard/pelunasan-utang-supplier?created=${encodeURIComponent(
      createdPaymentCode
    )}`
  );
}