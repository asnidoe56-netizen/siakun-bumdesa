import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ResponsiveGridProps = React.HTMLAttributes<HTMLDivElement> & {
  columns?: 1 | 2 | 3 | 4;
};

export function ResponsiveGrid({
  className,
  columns = 3,
  ...props
}: ResponsiveGridProps) {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  };

  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5 lg:gap-6",
        columnClasses[columns],
        className
      )}
      {...props}
    />
  );
}
