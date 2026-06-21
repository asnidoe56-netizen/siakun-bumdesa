import { db } from "@/lib/db/pool";

export type PlatformNotification = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  status: "UNREAD" | "READ";
  created_at: string;
};

export type PlatformNotificationSummary = {
  unreadCount: number;
  notifications: PlatformNotification[];
};

export async function getPlatformNotifications(): Promise<PlatformNotificationSummary> {
  const [notificationsResult, unreadCountResult] = await Promise.all([
    db.query<PlatformNotification>(
      `
        SELECT
          id::text,
          title,
          message,
          href,
          status,
          created_at::text
        FROM app_notification
        WHERE target_role = 'super_admin_platform'
        ORDER BY created_at DESC
        LIMIT 10
      `
    ),
    db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM app_notification
        WHERE target_role = 'super_admin_platform'
          AND status = 'UNREAD'
      `
    ),
  ]);

  return {
    unreadCount: Number(unreadCountResult.rows[0]?.total ?? 0),
    notifications: notificationsResult.rows,
  };
}
