"use client";

import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
} from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends ComponentPropsWithoutRef<"textarea"> {
  label?: string;
  error?: string;
  helpText?: string;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, helpText, maxLength, showCount, className, id, value, defaultValue, onChange, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    const currentLength =
      typeof value === "string"
        ? value.length
        : typeof defaultValue === "string"
          ? defaultValue.length
          : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${textareaId}-error`
                : helpText
                  ? `${textareaId}-help`
                  : undefined
            }
            className={cn(
              "flex min-h-[6.25rem] w-full resize-y rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm text-foreground placeholder:text-(--color-text-muted) transition-colors duration-(--duration-fast) ease-(--ease-out)",
              "focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/30 focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-(--color-error) focus:border-(--color-error) focus:ring-(--color-error)/15",
              showCount && maxLength && "pb-7",
              className,
            )}
            {...props}
          />

          {showCount && maxLength && (
            <span
              className="pointer-events-none absolute bottom-2 right-3 text-xs text-(--color-text-muted)"
              aria-live="polite"
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>

        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-xs text-(--color-error)"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helpText && (
          <p
            id={`${textareaId}-help`}
            className="text-xs text-(--color-text-muted)"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea, type TextareaProps };
