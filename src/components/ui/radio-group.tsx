import * as React from "react";
import { cn } from "@/lib/utils/cn";

type RadioOption = {
  label: string;
  value: string;
  description?: string;
};

type RadioGroupProps = {
  name: string;
  value?: string;
  defaultValue?: string;
  options: RadioOption[];
  onChange?: (value: string) => void;
  className?: string;
};

export function RadioGroup({
  name,
  value,
  defaultValue,
  options,
  onChange,
  className,
}: RadioGroupProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        const checked = value ? value === option.value : undefined;

        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              "flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors",
              "hover:bg-slate-50",
              checked ? "border-slate-900 ring-1 ring-slate-900" : null
            )}
          >
            <input
              id={id}
              name={name}
              type="radio"
              value={option.value}
              checked={checked}
              defaultChecked={!value && defaultValue === option.value}
              onChange={(event) => onChange?.(event.target.value)}
              className="mt-1 h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900"
            />

            <span>
              <span className="block text-sm font-medium text-slate-900">
                {option.label}
              </span>

              {option.description ? (
                <span className="mt-1 block text-sm leading-5 text-slate-500">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
