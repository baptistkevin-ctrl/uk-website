"use client";

import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
} from "react";
import { ChevronDown } from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";

/* ── Radix Select (used by existing pages) ── */
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-12 w-full items-center justify-between rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-sm text-foreground transition-colors",
      "focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/30 focus:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "[&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-(--color-text-muted)" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-(--z-dropdown) max-h-60 min-w-[8rem] overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-xl)",
        "data-state-open:animate-in data-state-open:fade-in-0 data-state-open:zoom-in-95",
        "data-state-closed:animate-out data-state-closed:fade-out-0 data-state-closed:zoom-out-95",
        position === "popper" && "data-side-bottom:translate-y-1 data-side-top:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" && "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-md py-2 pl-3 pr-8 text-sm outline-none",
      "text-foreground data-highlighted:bg-(--color-elevated) data-highlighted:text-foreground",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectLabel = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-3 py-2.5 text-xs font-semibold text-(--color-text-muted)", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectSeparator = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-(--color-border)", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

/* ── Native Select (new design system component) ── */
interface NativeSelectOption {
  value: string;
  label: string;
}

interface NativeSelectProps extends ComponentPropsWithoutRef<"select"> {
  label?: string;
  error?: string;
  options: NativeSelectOption[];
  placeholder?: string;
}

const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : undefined}
            className={cn(
              "flex h-12 w-full appearance-none rounded-lg border border-(--color-border) bg-(--color-surface) px-3 pr-10 text-sm text-foreground transition-colors",
              "focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/30 focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-(--color-error)",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p id={`${selectId}-error`} className="text-xs text-(--color-error)" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
NativeSelect.displayName = "NativeSelect";

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  NativeSelect,
  type NativeSelectProps,
  type NativeSelectOption,
};
