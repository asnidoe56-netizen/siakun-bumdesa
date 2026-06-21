import * as React from "react";
import { cn } from "@/lib/utils/cn";

type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <input
      type="checkbox"
      role="switch"
      className={cn(
        "h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-200 transition-colors",
        "before:block before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition-transform",
        "checked:bg-slate-900 checked:before:translate-x-4",
        "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
