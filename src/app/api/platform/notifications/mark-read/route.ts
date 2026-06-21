import { NextResponse } from "next/server";
import { db } from "@/lib/db/pool";

export const runtime = "nodejs";

export async function POST() {
  const result = await db.query<{ id: string }>(
    `
      UPDATE app_notification
      SET
        status = 'READ',
        read_at = COALESCE(read_at, NOW())
      WHERE target_role = 'super_admin_platform'
        AND status = 'UNREAD'
      RETURNING id::text
    `
  );

  return NextResponse.json({
    updated: result.rowCount ?? 0,
  });
}
