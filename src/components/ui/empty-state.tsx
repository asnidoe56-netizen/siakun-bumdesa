import * as React from "react";
import { cn } from "@/lib/utils/cn";

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center",
        "sm:px-6",
        className
      )}
      {...props}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <span className="text-xl">?</span>
      </div>

      <h3 className="text-base font-semibold text-slate-950">{title}</h3>

      {description ? (
        <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
