"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/pool";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";
import { assertCentralOfficeContext } from "@/lib/unit/unit-context-guards";

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

export async function allocateCashToUnitAction(formData: FormData) {
  const context = await getUnitWorkContext();

  assertCentralOfficeContext(context, "Alokasi kas ke unit");

  const tanggal = getRequiredString(formData, "tanggal", "Tanggal transaksi");
  const nominal = getPositiveAmount(formData);
  const targetUnitId = getRequiredString(formData, "targetUnitId", "Unit tujuan");
  const sourceCashAccountCode = getRequiredString(
    formData,
    "sourceCashAccountCode",
    "Akun kas/bank sumber"
  );
  const targetCashAccountCode = getRequiredString(
    formData,
    "targetCashAccountCode",
    "Akun kas/bank tujuan"
  );
  const keterangan =
    String(formData.get("keterangan") ?? "").trim() ||
    "Alokasi kas dari Kantor Pusat ke unit usaha";

  if (targetUnitId === context.unitUsahaId) {
    throw new Error("Unit tujuan tidak boleh sama dengan Kantor Pusat.");
  }

  const client = await db.connect();
  let postedJournalNumber = "berhasil";

  try {
    await client.query("BEGIN");

    const targetUnitResult = await client.query<{
      id: string;
      kode: string;
      nama: string;
    }>(
      `
        SELECT id::text, kode, nama
        FROM unit_usaha
        WHERE id = $1::uuid
          AND bum_desa_id = $2::uuid
          AND jenis = 'unit_usaha'
          AND is_active = TRUE
        LIMIT 1
      `,
      [targetUnitId, context.bumDesaId]
    );

    const targetUnit = targetUnitResult.rows[0];

    if (!targetUnit) {
      throw new Error("Unit tujuan tidak ditemukan, tidak aktif, atau bukan unit usaha.");
    }

    const periodResult = await client.query<{ id: string }>(
      `
        SELECT id::text
        FROM periode_akuntansi
        WHERE bum_desa_id = $1::uuid
          AND status = 'OPEN'
          AND $2::date BETWEEN tanggal_mulai AND tanggal_selesai
        ORDER BY tanggal_mulai DESC
        LIMIT 1
      `,
      [context.bumDesaId, tanggal]
    );

    const periodId = periodResult.rows[0]?.id;

    if (!periodId) {
      throw new Error("Periode akuntansi terbuka untuk tanggal transaksi tidak ditemukan.");
    }

    const sourceCashAccountResult = await client.query<{
      id: string;
      kode: string;
      nama: string;
    }>(
      `
        SELECT id::text, kode, nama
        FROM akun
        WHERE kode = $1
          AND is_active = TRUE
          AND level = 'D'
          AND kode LIKE '1.1.01.%'
          AND (bum_desa_id = $2::uuid OR bum_desa_id IS NULL)
        ORDER BY
          CASE
            WHEN bum_desa_id = $2::uuid THEN 0
            ELSE 1
          END
        LIMIT 1
      `,
      [sourceCashAccountCode, context.bumDesaId]
    );

    const sourceCashAccount = sourceCashAccountResult.rows[0];

    if (!sourceCashAccount) {
      throw new Error("Akun kas/bank sumber tidak ditemukan, tidak aktif, atau bukan akun detail kas/bank.");
    }

    const targetCashAccountResult = await client.query<{
      id: string;
      kode: string;
      nama: string;
    }>(
      `
        SELECT id::text, kode, nama
        FROM akun
        WHERE kode = $1
          AND is_active = TRUE
          AND level = 'D'
          AND kode LIKE '1.1.01.%'
          AND (bum_desa_id = $2::uuid OR bum_desa_id IS NULL)
        ORDER BY
          CASE
            WHEN bum_desa_id = $2::uuid THEN 0
            ELSE 1
          END
        LIMIT 1
      `,
      [targetCashAccountCode, context.bumDesaId]
    );

    const targetCashAccount = targetCashAccountResult.rows[0];

    if (!targetCashAccount) {
      throw new Error("Akun kas/bank tujuan tidak ditemukan, tidak aktif, atau bukan akun detail kas/bank.");
    }

    const cashBalanceResult = await client.query<{ balance: string }>(
      `
        SELECT COALESCE(SUM(jl.debit - jl.kredit), 0)::text AS balance
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
      [context.bumDesaId, context.unitUsahaId, sourceCashAccount.kode]
    );

    const cashBalance = Number(cashBalanceResult.rows[0]?.balance ?? 0);

    if (!Number.isFinite(cashBalance) || cashBalance < nominal) {
      throw new Error(
        `Saldo ${sourceCashAccount.nama} Pusat tidak cukup. Saldo saat ini Rp${cashBalance.toLocaleString(
          "id-ID"
        )}, kebutuhan Rp${nominal.toLocaleString("id-ID")}.`
      );
    }

    const journalNumberResult = await client.query<{ nomor_jurnal: string }>(
      `
        SELECT
          'JM/AKU/' ||
          TO_CHAR(CLOCK_TIMESTAMP(), 'YYYYMMDDHH24MISSMS') ||
          '/' ||
          UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 6)) AS nomor_jurnal
      `
    );

    const nomorJurnal = journalNumberResult.rows[0]?.nomor_jurnal;

    if (!nomorJurnal) {
      throw new Error("Nomor jurnal alokasi kas gagal dibuat.");
    }

    const journalHeaderResult = await client.query<{ id: string }>(
      `
        INSERT INTO journal_header (
          bum_desa_id,
          unit_usaha_id,
          periode_akuntansi_id,
          template_transaksi_id,
          nomor_jurnal,
          tanggal,
          sumber,
          status,
          keterangan,
          created_by
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          NULL,
          $4,
          $5::date,
          'MANUAL',
          'POSTED',
          $6,
          $7::uuid
        )
        RETURNING id::text
      `,
      [
        context.bumDesaId,
        context.unitUsahaId,
        periodId,
        nomorJurnal,
        tanggal,
        `${keterangan} (${context.unitCode} ke ${targetUnit.kode})`,
        context.userId,
      ]
    );

    const journalHeaderId = journalHeaderResult.rows[0]?.id;

    if (!journalHeaderId) {
      throw new Error("Header jurnal alokasi kas gagal dibuat.");
    }

    await client.query(
      `
        INSERT INTO journal_line (
          journal_header_id,
          akun_id,
          unit_usaha_id,
          debit,
          kredit,
          keterangan
        )
        VALUES
          ($1::uuid, $2::uuid, $3::uuid, $4, 0, $5),
          ($1::uuid, $6::uuid, $7::uuid, 0, $4, $8)
      `,
      [
        journalHeaderId,
        targetCashAccount.id,
        targetUnit.id,
        nominal,
        `Kas diterima dari Kantor Pusat - ${targetUnit.kode}`,
        sourceCashAccount.id,
        context.unitUsahaId,
        `Kas dialokasikan ke ${targetUnit.kode}`,
      ]
    );

    await client.query(
      `
        INSERT INTO audit_log (
          bum_desa_id,
          user_id,
          table_name,
          record_id,
          action,
          before_data,
          after_data
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          'journal_header',
          $3::uuid,
          'ALLOCATE_CASH_TO_UNIT',
          NULL,
          jsonb_build_object(
            'journal_header_id', $3::uuid,
            'nomor_jurnal', $4::text,
            'source_unit_id', $5::uuid,
            'target_unit_id', $6::uuid,
            'nominal', $7::numeric,
            'source_cash_account_code', $8::text,
            'target_cash_account_code', $9::text
          )
        )
      `,
      [
        context.bumDesaId,
        context.userId,
        journalHeaderId,
        nomorJurnal,
        context.unitUsahaId,
        targetUnit.id,
        nominal,
        sourceCashAccount.kode,
        targetCashAccount.kode,
      ]
    );

    postedJournalNumber = nomorJurnal;

    await client.query("COMMIT");

    revalidatePath("/unit/dashboard");
    revalidatePath("/unit/dashboard/catat-transaksi");
    revalidatePath("/unit/dashboard/laporan");
    revalidatePath("/unit/dashboard/pembelian-bahan");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  redirect(
    `/unit/dashboard/catat-transaksi/alokasi-kas-unit?posted=${encodeURIComponent(
      postedJournalNumber
    )}`
  );
}