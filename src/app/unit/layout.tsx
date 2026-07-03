import type { ReactNode } from "react";
import { UnitShell } from "@/components/layouts/unit-shell";
import { getUnitNavigation } from "@/lib/unit/get-unit-navigation";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

export default async function UnitLayout({ children }: { children: ReactNode }) {
  const context = await getUnitWorkContext();
  const navItems = getUnitNavigation(context.businessCategoryCode);
  const isCentralOffice = context.unitType === "kantor_pusat";

  return (
    <UnitShell
      navItems={navItems}
      brandSubtitle={isCentralOffice ? "Kantor Pusat" : "Unit Usaha"}
      brandShortLabel={isCentralOffice ? "PU" : "UN"}
      contextTitle={isCentralOffice ? "Kantor Pusat" : "Unit Usaha"}
      contextDescription={`${context.bumDesaName} • ${context.unitUsahaName}`}
      userName={context.userName}
      userEmail={
        context.isDevelopmentFallback
          ? "development@siakun.local"
          : "operator@siakun.local"
      }
    >
      {children}
    </UnitShell>
  );
}