"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  status: "UNREAD" | "READ";
  created_at: string;
};

type NotificationBellProps = {
  unreadCount: number;
  notifications: NotificationItem[];
};

const notificationBellStyles = {
  root: "relative",
  trigger: "relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
  icon: "h-5 w-5",
  counter: "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white",
  panel: "fixed left-4 right-4 top-20 z-50 max-h-[calc(100dvh-6rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96 sm:max-h-[32rem]",
  header: "flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3",
  title: "text-sm font-semibold text-slate-950",
  list: "max-h-[calc(100dvh-12rem)] overflow-y-auto sm:max-h-96",
  item: "block border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50",
  itemTitle: "text-sm font-semibold text-slate-950",
  itemMessage: "mt-1 text-sm leading-5 text-slate-500",
  itemMeta: "mt-2 flex flex-wrap items-center justify-between gap-2",
  time: "text-xs text-slate-400",
  empty: "p-4",
};

function formatNotificationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function NotificationBell({
  unreadCount,
  notifications,
}: NotificationBellProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (rootRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={notificationBellStyles.root}>
      <button
        type="button"
        className={notificationBellStyles.trigger}
        aria-label="Buka notifikasi"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className={notificationBellStyles.icon} />

        {unreadCount > 0 ? (
          <span className={notificationBellStyles.counter}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className={notificationBellStyles.panel}>
          <div className={notificationBellStyles.header}>
            <p className={notificationBellStyles.title}>Notifikasi</p>
            <Badge variant={unreadCount > 0 ? "danger" : "muted"}>
              {unreadCount} belum dibaca
            </Badge>
          </div>

          {notifications.length > 0 ? (
            <div className={notificationBellStyles.list}>
              {notifications.map((notification) => {
                const content = (
                  <>
                    <p className={notificationBellStyles.itemTitle}>
                      {notification.title}
                    </p>
                    <p className={notificationBellStyles.itemMessage}>
                      {notification.message}
                    </p>
                    <div className={notificationBellStyles.itemMeta}>
                      <span className={notificationBellStyles.time}>
                        {formatNotificationTime(notification.created_at)}
                      </span>
                      <Badge
                        variant={
                          notification.status === "UNREAD" ? "warning" : "muted"
                        }
                      >
                        {notification.status === "UNREAD"
                          ? "Baru"
                          : "Dibaca"}
                      </Badge>
                    </div>
                  </>
                );

                if (notification.href) {
                  return (
                    <Link
                      key={notification.id}
                      href={notification.href}
                      className={notificationBellStyles.item}
                      onClick={() => setOpen(false)}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={notification.id}
                    className={notificationBellStyles.item}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={notificationBellStyles.empty}>
              <EmptyState
                title="Belum ada notifikasi"
                description="Notifikasi penting platform akan tampil di sini."
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
