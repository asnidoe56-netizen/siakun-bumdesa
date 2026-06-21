"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { SidebarBrand } from "@/components/layouts/sidebar-brand";
import { TopbarUser } from "@/components/layouts/topbar-user";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type UnitShellProps = {
  children: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/unit/dashboard", icon: LayoutDashboard },
  { label: "Catat Transaksi", href: "/unit/dashboard/catat-transaksi", icon: FileText },
];

const unitShellStyles = {
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
  topbar: {
    root: "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8",
    left: "flex items-center gap-3",
    mobileMenuButton: "h-10 w-10 px-0 lg:hidden",
    menuIcon: "h-5 w-5",
    contextTitle: "text-sm font-semibold text-slate-950",
    contextDescription: "hidden text-xs text-slate-500 sm:block",
    right: "flex items-center gap-3",
  },
};

export function UnitShell({ children }: UnitShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);

  return (
    <div className={unitShellStyles.root}>
      <aside
        className={cn(
          unitShellStyles.desktopSidebar.base,
          desktopCollapsed
            ? unitShellStyles.desktopSidebar.collapsed
            : unitShellStyles.desktopSidebar.expanded
        )}
      >
        <div
          className={cn(
            unitShellStyles.sidebarHeader.base,
            desktopCollapsed
              ? unitShellStyles.sidebarHeader.collapsed
              : unitShellStyles.sidebarHeader.expanded
          )}
        >
          <SidebarBrand
            collapsed={desktopCollapsed}
            title="SiAkun BUM Desa"
            subtitle="Unit Usaha"
            shortLabel="UN"
          />

          {!desktopCollapsed ? (
            <Button
              variant="ghost"
              className={unitShellStyles.iconButton}
              aria-label="Sembunyikan sidebar"
              onClick={() => setDesktopCollapsed(true)}
            >
              <PanelLeftClose className={unitShellStyles.icon} />
            </Button>
          ) : null}
        </div>

        {desktopCollapsed ? (
          <div className={unitShellStyles.collapseAction}>
            <Button
              variant="ghost"
              className={unitShellStyles.iconButton}
              aria-label="Tampilkan sidebar"
              onClick={() => setDesktopCollapsed(false)}
            >
              <PanelLeftOpen className={unitShellStyles.icon} />
            </Button>
          </div>
        ) : null}

        <nav
          className={cn(
            unitShellStyles.nav.base,
            desktopCollapsed
              ? unitShellStyles.nav.collapsed
              : unitShellStyles.nav.expanded
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
                  unitShellStyles.navLink.base,
                  desktopCollapsed
                    ? unitShellStyles.navLink.collapsed
                    : unitShellStyles.navLink.expanded,
                  active
                    ? unitShellStyles.navLink.active
                    : unitShellStyles.navLink.inactive
                )}
              >
                <Icon className={unitShellStyles.navIcon} />

                {!desktopCollapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen ? (
        <div className={unitShellStyles.mobileOverlay}>
          <button
            type="button"
            aria-label="Tutup menu"
            className={unitShellStyles.mobileBackdrop}
            onClick={() => setMobileOpen(false)}
          />

          <aside className={unitShellStyles.mobileSidebar}>
            <div className={unitShellStyles.mobileHeader}>
              <SidebarBrand title="SiAkun BUM Desa" subtitle="Unit Usaha" />

              <Button
                variant="ghost"
                className={unitShellStyles.iconButton}
                aria-label="Tutup menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className={unitShellStyles.icon} />
              </Button>
            </div>

            <nav className={unitShellStyles.mobileNav}>
              {navItems.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      unitShellStyles.navLink.base,
                      unitShellStyles.navLink.expanded,
                      active
                        ? unitShellStyles.navLink.active
                        : unitShellStyles.navLink.inactive
                    )}
                  >
                    <Icon className={unitShellStyles.navIcon} />
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
          unitShellStyles.content.base,
          desktopCollapsed
            ? unitShellStyles.content.collapsed
            : unitShellStyles.content.expanded
        )}
      >
        <header className={unitShellStyles.topbar.root}>
          <div className={unitShellStyles.topbar.left}>
            <Button
              variant="secondary"
              className={unitShellStyles.topbar.mobileMenuButton}
              aria-label="Buka menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className={unitShellStyles.topbar.menuIcon} />
            </Button>

            <div>
              <p className={unitShellStyles.topbar.contextTitle}>Unit Usaha</p>
              <p className={unitShellStyles.topbar.contextDescription}>
                Catat transaksi dan pantau pembukuan unit
              </p>
            </div>
          </div>

          <div className={unitShellStyles.topbar.right}>
            <TopbarUser name="Operator Unit" email="operator@siakun.local" />
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}