import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  description,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>

      {children}

      {description ? (
        <p className="text-xs leading-5 text-slate-500">{description}</p>
      ) : null}

      {error ? (
        <p className="text-xs font-medium leading-5 text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
