"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postTemplateTransaction } from "@/lib/accounting/post-template-transaction";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

const T01_TEMPLATE_CODE = "T01";

function getRequiredString(formData: FormData, fieldName: string, label: string) {
  const value = String(formData.get(fieldName) ?? "").trim();

  if (!value) {
    throw new Error(`${label} wajib diisi.`);
  }

  return value;
}

function getPositiveAmount(formData: FormData) {
  const rawValue = getRequiredString(formData, "nominal", "Nominal");
  const normalizedValue = rawValue.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Nominal harus berupa angka lebih dari 0.");
  }

  return amount;
}

export async function postCashIncomeAction(formData: FormData) {
  const context = await getUnitWorkContext();

  const tanggal = getRequiredString(formData, "tanggal", "Tanggal transaksi");
  const nominal = getPositiveAmount(formData);
  const cashAccountCode = getRequiredString(
    formData,
    "cashAccountCode",
    "Akun kas/bank"
  );
  const incomeAccountCode = getRequiredString(
    formData,
    "incomeAccountCode",
    "Akun pendapatan"
  );
  const keterangan = String(formData.get("keterangan") ?? "").trim();

  const result = await postTemplateTransaction({
    bumDesaId: context.bumDesaId,
    unitUsahaId: context.unitUsahaId,
    templateCode: T01_TEMPLATE_CODE,
    tanggal,
    payload: {
      nominal,
      cash_account_code: cashAccountCode,
      income_account_code: incomeAccountCode,
      keterangan,
    },
    createdBy: context.userId,
    keterangan: keterangan || "Terima pendapatan tunai",
  });

  revalidatePath("/unit/dashboard");
  revalidatePath("/unit/dashboard/catat-transaksi");

  redirect(
    `/unit/dashboard/catat-transaksi/terima-pendapatan-tunai?posted=${encodeURIComponent(
      result.nomorJurnal
    )}`
  );
}