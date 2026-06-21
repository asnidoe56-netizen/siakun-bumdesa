"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/pool";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

const FORMULA_LINE_SLOTS = 5;

function getRequiredText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} wajib diisi.`);
  }

  return value;
}

function getOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  return value.length > 0 ? value : null;
}

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9._-]/g, "");
}

function getPositiveNumber(formData: FormData, key: string) {
  const rawValue = String(formData.get(key) ?? "").trim();
  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} harus lebih besar dari 0.`);
  }

  return value;
}

function getNonNegativeNumber(formData: FormData, key: string) {
  const rawValue = String(formData.get(key) ?? "0").trim();
  const value = Number(rawValue || "0");

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} tidak boleh negatif.`);
  }

  return value;
}

type FormulaLineInput = {
  materialId: string;
  quantity: number;
  wastagePercent: number;
  notes: string | null;
  sortOrder: number;
};

function getFormulaLines(formData: FormData) {
  const lines: FormulaLineInput[] = [];
  const usedMaterialIds = new Set<string>();

  for (let index = 1; index <= FORMULA_LINE_SLOTS; index += 1) {
    const materialId = String(formData.get(`materialId_${index}`) ?? "").trim();

    if (!materialId) {
      continue;
    }

    if (usedMaterialIds.has(materialId)) {
      throw new Error("Bahan yang sama tidak boleh dipakai dua kali dalam satu resep.");
    }

    const quantity = getPositiveNumber(formData, `quantity_${index}`);
    const wastagePercent = getNonNegativeNumber(
      formData,
      `wastagePercent_${index}`
    );

    if (wastagePercent > 100) {
      throw new Error("Susut/toleransi bahan tidak boleh lebih dari 100%.");
    }

    usedMaterialIds.add(materialId);

    lines.push({
      materialId,
      quantity,
      wastagePercent,
      notes: getOptionalText(formData, `notes_${index}`),
      sortOrder: index,
    });
  }

  if (lines.length === 0) {
    throw new Error("Minimal satu bahan harus dipilih.");
  }

  return lines;
}

export async function createProductionFormulaAction(formData: FormData) {
  const context = await getUnitWorkContext();

  const productId = getRequiredText(formData, "productId");
  const code = normalizeCode(getRequiredText(formData, "code"));
  const name = getRequiredText(formData, "name");
  const description = getOptionalText(formData, "description");
  const outputQuantity = getPositiveNumber(formData, "outputQuantity");
  const isDefault = formData.get("isDefault") === "on";
  const lines = getFormulaLines(formData);

  if (!code) {
    throw new Error("Kode resep tidak valid.");
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    if (isDefault) {
      await client.query(
        `
          UPDATE production_formula
          SET is_default = FALSE
          WHERE bum_desa_id = $1::uuid
            AND unit_usaha_id = $2::uuid
            AND product_id = $3::uuid
            AND is_default = TRUE
        `,
        [context.bumDesaId, context.unitUsahaId, productId]
      );
    }

    const formulaResult = await client.query<{ id: string }>(
      `
        INSERT INTO production_formula (
          bum_desa_id,
          unit_usaha_id,
          product_id,
          code,
          name,
          description,
          output_quantity,
          is_default
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4,
          $5,
          $6,
          $7,
          $8
        )
        RETURNING id::text AS id
      `,
      [
        context.bumDesaId,
        context.unitUsahaId,
        productId,
        code,
        name,
        description,
        outputQuantity,
        isDefault,
      ]
    );

    const formulaId = formulaResult.rows[0]?.id;

    if (!formulaId) {
      throw new Error("Gagal membuat resep produksi.");
    }

    for (const line of lines) {
      await client.query(
        `
          INSERT INTO production_formula_line (
            formula_id,
            bum_desa_id,
            unit_usaha_id,
            material_id,
            quantity,
            wastage_percent,
            notes,
            sort_order
          )
          VALUES (
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::uuid,
            $5,
            $6,
            $7,
            $8
          )
        `,
        [
          formulaId,
          context.bumDesaId,
          context.unitUsahaId,
          line.materialId,
          line.quantity,
          line.wastagePercent,
          line.notes,
          line.sortOrder,
        ]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/unit/dashboard/produksi");
  revalidatePath("/unit/dashboard/produksi/formula");

  redirect(
    `/unit/dashboard/produksi/formula?created=${encodeURIComponent(name)}`
  );
}