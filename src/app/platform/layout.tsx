import { SuperAdminShell } from "@/components/layouts/super-admin-shell";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminShell>{children}</SuperAdminShell>;
}
