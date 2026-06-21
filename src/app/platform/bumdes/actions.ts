"use server";

import { revalidatePath } from "next/cache";
import type { PoolClient } from "pg";
import { db } from "@/lib/db/pool";

type BumDesaRecord = {
  id: string;
  kode: string;
  nama: string;
  alamat: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  provinsi: string | null;
  nib: string | null;
  is_active: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  delete_reason: string | null;
};

async function getReviewerId() {
  const result = await db.query<{ id: string }>(
    `
      SELECT id::text
      FROM app_user
      WHERE email = 'admin@siakun.local'
      LIMIT 1
    `
  );

  return result.rows[0]?.id ?? null;
}

async function getLockedBumDesa(
  client: PoolClient,
  id: string
) {
  const result = await client.query<BumDesaRecord>(
    `
      SELECT
        id::text,
        kode,
        nama,
        alamat,
        desa,
        kecamatan,
        kabupaten,
        provinsi,
        nib,
        is_active,
        deleted_at::text,
        deleted_by::text,
        delete_reason
      FROM bum_desa
      WHERE id = $1
      FOR UPDATE
    `,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function suspendBumDesa(formData: FormData) {
  const bumDesaId = String(formData.get("bumDesaId") ?? "");
  const reviewerId = await getReviewerId();

  if (!bumDesaId) {
    throw new Error("ID BUMDes tidak valid.");
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const before = await getLockedBumDesa(client, bumDesaId);

    if (!before) {
      throw new Error("BUMDes tidak ditemukan.");
    }

    if (before.deleted_at) {
      throw new Error("BUMDes sudah dihapus.");
    }

    const updated = await client.query<BumDesaRecord>(
      `
        UPDATE bum_desa
        SET is_active = FALSE
        WHERE id = $1
        RETURNING
          id::text,
          kode,
          nama,
          alamat,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          nib,
          is_active,
          deleted_at::text,
          deleted_by::text,
          delete_reason
      `,
      [bumDesaId]
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
        VALUES ($1, $2, 'bum_desa', $1, 'SUSPEND_BUM_DESA', $3::jsonb, $4::jsonb)
      `,
      [
        bumDesaId,
        reviewerId,
        JSON.stringify(before),
        JSON.stringify(updated.rows[0]),
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/platform/bumdes");
  revalidatePath("/platform/dashboard");
}

export async function activateBumDesa(formData: FormData) {
  const bumDesaId = String(formData.get("bumDesaId") ?? "");
  const reviewerId = await getReviewerId();

  if (!bumDesaId) {
    throw new Error("ID BUMDes tidak valid.");
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const before = await getLockedBumDesa(client, bumDesaId);

    if (!before) {
      throw new Error("BUMDes tidak ditemukan.");
    }

    if (before.deleted_at) {
      throw new Error("BUMDes sudah dihapus dan tidak bisa diaktifkan.");
    }

    const updated = await client.query<BumDesaRecord>(
      `
        UPDATE bum_desa
        SET is_active = TRUE
        WHERE id = $1
        RETURNING
          id::text,
          kode,
          nama,
          alamat,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          nib,
          is_active,
          deleted_at::text,
          deleted_by::text,
          delete_reason
      `,
      [bumDesaId]
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
        VALUES ($1, $2, 'bum_desa', $1, 'ACTIVATE_BUM_DESA', $3::jsonb, $4::jsonb)
      `,
      [
        bumDesaId,
        reviewerId,
        JSON.stringify(before),
        JSON.stringify(updated.rows[0]),
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/platform/bumdes");
  revalidatePath("/platform/dashboard");
}

export async function deleteBumDesa(formData: FormData) {
  const bumDesaId = String(formData.get("bumDesaId") ?? "");
  const reason =
    String(formData.get("deleteReason") ?? "").trim() ||
    "BUMDes dihapus dari daftar aktif oleh Super Admin.";
  const reviewerId = await getReviewerId();

  if (!bumDesaId) {
    throw new Error("ID BUMDes tidak valid.");
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const before = await getLockedBumDesa(client, bumDesaId);

    if (!before) {
      throw new Error("BUMDes tidak ditemukan.");
    }

    if (before.deleted_at) {
      throw new Error("BUMDes sudah dihapus.");
    }

    const updated = await client.query<BumDesaRecord>(
      `
        UPDATE bum_desa
        SET
          is_active = FALSE,
          deleted_at = NOW(),
          deleted_by = $2,
          delete_reason = $3
        WHERE id = $1
        RETURNING
          id::text,
          kode,
          nama,
          alamat,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          nib,
          is_active,
          deleted_at::text,
          deleted_by::text,
          delete_reason
      `,
      [bumDesaId, reviewerId, reason]
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
        VALUES ($1, $2, 'bum_desa', $1, 'SOFT_DELETE_BUM_DESA', $3::jsonb, $4::jsonb)
      `,
      [
        bumDesaId,
        reviewerId,
        JSON.stringify(before),
        JSON.stringify(updated.rows[0]),
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/platform/bumdes");
  revalidatePath("/platform/dashboard");
}


