"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function Checkbox({
  label,
  checked,
  onChange,
  onCheckedChange,
  error,
  disabled = false,
  className,
  children,
}: CheckboxProps) {
  const handleChange = onChange ?? onCheckedChange ?? (() => {});
  const id = useId();

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          id={id}
          role="checkbox"
          aria-checked={checked}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          onClick={() => handleChange(!checked)}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-(--color-border) transition-colors duration-(--duration-fast) ease-(--ease-out)",
            "focus-visible:ring-2 focus-visible:ring-(--brand-primary)/15 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked && "border-(--brand-primary) bg-(--brand-primary)",
            error && "border-(--color-error)",
          )}
        >
          {checked && (
            <Check
              className="h-3.5 w-3.5 text-white"
              strokeWidth={3}
              aria-hidden="true"
            />
          )}
        </button>

        <label
          htmlFor={id}
          className={cn(
            "cursor-pointer text-sm text-foreground",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {children ?? label}
        </label>
      </div>

      {error && (
        <p
          id={`${id}-error`}
          className="ml-[1.875rem] text-xs text-(--color-error)"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

Checkbox.displayName = "Checkbox";

export { Checkbox, type CheckboxProps };
