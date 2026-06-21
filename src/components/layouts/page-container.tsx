import * as React from "react";
import { cn } from "@/lib/utils/cn";

type PageContainerProps = React.HTMLAttributes<HTMLDivElement>;

export function PageContainer({ className, ...props }: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-7xl px-4 py-4",
        "sm:px-6 sm:py-6",
        "lg:px-8 lg:py-8",
        className
      )}
      {...props}
    />
  );
}
