"use client";

import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
} from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  label?: string;
  error?: string;
  helpText?: string;
  type?: "text" | "email" | "password" | "search" | "number" | "tel" | "url" | "date" | "time" | "file" | "hidden" | "datetime-local" | "color" | "range" | "month" | "week";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, type = "text", className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const isSearch = type === "search";

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {isSearch && (
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)"
              aria-hidden="true"
            />
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helpText
                  ? `${inputId}-help`
                  : undefined
            }
            className={cn(
              "flex h-12 w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm text-foreground placeholder:text-(--color-text-muted) transition-colors duration-(--duration-fast) ease-(--ease-out)",
              "focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/30 focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isSearch && "pl-10",
              error && "border-(--color-error) focus:border-(--color-error) focus:ring-(--color-error)/15",
              className,
            )}
            {...props}
          />
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-(--color-error)"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helpText && (
          <p
            id={`${inputId}-help`}
            className="text-xs text-(--color-text-muted)"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input, type InputProps };
