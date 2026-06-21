import { cn } from "@/lib/utils/cn";

type SidebarBrandProps = {
  collapsed?: boolean;
  title: string;
  subtitle?: string;
  shortLabel?: string;
  className?: string;
};

export function SidebarBrand({
  collapsed = false,
  title,
  subtitle,
  shortLabel = "SA",
  className,
}: SidebarBrandProps) {
  if (collapsed) {
    return (
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white",
          className
        )}
      >
        {shortLabel}
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-sm font-semibold text-slate-950">{title}</p>

      {subtitle ? (
        <p className="text-xs text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  );
}
