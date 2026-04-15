import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StarRatingProps {
  value: number;
  count?: number;
  size?: "sm" | "md";
}

const sizeConfig = {
  sm: { star: 11, countClass: "text-[11px]" },
  md: { star: 14, countClass: "text-xs" },
} as const;

export function StarRating({ value, count, size = "md" }: StarRatingProps) {
  const { star, countClass } = sizeConfig[size];
  const filled = Math.round(value);

  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={star}
          className={cn(
            i < filled
              ? "fill-amber-400 text-amber-400"
              : "fill-(--color-border) text-(--color-border)"
          )}
        />
      ))}
      {count !== undefined && (
        <span className={cn("ml-1 text-(--color-text-muted)", countClass)}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}
