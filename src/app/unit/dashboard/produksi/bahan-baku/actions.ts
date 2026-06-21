"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/pool";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

const allowedMaterialTypes = new Set([
  "BAHAN_BAKU",
  "KEMASAN",
  "BAHAN_PENDUKUNG",
  "BARANG_PAKAI_HABIS",
]);

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

function normalizeMaterialCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9._-]/g, "");
}

function getNonNegativeAmount(formData: FormData, fieldName: string, label: string) {
  const rawValue = String(formData.get(fieldName) ?? "0").trim();
  const normalizedValue = rawValue.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalizedValue || "0");

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} harus berupa angka 0 atau lebih.`);
  }

  return amount;
}

export async function createProductionMaterialAction(formData: FormData) {
  const context = await getUnitWorkContext();

  const rawCode = getRequiredString(formData, "code", "Kode bahan");
  const code = normalizeMaterialCode(rawCode);

  if (!code) {
    throw new Error("Kode bahan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda minus.");
  }

  const name = getRequiredString(formData, "name", "Nama bahan");
  const materialType = getRequiredString(formData, "materialType", "Jenis bahan");

  if (!allowedMaterialTypes.has(materialType)) {
    throw new Error("Jenis bahan tidak valid.");
  }

  const unitOfMeasure = getRequiredString(formData, "unitOfMeasure", "Satuan");
  const defaultUnitCost = getNonNegativeAmount(
    formData,
    "defaultUnitCost",
    "Harga satuan default"
  );
  const isStocked = formData.get("isStocked") === "on";
  const description = getOptionalString(formData, "description");

  await db.query(
    `
      INSERT INTO production_material (
        bum_desa_id,
        unit_usaha_id,
        code,
        name,
        description,
        material_type,
        unit_of_measure,
        default_unit_cost,
        is_stocked
      )
      VALUES (
        $1::uuid,
        $2::uuid,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9
      )
    `,
    [
      context.bumDesaId,
      context.unitUsahaId,
      code,
      name,
      description,
      materialType,
      unitOfMeasure,
      defaultUnitCost,
      isStocked,
    ]
  );

  revalidatePath("/unit/dashboard/produksi");
  revalidatePath("/unit/dashboard/produksi/bahan-baku");

  redirect(
    `/unit/dashboard/produksi/bahan-baku?created=${encodeURIComponent(name)}`
  );
}