"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: [
          "rounded-lg bg-(--brand-amber) text-white",
          "shadow-(--shadow-amber)",
          "duration-(--duration-fast) ease-(--ease-premium)",
          "hover:-translate-y-0.5 hover:bg-(--brand-amber-hover)",
          "hover:shadow-[0_12px_30px_rgba(232,134,26,0.4)]",
          "active:translate-y-0 active:shadow-(--shadow-amber)",
          "focus-visible:ring-(--brand-amber)",
        ],
        secondary: [
          "rounded-lg bg-(--brand-primary) text-white",
          "duration-(--duration-fast) ease-(--ease-premium)",
          "hover:-translate-y-0.5 hover:bg-(--brand-primary-hover)",
          "hover:shadow-(--shadow-green)",
          "active:translate-y-0",
          "focus-visible:ring-(--brand-primary)",
        ],
        ghost: [
          "rounded-lg border border-(--color-border)",
          "bg-transparent text-foreground",
          "duration-(--duration-fast) ease-(--ease-premium)",
          "hover:bg-(--color-elevated) hover:border-(--color-border-strong)",
          "focus-visible:ring-(--color-border)",
        ],
        danger: [
          "rounded-lg bg-(--color-error) text-white",
          "duration-(--duration-fast) ease-(--ease-premium)",
          "hover:-translate-y-0.5 hover:bg-red-700",
          "active:translate-y-0",
          "focus-visible:ring-(--color-error)",
        ],
        icon: [
          "rounded-md border border-(--color-border)",
          "bg-(--color-surface) text-(--color-text-secondary)",
          "duration-(--duration-fast) ease-(--ease-premium)",
          "hover:bg-(--color-elevated) hover:text-foreground",
          "focus-visible:ring-(--brand-primary)",
        ],
        default: [
          "rounded-lg bg-(--brand-amber) text-white",
          "shadow-(--shadow-amber)",
          "duration-(--duration-fast) ease-(--ease-premium)",
          "hover:-translate-y-0.5 hover:bg-(--brand-amber-hover)",
          "hover:shadow-[0_12px_30px_rgba(232,134,26,0.4)]",
          "active:translate-y-0 active:shadow-(--shadow-amber)",
          "focus-visible:ring-(--brand-amber)",
        ],
        outline: [
          "rounded-lg border border-(--color-border)",
          "bg-transparent text-foreground",
          "duration-(--duration-fast) ease-(--ease-premium)",
          "hover:bg-(--color-elevated) hover:border-(--color-border-strong)",
          "focus-visible:ring-(--color-border)",
        ],
        destructive: [
          "rounded-lg bg-(--color-error) text-white",
          "duration-(--duration-fast) ease-(--ease-premium)",
          "hover:-translate-y-0.5 hover:bg-red-700",
          "active:translate-y-0",
          "focus-visible:ring-(--color-error)",
        ],
        link: [
          "text-(--brand-primary) underline-offset-4 hover:underline",
          "focus-visible:ring-(--brand-primary)",
        ],
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
