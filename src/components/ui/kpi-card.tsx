import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";

type KpiCardProps = {
  title: string;
  value: string | number;
  description?: string;
  className?: string;
};

export function KpiCard({
  title,
  value,
  description,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4 sm:p-5">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          {value}
        </p>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
