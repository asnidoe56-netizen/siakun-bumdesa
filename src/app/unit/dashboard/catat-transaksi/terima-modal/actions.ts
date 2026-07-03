"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postTemplateTransaction } from "@/lib/accounting/post-template-transaction";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";
import { assertCentralOfficeContext } from "@/lib/unit/unit-context-guards";

const T19_TEMPLATE_CODE = "T19";

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

export async function postCapitalContributionAction(formData: FormData) {
  const context = await getUnitWorkContext();

  assertCentralOfficeContext(context, "Terima modal");

  const tanggal = getRequiredString(formData, "tanggal", "Tanggal transaksi");
  const nominal = getPositiveAmount(formData);
  const cashAccountCode = getRequiredString(
    formData,
    "cashAccountCode",
    "Kas/bank tujuan"
  );
  const capitalAccountCode = getRequiredString(
    formData,
    "capitalAccountCode",
    "Akun modal"
  );
  const keterangan = String(formData.get("keterangan") ?? "").trim();

  const result = await postTemplateTransaction({
    bumDesaId: context.bumDesaId,
    unitUsahaId: context.unitUsahaId,
    templateCode: T19_TEMPLATE_CODE,
    tanggal,
    payload: {
      nominal,
      cash_or_bank_account_code: cashAccountCode,
      capital_account_code: capitalAccountCode,
      keterangan,
    },
    createdBy: context.userId,
    keterangan: keterangan || "Terima modal dari desa atau masyarakat",
  });

  revalidatePath("/unit/dashboard");
  revalidatePath("/unit/dashboard/catat-transaksi");
  revalidatePath("/unit/dashboard/laporan");

  redirect(
    `/unit/dashboard/catat-transaksi/terima-modal?posted=${encodeURIComponent(
      result.nomorJurnal
    )}`
  );
}