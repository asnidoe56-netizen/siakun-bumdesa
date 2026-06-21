"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/pool";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

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

function normalizeProductCode(value: string) {
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

export async function createProductionProductAction(formData: FormData) {
  const context = await getUnitWorkContext();

  const rawCode = getRequiredString(formData, "code", "Kode produk");
  const code = normalizeProductCode(rawCode);

  if (!code) {
    throw new Error("Kode produk hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda minus.");
  }

  const name = getRequiredString(formData, "name", "Nama produk");
  const businessRevenueMappingId = getRequiredString(
    formData,
    "businessRevenueMappingId",
    "Jenis produk"
  );
  const unitOfMeasure = getRequiredString(formData, "unitOfMeasure", "Satuan");
  const defaultSellingPrice = getNonNegativeAmount(
    formData,
    "defaultSellingPrice",
    "Harga jual default"
  );
  const description = getOptionalString(formData, "description");

  await db.query(
    `
      INSERT INTO production_product (
        bum_desa_id,
        unit_usaha_id,
        business_revenue_mapping_id,
        code,
        name,
        description,
        unit_of_measure,
        default_selling_price
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
    `,
    [
      context.bumDesaId,
      context.unitUsahaId,
      businessRevenueMappingId,
      code,
      name,
      description,
      unitOfMeasure,
      defaultSellingPrice,
    ]
  );

  revalidatePath("/unit/dashboard/produksi");
  revalidatePath("/unit/dashboard/produksi/data-produk");

  redirect(
    `/unit/dashboard/produksi/data-produk?created=${encodeURIComponent(name)}`
  );
}