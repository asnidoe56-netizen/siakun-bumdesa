"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postTemplateTransaction } from "@/lib/accounting/post-template-transaction";
import { db } from "@/lib/db/pool";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";
import { assertProductionFinishedGoodsContext } from "@/lib/unit/unit-context-guards";

type ProductSaleRow = {
  product_id: string;
  product_code: string;
  product_name: string;
  unit_of_measure: string;
  default_selling_price: string;
  revenue_mapping_strategy: string;
  sales_revenue_account_code: string | null;
};

type ProductStockSummaryRow = {
  quantity_on_hand: string;
  total_value: string;
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

function getSaleDate(value: FormDataEntryValue | null) {
  const cleanValue = value?.toString().trim();

  if (!cleanValue) {
    return new Date().toISOString().slice(0, 10);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    throw new Error("Tanggal penjualan tidak valid.");
  }

  return cleanValue;
}

function createSaleCode(saleDate: string) {
  const datePart = saleDate.replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

  return `PJP-${datePart}-${suffix}`;
}

function toMoneyText(value: number) {
  return value.toFixed(2);
}

function toDecimalText(value: number, fractionDigits = 6) {
  return value.toFixed(fractionDigits);
}

export async function createFinishedGoodsSaleAction(formData: FormData) {
  const context = await getUnitWorkContext();

  assertProductionFinishedGoodsContext(context, "Penjualan produk barang jadi");

  const productId = getRequiredString(formData.get("productId"), "Produk");
  const saleDate = getSaleDate(formData.get("saleDate"));
  const customerName = getOptionalString(formData.get("customerName"));
  const notes = getOptionalString(formData.get("notes"));
  const quantity = getPositiveNumber(formData.get("quantity"), "Jumlah dijual");
  const sellingUnitPrice = getPositiveNumber(
    formData.get("sellingUnitPrice"),
    "Harga jual satuan"
  );

  const paymentMethod = "CASH";
  const paymentStatus = "PAID";
  const cashAccountCode = "1.1.01.01";

  const saleId = randomUUID();
  const saleLineId = randomUUID();
  const stockMovementId = randomUUID();
  const saleCode = createSaleCode(saleDate);

  const createdSaleCode = saleCode;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))", [
      productId,
    ]);

    const productResult = await client.query<ProductSaleRow>(
      `
        SELECT
          pp.id::text AS product_id,
          pp.code AS product_code,
          pp.name AS product_name,
          pp.unit_of_measure,
          pp.default_selling_price::text AS default_selling_price,
          brm.account_mapping_strategy AS revenue_mapping_strategy,
          brm.account_code AS sales_revenue_account_code
        FROM production_product pp
        JOIN business_revenue_mapping brm
          ON brm.id = pp.business_revenue_mapping_id
        WHERE pp.id = $1::uuid
          AND pp.bum_desa_id = $2::uuid
          AND pp.unit_usaha_id = $3::uuid
          AND pp.is_active = TRUE
          AND brm.is_active = TRUE
        LIMIT 1
      `,
      [productId, context.bumDesaId, context.unitUsahaId]
    );

    const product = productResult.rows[0];

    if (!product) {
      throw new Error("Produk barang jadi tidak ditemukan atau tidak aktif.");
    }

    if (
      product.revenue_mapping_strategy !== "FIXED_CODE" ||
      !product.sales_revenue_account_code
    ) {
      throw new Error(
        `Akun pendapatan produk ${product.product_name} belum ditentukan secara detail.`
      );
    }

    const stockResult = await client.query<ProductStockSummaryRow>(
      `
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN movement_direction = 'IN' THEN quantity
                WHEN movement_direction = 'OUT' THEN -quantity
                ELSE 0
              END
            ),
            0
          )::text AS quantity_on_hand,
          COALESCE(
            SUM(
              CASE
                WHEN movement_direction = 'IN' THEN total_amount
                WHEN movement_direction = 'OUT' THEN -total_amount
                ELSE 0
              END
            ),
            0
          )::text AS total_value
        FROM production_stock_movement
        WHERE bum_desa_id = $1::uuid
          AND unit_usaha_id = $2::uuid
          AND item_type = 'PRODUCT'
          AND product_id = $3::uuid
      `,
      [context.bumDesaId, context.unitUsahaId, productId]
    );

    const stock = stockResult.rows[0];
    const quantityOnHand = Number(stock?.quantity_on_hand ?? 0);
    const totalValue = Number(stock?.total_value ?? 0);

    if (!Number.isFinite(quantityOnHand) || quantityOnHand <= 0) {
      throw new Error(`Stok ${product.product_name} belum tersedia.`);
    }

    if (quantityOnHand < quantity) {
      throw new Error(
        `Stok ${product.product_name} tidak cukup. Tersedia ${quantityOnHand} ${product.unit_of_measure}.`
      );
    }

    if (!Number.isFinite(totalValue) || totalValue <= 0) {
      throw new Error(`Nilai stok ${product.product_name} belum tersedia.`);
    }

    const averageUnitCost = totalValue / quantityOnHand;
    const salesAmount = quantity * sellingUnitPrice;
    const cogsAmount = quantity * averageUnitCost;

    if (!Number.isFinite(averageUnitCost) || averageUnitCost <= 0) {
      throw new Error(`Biaya rata-rata ${product.product_name} tidak valid.`);
    }

    if (!Number.isFinite(salesAmount) || salesAmount <= 0) {
      throw new Error("Nilai penjualan tidak valid.");
    }

    if (!Number.isFinite(cogsAmount) || cogsAmount <= 0) {
      throw new Error("Nilai HPP penjualan tidak valid.");
    }

    await client.query(
      `
        INSERT INTO production_finished_goods_sale (
          id,
          bum_desa_id,
          unit_usaha_id,
          code,
          sale_date,
          customer_name,
          payment_method,
          payment_status,
          cash_account_code,
          total_sales_amount,
          total_cogs_amount,
          notes,
          status,
          metadata
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4,
          $5::date,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          'POSTED',
          jsonb_build_object(
            'created_from', 'finished_goods_sale_action',
            'product_id', $13::text,
            'product_code', $14::text,
            'product_name', $15::text
          )
        )
      `,
      [
        saleId,
        context.bumDesaId,
        context.unitUsahaId,
        saleCode,
        saleDate,
        customerName,
        paymentMethod,
        paymentStatus,
        cashAccountCode,
        toDecimalText(salesAmount),
        toDecimalText(cogsAmount),
        notes,
        product.product_id,
        product.product_code,
        product.product_name,
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
          'PRODUCT',
          $5::uuid,
          NULL,
          'OUT',
          'PRODUCT_SALE',
          $6,
          $7,
          $8,
          $9,
          $10,
          jsonb_build_object(
            'sale_id', $11::text,
            'sale_code', $12::text,
            'sales_amount', $13::numeric,
            'selling_unit_price', $14::numeric,
            'cost_method', 'MOVING_AVERAGE'
          )
        )
      `,
      [
        stockMovementId,
        context.bumDesaId,
        context.unitUsahaId,
        saleDate,
        productId,
        toDecimalText(quantity, 4),
        product.unit_of_measure,
        toDecimalText(averageUnitCost),
        toDecimalText(cogsAmount),
        notes,
        saleId,
        saleCode,
        toDecimalText(salesAmount),
        toMoneyText(sellingUnitPrice),
      ]
    );

    await client.query(
      `
        INSERT INTO production_finished_goods_sale_line (
          id,
          sale_id,
          bum_desa_id,
          unit_usaha_id,
          product_id,
          stock_movement_id,
          line_number,
          quantity,
          unit_of_measure,
          selling_unit_price,
          sales_amount,
          unit_cost,
          cogs_amount,
          sales_revenue_account_code,
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
          $13,
          $14,
          jsonb_build_object(
            'product_code', $15::text,
            'product_name', $16::text,
            'cost_method', 'MOVING_AVERAGE'
          )
        )
      `,
      [
        saleLineId,
        saleId,
        context.bumDesaId,
        context.unitUsahaId,
        productId,
        stockMovementId,
        toDecimalText(quantity, 4),
        product.unit_of_measure,
        toMoneyText(sellingUnitPrice),
        toDecimalText(salesAmount),
        toDecimalText(averageUnitCost),
        toDecimalText(cogsAmount),
        product.sales_revenue_account_code,
        notes,
        product.product_code,
        product.product_name,
      ]
    );

    const journalResult = await postTemplateTransaction(
      {
        bumDesaId: context.bumDesaId,
        unitUsahaId: context.unitUsahaId,
        templateCode: "T20",
        tanggal: saleDate,
        payload: {
          nominal: toMoneyText(salesAmount),
          nominal_penjualan: toMoneyText(salesAmount),
          hpp: toMoneyText(cogsAmount),
          cash_account_code: cashAccountCode,
          sales_revenue_account_code: product.sales_revenue_account_code,
          keterangan: `Penjualan ${product.product_name} ${saleCode}`,
        },
        createdBy: context.userId,
        keterangan: `Penjualan barang jadi ${saleCode}`,
      },
      client
    );

    await client.query(
      `
        UPDATE production_finished_goods_sale
        SET
          journal_header_id = $1::uuid,
          metadata = metadata || jsonb_build_object(
            'journal_number', $2::text
          )
        WHERE id = $3::uuid
      `,
      [journalResult.journalHeaderId, journalResult.nomorJurnal, saleId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/unit/dashboard/penjualan-produk");
  revalidatePath("/unit/dashboard/barang-jadi");

  redirect(
    `/unit/dashboard/penjualan-produk?created=${encodeURIComponent(createdSaleCode)}`
  );
}