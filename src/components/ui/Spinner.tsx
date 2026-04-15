import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 28,
} as const;

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2
      size={sizeMap[size]}
      className={cn("animate-spin text-(--brand-primary)", className)}
    />
  );
}
