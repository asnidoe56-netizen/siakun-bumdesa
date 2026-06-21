"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/pool";

type RegistrationRecord = {
  id: string;
  nama_bum_desa: string;
  kode_pendaftaran: string;
  nama_pendaftar: string;
  email_pendaftar: string;
  nomor_hp_pendaftar: string | null;
  jabatan_pendaftar: string | null;
  alamat: string | null;
  desa: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  provinsi: string | null;
  nib: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  catatan_review: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_bum_desa_id: string | null;
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

export async function approveBumDesaRegistration(formData: FormData) {
  const registrationId = String(formData.get("registrationId") ?? "");
  const reviewerId = await getReviewerId();

  if (!registrationId) {
    throw new Error("ID pendaftaran tidak valid.");
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const registrationResult = await client.query<RegistrationRecord>(
      `
        SELECT
          id::text,
          nama_bum_desa,
          kode_pendaftaran,
          nama_pendaftar,
          email_pendaftar,
          nomor_hp_pendaftar,
          jabatan_pendaftar,
          alamat,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          nib,
          status,
          catatan_review,
          reviewed_by::text,
          reviewed_at::text,
          approved_bum_desa_id::text
        FROM bum_desa_registration
        WHERE id = $1
        FOR UPDATE
      `,
      [registrationId]
    );

    const registration = registrationResult.rows[0];

    if (!registration) {
      throw new Error("Pendaftaran tidak ditemukan.");
    }

    if (registration.status !== "PENDING") {
      throw new Error("Pendaftaran ini sudah pernah direview.");
    }

    const bumDesaResult = await client.query<{ id: string }>(
      `
        INSERT INTO bum_desa (
          nama,
          kode,
          alamat,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          nib,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
        RETURNING id::text
      `,
      [
        registration.nama_bum_desa,
        registration.kode_pendaftaran,
        registration.alamat,
        registration.desa,
        registration.kecamatan,
        registration.kabupaten,
        registration.provinsi,
        registration.nib,
      ]
    );

    const approvedBumDesaId = bumDesaResult.rows[0]?.id;

    if (!approvedBumDesaId) {
      throw new Error("Gagal membuat data BUMDes.");
    }

    const updatedResult = await client.query<RegistrationRecord>(
      `
        UPDATE bum_desa_registration
        SET
          status = 'APPROVED',
          reviewed_by = $2,
          reviewed_at = NOW(),
          approved_bum_desa_id = $3,
          catatan_review = 'Pendaftaran disetujui oleh Super Admin.'
        WHERE id = $1
        RETURNING
          id::text,
          nama_bum_desa,
          kode_pendaftaran,
          nama_pendaftar,
          email_pendaftar,
          nomor_hp_pendaftar,
          jabatan_pendaftar,
          alamat,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          nib,
          status,
          catatan_review,
          reviewed_by::text,
          reviewed_at::text,
          approved_bum_desa_id::text
      `,
      [registrationId, reviewerId, approvedBumDesaId]
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
        VALUES ($1, $2, 'bum_desa_registration', $3, 'APPROVE_REGISTRATION', $4::jsonb, $5::jsonb)
      `,
      [
        approvedBumDesaId,
        reviewerId,
        registrationId,
        JSON.stringify(registration),
        JSON.stringify(updatedResult.rows[0]),
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/platform/registrations");
  revalidatePath("/platform/dashboard");
}

export async function rejectBumDesaRegistration(formData: FormData) {
  const registrationId = String(formData.get("registrationId") ?? "");
  const note =
    String(formData.get("catatanReview") ?? "").trim() ||
    "Pendaftaran ditolak oleh Super Admin.";
  const reviewerId = await getReviewerId();

  if (!registrationId) {
    throw new Error("ID pendaftaran tidak valid.");
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const registrationResult = await client.query<RegistrationRecord>(
      `
        SELECT
          id::text,
          nama_bum_desa,
          kode_pendaftaran,
          nama_pendaftar,
          email_pendaftar,
          nomor_hp_pendaftar,
          jabatan_pendaftar,
          alamat,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          nib,
          status,
          catatan_review,
          reviewed_by::text,
          reviewed_at::text,
          approved_bum_desa_id::text
        FROM bum_desa_registration
        WHERE id = $1
        FOR UPDATE
      `,
      [registrationId]
    );

    const registration = registrationResult.rows[0];

    if (!registration) {
      throw new Error("Pendaftaran tidak ditemukan.");
    }

    if (registration.status !== "PENDING") {
      throw new Error("Pendaftaran ini sudah pernah direview.");
    }

    const updatedResult = await client.query<RegistrationRecord>(
      `
        UPDATE bum_desa_registration
        SET
          status = 'REJECTED',
          reviewed_by = $2,
          reviewed_at = NOW(),
          catatan_review = $3
        WHERE id = $1
        RETURNING
          id::text,
          nama_bum_desa,
          kode_pendaftaran,
          nama_pendaftar,
          email_pendaftar,
          nomor_hp_pendaftar,
          jabatan_pendaftar,
          alamat,
          desa,
          kecamatan,
          kabupaten,
          provinsi,
          nib,
          status,
          catatan_review,
          reviewed_by::text,
          reviewed_at::text,
          approved_bum_desa_id::text
      `,
      [registrationId, reviewerId, note]
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
        VALUES (NULL, $1, 'bum_desa_registration', $2, 'REJECT_REGISTRATION', $3::jsonb, $4::jsonb)
      `,
      [
        reviewerId,
        registrationId,
        JSON.stringify(registration),
        JSON.stringify(updatedResult.rows[0]),
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/platform/registrations");
  revalidatePath("/platform/dashboard");
}
