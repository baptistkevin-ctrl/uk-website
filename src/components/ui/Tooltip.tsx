"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

const sideStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
} as const;

const arrowStyles = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-(--color-text) border-x-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-(--color-text) border-x-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-(--color-text) border-y-transparent border-r-transparent",
  right: "right-full top-1/2 -translate-y-1/2 border-r-(--color-text) border-y-transparent border-l-transparent",
} as const;

function Tooltip({ content, children, side = "top" }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-(--z-tooltip,50)",
          "whitespace-nowrap rounded-md bg-(--color-text) px-3 py-2.5 text-xs text-white shadow-lg",
          "opacity-0 transition-opacity duration-150",
          "group-hover:opacity-100 group-focus-within:opacity-100",
          sideStyles[side]
        )}
      >
        {content}
        <span
          className={cn(
            "absolute border-4",
            arrowStyles[side]
          )}
        />
      </span>
    </span>
  );
}

export { Tooltip };
export type { TooltipProps };
