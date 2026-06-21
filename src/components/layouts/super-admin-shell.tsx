"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { TopbarUser } from "@/components/layouts/topbar-user";
import { SidebarBrand } from "@/components/layouts/sidebar-brand";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/platform/dashboard", icon: LayoutDashboard },
  { label: "Pendaftaran BUMDes", href: "/platform/registrations", icon: ClipboardList },
  { label: "Data BUMDes", href: "/platform/bumdes", icon: Building2 },
  { label: "Pengguna", href: "/platform/users", icon: Users },
  { label: "Template Transaksi", href: "/platform/templates", icon: FileText },
  { label: "Audit Log", href: "/platform/audit-log", icon: ScrollText },
];

type SuperAdminShellProps = {
  children: React.ReactNode;
};

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-all duration-300 lg:block",
          desktopCollapsed ? "w-20" : "w-72"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-slate-200 px-4",
            desktopCollapsed ? "justify-center" : "justify-between"
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
              className="h-9 w-9 px-0"
              aria-label="Sembunyikan sidebar"
              onClick={() => setDesktopCollapsed(true)}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        {desktopCollapsed ? (
          <div className="flex justify-center border-b border-slate-100 py-3">
            <Button
              variant="ghost"
              className="h-9 w-9 px-0"
              aria-label="Tampilkan sidebar"
              onClick={() => setDesktopCollapsed(false)}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <nav className={cn("space-y-1 py-4", desktopCollapsed ? "px-2" : "px-3")}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={desktopCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  desktopCollapsed ? "justify-center px-3 py-3" : "gap-3 px-3 py-2",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />

                {!desktopCollapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="relative h-full w-80 max-w-[85vw] border-r border-slate-200 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <SidebarBrand
                title="SiAkun BUM Desa"
                subtitle="Super Admin Platform"
              />

              <Button
                variant="ghost"
                className="h-9 w-9 px-0"
                aria-label="Tutup menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
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
          "transition-all duration-300",
          desktopCollapsed ? "lg:pl-20" : "lg:pl-72"
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="h-10 w-10 px-0 lg:hidden"
              aria-label="Buka menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div>
              <p className="text-sm font-semibold text-slate-950">Platform</p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Kelola pendaftaran dan data BUMDes
              </p>
            </div>
          </div>

          <TopbarUser name="Super Admin" email="admin@siakun.local" />
        </header>

        {children}
      </div>
    </div>
  );
}





