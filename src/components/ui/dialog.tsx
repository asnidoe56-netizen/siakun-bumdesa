import * as React from "react";
import { cn } from "@/lib/utils/cn";

type DialogProps = React.HTMLAttributes<HTMLDivElement> & {
  open: boolean;
};

export function Dialog({ open, className, children, ...props }: DialogProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl",
        "max-h-[90vh] overflow-y-auto",
        className
      )}
      {...props}
    />
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-b border-slate-100 px-5 py-4", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base font-semibold text-slate-950", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 text-sm leading-6 text-slate-500", className)}
      {...props}
    />
  );
}

export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-5", className)} {...props} />;
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4",
        "sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}
