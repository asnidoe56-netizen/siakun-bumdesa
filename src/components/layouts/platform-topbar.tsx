"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layouts/notification-bell";
import type { NotificationItem } from "@/components/layouts/notification-bell";
import { TopbarUser } from "@/components/layouts/topbar-user";

type PlatformTopbarProps = {
  onOpenMobileMenu: () => void;
  unreadCount: number;
  notifications: NotificationItem[];
};

const platformTopbarStyles = {
  root: "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8",
  left: "flex items-center gap-3",
  mobileMenuButton: "h-10 w-10 px-0 lg:hidden",
  menuIcon: "h-5 w-5",
  context: {
    root: "",
    title: "text-sm font-semibold text-slate-950",
    description: "hidden text-xs text-slate-500 sm:block",
  },
  right: "flex items-center gap-3",
};

export function PlatformTopbar({
  onOpenMobileMenu,
  unreadCount,
  notifications,
}: PlatformTopbarProps) {
  return (
    <header className={platformTopbarStyles.root}>
      <div className={platformTopbarStyles.left}>
        <Button
          variant="secondary"
          className={platformTopbarStyles.mobileMenuButton}
          aria-label="Buka menu"
          onClick={onOpenMobileMenu}
        >
          <Menu className={platformTopbarStyles.menuIcon} />
        </Button>

        <div className={platformTopbarStyles.context.root}>
          <p className={platformTopbarStyles.context.title}>Platform</p>
          <p className={platformTopbarStyles.context.description}>
            Kelola pendaftaran dan data BUMDes
          </p>
        </div>
      </div>

      <div className={platformTopbarStyles.right}>
        <NotificationBell
          unreadCount={unreadCount}
          notifications={notifications}
        />

        <TopbarUser name="Super Admin" email="admin@siakun.local" />
      </div>
    </header>
  );
}
