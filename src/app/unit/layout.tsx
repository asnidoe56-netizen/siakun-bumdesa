import type { ReactNode } from "react";
import { UnitShell } from "@/components/layouts/unit-shell";

export const dynamic = "force-dynamic";

export default function UnitLayout({ children }: { children: ReactNode }) {
  return <UnitShell>{children}</UnitShell>;
}