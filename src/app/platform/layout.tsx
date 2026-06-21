import type { ReactNode } from "react";
import { SuperAdminShell } from "@/components/layouts/super-admin-shell";
import { getPlatformNotifications } from "@/lib/notifications/get-platform-notifications";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const notificationSummary = await getPlatformNotifications();

  return (
    <SuperAdminShell
      unreadCount={notificationSummary.unreadCount}
      notifications={notificationSummary.notifications}
    >
      {children}
    </SuperAdminShell>
  );
}
