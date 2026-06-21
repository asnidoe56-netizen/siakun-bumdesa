"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { PlatformTopbar } from "@/components/layouts/platform-topbar";
import type { NotificationItem } from "@/components/layouts/notification-bell";
import { SidebarBrand } from "@/components/layouts/sidebar-brand";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type SuperAdminShellProps = {
  children: React.ReactNode;
  unreadCount?: number;
  notifications?: NotificationItem[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/platform/dashboard", icon: LayoutDashboard },
  { label: "Pendaftaran BUMDes", href: "/platform/registrations", icon: ClipboardList },
  { label: "Data BUMDes", href: "/platform/bumdes", icon: Building2 },
  { label: "Pengguna", href: "/platform/users", icon: Users },
  { label: "Template Transaksi", href: "/platform/templates", icon: FileText },
  { label: "Audit Log", href: "/platform/audit-log", icon: ScrollText },
];

const superAdminShellStyles = {
  root: "min-h-screen bg-slate-50",
  desktopSidebar: {
    base: "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-all duration-300 lg:block",
    expanded: "w-72",
    collapsed: "w-20",
  },
  sidebarHeader: {
    base: "flex h-16 items-center border-b border-slate-200 px-4",
    expanded: "justify-between",
    collapsed: "justify-center",
  },
  iconButton: "h-9 w-9 px-0",
  icon: "h-4 w-4",
  collapseAction: "flex justify-center border-b border-slate-100 py-3",
  nav: {
    base: "space-y-1 py-4",
    expanded: "px-3",
    collapsed: "px-2",
  },
  navLink: {
    base: "flex items-center rounded-lg text-sm font-medium transition-colors",
    expanded: "gap-3 px-3 py-2",
    collapsed: "justify-center px-3 py-3",
    active: "bg-slate-900 text-white",
    inactive: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  },
  navIcon: "h-4 w-4 shrink-0",
  mobileOverlay: "fixed inset-0 z-50 lg:hidden",
  mobileBackdrop: "absolute inset-0 bg-slate-950/50",
  mobileSidebar: "relative h-full w-80 max-w-[85vw] border-r border-slate-200 bg-white shadow-xl",
  mobileHeader: "flex h-16 items-center justify-between border-b border-slate-200 px-4",
  mobileNav: "space-y-1 px-3 py-4",
  content: {
    base: "transition-all duration-300",
    expanded: "lg:pl-72",
    collapsed: "lg:pl-20",
  },
};

export function SuperAdminShell({
  children,
  unreadCount = 0,
  notifications = [],
}: SuperAdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);

  return (
    <div className={superAdminShellStyles.root}>
      <aside
        className={cn(
          superAdminShellStyles.desktopSidebar.base,
          desktopCollapsed
            ? superAdminShellStyles.desktopSidebar.collapsed
            : superAdminShellStyles.desktopSidebar.expanded
        )}
      >
        <div
          className={cn(
            superAdminShellStyles.sidebarHeader.base,
            desktopCollapsed
              ? superAdminShellStyles.sidebarHeader.collapsed
              : superAdminShellStyles.sidebarHeader.expanded
          )}
        >
          <SidebarBrand
            collapsed={desktopCollapsed}
            title="SiAkun BUM Desa"
            subtitle="Super Admin Platform"
            shortLabel="SA"
          />

          {!desktopCollapsed ? (
            <Button
              variant="ghost"
              className={superAdminShellStyles.iconButton}
              aria-label="Sembunyikan sidebar"
              onClick={() => setDesktopCollapsed(true)}
            >
              <PanelLeftClose className={superAdminShellStyles.icon} />
            </Button>
          ) : null}
        </div>

        {desktopCollapsed ? (
          <div className={superAdminShellStyles.collapseAction}>
            <Button
              variant="ghost"
              className={superAdminShellStyles.iconButton}
              aria-label="Tampilkan sidebar"
              onClick={() => setDesktopCollapsed(false)}
            >
              <PanelLeftOpen className={superAdminShellStyles.icon} />
            </Button>
          </div>
        ) : null}

        <nav
          className={cn(
            superAdminShellStyles.nav.base,
            desktopCollapsed
              ? superAdminShellStyles.nav.collapsed
              : superAdminShellStyles.nav.expanded
          )}
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={desktopCollapsed ? item.label : undefined}
                className={cn(
                  superAdminShellStyles.navLink.base,
                  desktopCollapsed
                    ? superAdminShellStyles.navLink.collapsed
                    : superAdminShellStyles.navLink.expanded,
                  active
                    ? superAdminShellStyles.navLink.active
                    : superAdminShellStyles.navLink.inactive
                )}
              >
                <Icon className={superAdminShellStyles.navIcon} />

                {!desktopCollapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen ? (
        <div className={superAdminShellStyles.mobileOverlay}>
          <button
            type="button"
            aria-label="Tutup menu"
            className={superAdminShellStyles.mobileBackdrop}
            onClick={() => setMobileOpen(false)}
          />

          <aside className={superAdminShellStyles.mobileSidebar}>
            <div className={superAdminShellStyles.mobileHeader}>
              <SidebarBrand
                title="SiAkun BUM Desa"
                subtitle="Super Admin Platform"
              />

              <Button
                variant="ghost"
                className={superAdminShellStyles.iconButton}
                aria-label="Tutup menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className={superAdminShellStyles.icon} />
              </Button>
            </div>

            <nav className={superAdminShellStyles.mobileNav}>
              {navItems.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      superAdminShellStyles.navLink.base,
                      superAdminShellStyles.navLink.expanded,
                      active
                        ? superAdminShellStyles.navLink.active
                        : superAdminShellStyles.navLink.inactive
                    )}
                  >
                    <Icon className={superAdminShellStyles.navIcon} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}

      <div
        className={cn(
          superAdminShellStyles.content.base,
          desktopCollapsed
            ? superAdminShellStyles.content.collapsed
            : superAdminShellStyles.content.expanded
        )}
      >
        <PlatformTopbar
          onOpenMobileMenu={() => setMobileOpen(true)}
          unreadCount={unreadCount}
          notifications={notifications}
        />

        {children}
      </div>
    </div>
  );
}
