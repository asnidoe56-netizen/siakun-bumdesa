import * as React from "react";
import { cn } from "@/lib/utils/cn";

type TopbarUserProps = {
  name: string;
  email?: string;
  align?: "left" | "right";
  className?: string;
};

export function TopbarUser({
  name,
  email,
  align = "right",
  className,
}: TopbarUserProps) {
  return (
    <div
      className={cn(
        align === "right" ? "text-right" : "text-left",
        className
      )}
    >
      <p className="text-sm font-medium text-slate-950">{name}</p>

      {email ? (
        <p className="hidden text-xs text-slate-500 sm:block">{email}</p>
      ) : null}
    </div>
  );
}
