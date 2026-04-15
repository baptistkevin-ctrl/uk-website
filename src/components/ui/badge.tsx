import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "sale" | "new" | "organic" | "premium" | "out-of-stock"
  | "info" | "default" | "success" | "warning" | "secondary" | "destructive" | "outline";

const styles: Record<BadgeVariant, string> = {
  sale:           "bg-(--color-sale) text-white",
  new:            "bg-(--color-info) text-white",
  organic:        "bg-(--brand-primary) text-white",
  premium:        "bg-amber-800 text-white",
  "out-of-stock": "bg-(--color-text) text-white",
  info:           "bg-(--color-info-bg) text-(--color-info)",
  default:        "bg-(--color-elevated) text-foreground",
  success:        "bg-(--color-success-bg) text-(--color-success)",
  warning:        "bg-(--color-warning-bg) text-(--color-warning)",
  secondary:      "bg-(--color-elevated) text-(--color-text-secondary)",
  destructive:    "bg-(--color-error) text-white",
  outline:        "border border-(--color-border) text-(--color-text-secondary)",
};

const labels: Record<BadgeVariant, string> = {
  sale:           "SALE",
  new:            "NEW",
  organic:        "ORGANIC",
  premium:        "PREMIUM",
  "out-of-stock": "OUT OF STOCK",
  info:           "INFO",
  default:        "",
  success:        "",
  warning:        "",
  secondary:      "",
  destructive:    "",
  outline:        "",
};

export interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ variant = "default", label, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        styles[variant],
        className
      )}
    >
      {children ?? label ?? labels[variant]}
    </span>
  );
}
