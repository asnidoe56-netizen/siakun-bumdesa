import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ResponsiveStackProps = React.HTMLAttributes<HTMLDivElement> & {
  direction?: "vertical" | "responsive";
  gap?: "sm" | "md" | "lg";
};

export function ResponsiveStack({
  className,
  direction = "responsive",
  gap = "md",
  ...props
}: ResponsiveStackProps) {
  const directionClass =
    direction === "vertical"
      ? "flex flex-col"
      : "flex flex-col sm:flex-row sm:items-center";

  const gapClass = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  };

  return (
    <div
      className={cn(
        directionClass,
        gapClass[gap],
        className
      )}
      {...props}
    />
  );
}
