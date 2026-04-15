import { cn } from "@/lib/utils/cn";

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  unit?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { price: "text-base", secondary: "text-xs" },
  md: { price: "text-lg", secondary: "text-sm" },
  lg: { price: "text-2xl", secondary: "text-base" },
} as const;

export function PriceDisplay({
  price,
  originalPrice,
  unit,
  size = "md",
  className,
}: PriceDisplayProps) {
  const { price: priceClass, secondary } = sizeConfig[size];

  return (
    <div className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span
        className={cn(
          "font-mono font-bold text-foreground",
          priceClass
        )}
      >
        &pound;{price.toFixed(2)}
      </span>

      {originalPrice !== undefined && (
        <span
          className={cn(
            "font-mono text-(--color-text-muted) line-through",
            secondary
          )}
        >
          &pound;{originalPrice.toFixed(2)}
        </span>
      )}

      {unit && (
        <span className={cn("text-(--color-text-muted)", secondary)}>
          {unit}
        </span>
      )}
    </div>
  );
}
