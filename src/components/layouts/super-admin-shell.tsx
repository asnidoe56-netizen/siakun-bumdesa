"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type NavItem = {
  label: string;
  href: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/platform/dashboard" },
  { label: "Pendaftaran BUMDes", href: "/platform/registrations" },
  { label: "Data BUMDes", href: "/platform/bumdes" },
  { label: "Pengguna", href: "/platform/users" },
  { label: "Template Transaksi", href: "/platform/templates" },
  { label: "Audit Log", href: "/platform/audit-log" },
];

type SuperAdminShellProps = {
  children: React.ReactNode;
};

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <div>
            <p className="text-sm font-semibold text-slate-950">SiAkun BUM Desa</p>
            <p className="text-xs text-slate-500">Super Admin Platform</p>
          </div>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                )}
              >
                {item.label}
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
              <div>
                <p className="text-sm font-semibold text-slate-950">SiAkun BUM Desa</p>
                <p className="text-xs text-slate-500">Super Admin Platform</p>
              </div>

              <Button variant="ghost" onClick={() => setMobileOpen(false)}>
                Tutup
              </Button>
            </div>

            <nav className="space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              Menu
            </Button>

            <div>
              <p className="text-sm font-semibold text-slate-950">Platform</p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Kelola pendaftaran dan data BUMDes
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-slate-950">Super Admin</p>
            <p className="hidden text-xs text-slate-500 sm:block">
              admin@siakun.local
            </p>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
