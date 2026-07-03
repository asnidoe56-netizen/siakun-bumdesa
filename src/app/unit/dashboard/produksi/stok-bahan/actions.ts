"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/pool";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";
import { assertProductionFinishedGoodsContext } from "@/lib/unit/unit-context-guards";

function getRequiredString(formData: FormData, fieldName: string, label: string) {
  const value = String(formData.get(fieldName) ?? "").trim();

  if (!value) {
    throw new Error(`${label} wajib diisi.`);
  }

  return value;
}

function getOptionalString(formData: FormData, fieldName: string) {
  const value = String(formData.get(fieldName) ?? "").trim();

  return value || null;
}

function normalizeDecimalInput(value: string) {
  return value.trim().replace(/\./g, "").replace(",", ".");
}

function getPositiveNumericString(
  formData: FormData,
  fieldName: string,
  label: string
) {
  const rawValue = String(formData.get(fieldName) ?? "").trim();
  const normalizedValue = normalizeDecimalInput(rawValue);
  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error(`${label} harus berupa angka lebih dari 0.`);
  }

  return normalizedValue;
}

function getNonNegativeNumericString(
  formData: FormData,
  fieldName: string,
  label: string
) {
  const rawValue = String(formData.get(fieldName) ?? "0").trim();
  const normalizedValue = normalizeDecimalInput(rawValue || "0");
  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new Error(`${label} harus berupa angka 0 atau lebih.`);
  }

  return normalizedValue;
}

function getRequiredDate(formData: FormData, fieldName: string, label: string) {
  const value = getRequiredString(formData, fieldName, label);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} tidak valid.`);
  }

  return value;
}

type MaterialLookupRow = {
  id: string;
  name: string;
  unit_of_measure: string;
};

export async function createMaterialStockInAction(formData: FormData) {
  const context = await getUnitWorkContext();

  assertProductionFinishedGoodsContext(context, "Stok bahan produksi");

  const materialId = getRequiredString(formData, "materialId", "Bahan");
  const movementDate = getRequiredDate(formData, "movementDate", "Tanggal");
  const quantity = getPositiveNumericString(formData, "quantity", "Jumlah masuk");
  const unitCost = getNonNegativeNumericString(
    formData,
    "unitCost",
    "Biaya per satuan"
  );
  const notes = getOptionalString(formData, "notes");

  const materialResult = await db.query<MaterialLookupRow>(
    `
      SELECT
        id::text AS id,
        name,
        unit_of_measure
      FROM production_material
      WHERE id = $1::uuid
        AND bum_desa_id = $2::uuid
        AND unit_usaha_id = $3::uuid
        AND is_active = TRUE
      LIMIT 1
    `,
    [materialId, context.bumDesaId, context.unitUsahaId]
  );

  const material = materialResult.rows[0];

  if (!material) {
    throw new Error("Bahan tidak ditemukan atau tidak aktif.");
  }

  await db.query(
    `
      INSERT INTO production_stock_movement (
        bum_desa_id,
        unit_usaha_id,
        movement_date,
        item_type,
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
        $3::date,
        'MATERIAL',
        $4::uuid,
        'IN',
        'ADJUSTMENT',
        $5::numeric,
        $6,
        $7::numeric,
        ($5::numeric * $7::numeric)::numeric(24,6),
        $8,
        $9::jsonb
      )
    `,
    [
      context.bumDesaId,
      context.unitUsahaId,
      movementDate,
      material.id,
      quantity,
      material.unit_of_measure,
      unitCost,
      notes,
      JSON.stringify({
        adjustment_type: "MATERIAL_STOCK_IN",
        source: "stok-bahan",
      }),
    ]
  );

  revalidatePath("/unit/dashboard/produksi");
  revalidatePath("/unit/dashboard/produksi/stok-bahan");
  revalidatePath("/unit/dashboard/produksi/bahan-baku");

  redirect(
    `/unit/dashboard/produksi/stok-bahan?stockIn=${encodeURIComponent(
      material.name
    )}`
  );
}