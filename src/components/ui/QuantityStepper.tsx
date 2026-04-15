"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
}: QuantityStepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className="inline-flex items-center border border-(--color-border) rounded-md">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={atMin}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(
          "flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center transition-colors",
          "hover:bg-(--color-border)",
          atMin && "opacity-40 pointer-events-none"
        )}
      >
        <Minus size={14} />
      </button>

      <div className="flex h-10 w-10 sm:h-9 sm:w-10 items-center justify-center border-x border-(--color-border)">
        <span className="font-mono text-sm font-medium tabular-nums">
          {value}
        </span>
      </div>

      <button
        type="button"
        aria-label="Increase quantity"
        disabled={atMax}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(
          "flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center transition-colors",
          "hover:bg-(--color-border)",
          atMax && "opacity-40 pointer-events-none"
        )}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
