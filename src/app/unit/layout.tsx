import type { ReactNode } from "react";
import { UnitShell } from "@/components/layouts/unit-shell";
import { getUnitNavigation } from "@/lib/unit/get-unit-navigation";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

export default async function UnitLayout({ children }: { children: ReactNode }) {
  const context = await getUnitWorkContext();
  const navItems = getUnitNavigation(context.businessCategoryCode);

  return <UnitShell navItems={navItems}>{children}</UnitShell>;
}