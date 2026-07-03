"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postTemplateTransaction } from "@/lib/accounting/post-template-transaction";
import { db } from "@/lib/db/pool";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";
import { assertProductionFinishedGoodsContext } from "@/lib/unit/unit-context-guards";

type MaterialPurchaseMaterialRow = {
  material_id: string;
  material_code: string;
  material_name: string;
  material_type: string;
  unit_of_measure: string;
};

type SupplierOptionRow = {
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
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

function getPurchaseDate(value: FormDataEntryValue | null) {
  const cleanValue = value?.toString().trim();

  if (!cleanValue) {
    return new Date().toISOString().slice(0, 10);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    throw new Error("Tanggal pembelian tidak valid.");
  }

  return cleanValue;
}

function getPaymentMethod(value: FormDataEntryValue | null) {
  const cleanValue = getRequiredString(value, "Metode pembayaran");

  if (cleanValue !== "CASH" && cleanValue !== "CREDIT") {
    throw new Error("Metode pembayaran tidak valid.");
  }

  return cleanValue;
}

function createSupplierCode() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

  return `SUP-${datePart}-${suffix}`;
}

function createPurchaseCode(purchaseDate: string) {
  const datePart = purchaseDate.replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

  return `PB-${datePart}-${suffix}`;
}

function createPayableCode(purchaseDate: string) {
  const datePart = purchaseDate.replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

  return `AP-${datePart}-${suffix}`;
}

function toMoneyText(value: number) {
  return value.toFixed(2);
}

function toDecimalText(value: number, fractionDigits = 6) {
  return value.toFixed(fractionDigits);
}

export async function createMaterialPurchaseAction(formData: FormData) {
  const context = await getUnitWorkContext();

  assertProductionFinishedGoodsContext(context, "Pembelian bahan produksi");

  const materialId = getRequiredString(formData.get("materialId"), "Bahan");
  const existingSupplierId = getOptionalString(formData.get("supplierId"));
  const newSupplierName = getOptionalString(formData.get("newSupplierName"));
  const newSupplierContactPerson = getOptionalString(
    formData.get("newSupplierContactPerson")
  );
  const newSupplierPhone = getOptionalString(formData.get("newSupplierPhone"));
  const newSupplierAddress = getOptionalString(
    formData.get("newSupplierAddress")
  );

  const purchaseDate = getPurchaseDate(formData.get("purchaseDate"));
  const invoiceNumber = getOptionalString(formData.get("invoiceNumber"));
  const notes = getOptionalString(formData.get("notes"));
  const paymentMethod = getPaymentMethod(formData.get("paymentMethod"));
  const quantity = getPositiveNumber(formData.get("quantity"), "Jumlah dibeli");
  const unitCost = getPositiveNumber(formData.get("unitCost"), "Harga satuan");

  if (!existingSupplierId && !newSupplierName) {
    throw new Error("Pilih supplier atau isi nama supplier baru.");
  }

  const inventoryAccountCode = "1.1.05.02";
  const cashAccountCode = "1.1.01.01";
  const payableAccountCode = "2.1.01.01";

  const paymentStatus = paymentMethod === "CASH" ? "PAID" : "UNPAID";
  const templateCode = paymentMethod === "CASH" ? "T21" : "T22";

  const totalPurchaseAmount = quantity * unitCost;

  if (!Number.isFinite(totalPurchaseAmount) || totalPurchaseAmount <= 0) {
    throw new Error("Nilai pembelian tidak valid.");
  }

  const purchaseId = randomUUID();
  const purchaseLineId = randomUUID();
  const stockMovementId = randomUUID();
  const purchaseCode = createPurchaseCode(purchaseDate);
  const createdPurchaseCode = purchaseCode;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))",
      [materialId]
    );

    const materialResult = await client.query<MaterialPurchaseMaterialRow>(
      `
        SELECT
          pm.id::text AS material_id,
          pm.code AS material_code,
          pm.name AS material_name,
          pm.material_type,
          pm.unit_of_measure
        FROM production_material pm
        WHERE pm.id = $1::uuid
          AND pm.bum_desa_id = $2::uuid
          AND pm.unit_usaha_id = $3::uuid
          AND pm.is_active = TRUE
        LIMIT 1
      `,
      [materialId, context.bumDesaId, context.unitUsahaId]
    );

    const material = materialResult.rows[0];

    if (!material) {
      throw new Error("Bahan produksi tidak ditemukan atau tidak aktif.");
    }

    let supplierId = existingSupplierId;
    let supplierNameForMetadata = newSupplierName;

    if (supplierId) {
      const supplierResult = await client.query<SupplierOptionRow>(
        `
          SELECT
            s.id::text AS supplier_id,
            s.code AS supplier_code,
            s.name AS supplier_name
          FROM supplier s
          WHERE s.id = $1::uuid
            AND s.bum_desa_id = $2::uuid
            AND s.unit_usaha_id = $3::uuid
            AND s.is_active = TRUE
          LIMIT 1
        `,
        [supplierId, context.bumDesaId, context.unitUsahaId]
      );

      const supplier = supplierResult.rows[0];

      if (!supplier) {
        throw new Error("Supplier tidak ditemukan atau tidak aktif.");
      }

      supplierNameForMetadata = supplier.supplier_name;
    } else {
      supplierId = randomUUID();

      await client.query(
        `
          INSERT INTO supplier (
            id,
            bum_desa_id,
            unit_usaha_id,
            code,
            name,
            contact_person,
            phone,
            address,
            notes,
            metadata
          )
          VALUES (
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            jsonb_build_object(
              'created_from', 'material_purchase_action'
            )
          )
        `,
        [
          supplierId,
          context.bumDesaId,
          context.unitUsahaId,
          createSupplierCode(),
          newSupplierName,
          newSupplierContactPerson,
          newSupplierPhone,
          newSupplierAddress,
          "Supplier dibuat otomatis dari form pembelian bahan.",
        ]
      );

      supplierNameForMetadata = newSupplierName;
    }

    await client.query(
      `
        INSERT INTO material_purchase (
          id,
          bum_desa_id,
          unit_usaha_id,
          supplier_id,
          code,
          purchase_date,
          invoice_number,
          payment_method,
          payment_status,
          cash_account_code,
          payable_account_code,
          total_purchase_amount,
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
          $11,
          $12,
          $13,
          'POSTED',
          jsonb_build_object(
            'created_from', 'material_purchase_action',
            'material_id', $14::text,
            'material_code', $15::text,
            'material_name', $16::text,
            'supplier_name', $17::text
          )
        )
      `,
      [
        purchaseId,
        context.bumDesaId,
        context.unitUsahaId,
        supplierId,
        purchaseCode,
        purchaseDate,
        invoiceNumber,
        paymentMethod,
        paymentStatus,
        cashAccountCode,
        payableAccountCode,
        toDecimalText(totalPurchaseAmount),
        notes,
        material.material_id,
        material.material_code,
        material.material_name,
        supplierNameForMetadata,
      ]
    );

    await client.query(
      `
        INSERT INTO production_stock_movement (
          id,
          bum_desa_id,
          unit_usaha_id,
          production_batch_id,
          movement_date,
          item_type,
          product_id,
          material_id,
          movement_direction,
          movement_source,
          quantity,
          unit_of_measure,
          unit_cost,
          total_amount,
          notes,
          metadata
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          NULL,
          $4::date,
          'MATERIAL',
          NULL,
          $5::uuid,
          'IN',
          'MATERIAL_PURCHASE',
          $6,
          $7,
          $8,
          $9,
          $10,
          jsonb_build_object(
            'purchase_id', $11::text,
            'purchase_code', $12::text,
            'supplier_id', $13::text,
            'supplier_name', $14::text
          )
        )
      `,
      [
        stockMovementId,
        context.bumDesaId,
        context.unitUsahaId,
        purchaseDate,
        materialId,
        toDecimalText(quantity, 4),
        material.unit_of_measure,
        toDecimalText(unitCost),
        toDecimalText(totalPurchaseAmount),
        notes,
        purchaseId,
        purchaseCode,
        supplierId,
        supplierNameForMetadata,
      ]
    );

    await client.query(
      `
        INSERT INTO material_purchase_line (
          id,
          purchase_id,
          bum_desa_id,
          unit_usaha_id,
          material_id,
          stock_movement_id,
          line_number,
          quantity,
          unit_of_measure,
          unit_cost,
          purchase_amount,
          inventory_account_code,
          notes,
          metadata
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5::uuid,
          $6::uuid,
          1,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          jsonb_build_object(
            'material_code', $13::text,
            'material_name', $14::text
          )
        )
      `,
      [
        purchaseLineId,
        purchaseId,
        context.bumDesaId,
        context.unitUsahaId,
        materialId,
        stockMovementId,
        toDecimalText(quantity, 4),
        material.unit_of_measure,
        toDecimalText(unitCost),
        toDecimalText(totalPurchaseAmount),
        inventoryAccountCode,
        notes,
        material.material_code,
        material.material_name,
      ]
    );

    if (paymentMethod === "CASH") {
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
            AND jh.unit_usaha_id = $2::uuid
            AND jh.status = 'POSTED'
            AND a.kode = $3
        `,
        [context.bumDesaId, context.unitUsahaId, cashAccountCode]
      );

      const cashBalance = Number(cashBalanceResult.rows[0]?.balance ?? 0);

      if (!Number.isFinite(cashBalance) || cashBalance < totalPurchaseAmount) {
        throw new Error(
          `Saldo Kas Tunai tidak cukup. Saldo saat ini Rp${cashBalance.toLocaleString(
            "id-ID"
          )}, kebutuhan Rp${totalPurchaseAmount.toLocaleString("id-ID")}.`
        );
      }
    }

    if (paymentMethod === "CREDIT") {
      await client.query(
        `
          INSERT INTO supplier_payable (
            bum_desa_id,
            unit_usaha_id,
            supplier_id,
            purchase_id,
            code,
            payable_date,
            due_date,
            original_amount,
            paid_amount,
            outstanding_amount,
            payable_account_code,
            status,
            notes,
            metadata
          )
          VALUES (
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::uuid,
            $5,
            $6::date,
            NULL,
            $7,
            0,
            $7,
            $8,
            'UNPAID',
            $9,
            jsonb_build_object(
              'created_from', 'material_purchase_action',
              'purchase_code', $10::text,
              'supplier_name', $11::text
            )
          )
        `,
        [
          context.bumDesaId,
          context.unitUsahaId,
          supplierId,
          purchaseId,
          createPayableCode(purchaseDate),
          purchaseDate,
          toDecimalText(totalPurchaseAmount),
          payableAccountCode,
          notes,
          purchaseCode,
          supplierNameForMetadata,
        ]
      );
    }

    const journalPayload =
      paymentMethod === "CASH"
        ? {
            nominal: toMoneyText(totalPurchaseAmount),
            inventory_account_code: inventoryAccountCode,
            cash_or_bank_account_code: cashAccountCode,
            keterangan: `Pembelian bahan ${material.material_name} ${purchaseCode}`,
          }
        : {
            nominal: toMoneyText(totalPurchaseAmount),
            inventory_account_code: inventoryAccountCode,
            payable_account_code: payableAccountCode,
            keterangan: `Pembelian kredit bahan ${material.material_name} ${purchaseCode}`,
          };

    const journalResult = await postTemplateTransaction(
      {
        bumDesaId: context.bumDesaId,
        unitUsahaId: context.unitUsahaId,
        templateCode,
        tanggal: purchaseDate,
        payload: journalPayload,
        createdBy: context.userId,
        keterangan: `Pembelian bahan produksi ${purchaseCode}`,
      },
      client
    );

    await client.query(
      `
        UPDATE material_purchase
        SET
          journal_header_id = $1::uuid,
          metadata = metadata || jsonb_build_object(
            'journal_number', $2::text
          )
        WHERE id = $3::uuid
      `,
      [journalResult.journalHeaderId, journalResult.nomorJurnal, purchaseId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/unit/dashboard/pembelian-bahan");
  revalidatePath("/unit/dashboard/produksi/stok-bahan");
  revalidatePath("/unit/dashboard/produksi/bahan-baku");

  redirect(
    `/unit/dashboard/pembelian-bahan?created=${encodeURIComponent(
      createdPurchaseCode
    )}`
  );
}