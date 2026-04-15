"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  side?: "left" | "right";
}

const slideVariants = {
  left: {
    position: "inset-y-0 left-0",
    open: "data-state-open:slide-in-from-left",
    closed: "data-state-closed:slide-out-to-left",
  },
  right: {
    position: "inset-y-0 right-0",
    open: "data-state-open:slide-in-from-right",
    closed: "data-state-closed:slide-out-to-right",
  },
} as const;

function Drawer({
  open,
  onOpenChange,
  title,
  children,
  side = "right",
}: DrawerProps) {
  const variant = slideVariants[side];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-(--z-modal) bg-black/50 backdrop-blur-sm",
            "data-state-open:animate-in data-state-open:fade-in-0",
            "data-state-closed:animate-out data-state-closed:fade-out-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-(--z-modal) h-full w-[320px] sm:w-[380px]",
            variant.position,
            "bg-(--color-surface) shadow-(--shadow-2xl)",
            "animate-in data-state-open:animate-in data-state-closed:animate-out",
            variant.open,
            variant.closed,
            "data-state-open:fade-in-0 data-state-closed:fade-out-0",
            "data-state-closed:duration-300 data-state-open:duration-300",
            "focus:outline-none"
          )}
        >
          <div className="flex h-full flex-col overflow-y-auto p-6">
            <div className="flex items-center justify-between">
              {title && (
                <DialogPrimitive.Title className="font-display text-lg font-semibold text-foreground">
                  {title}
                </DialogPrimitive.Title>
              )}
              {!title && <DialogPrimitive.Title className="sr-only">Drawer</DialogPrimitive.Title>}
              <DialogPrimitive.Close
                className={cn(
                  "rounded-md p-1",
                  "text-(--color-text-muted) transition-colors",
                  "hover:text-foreground focus:outline-none focus:ring-2 focus:ring-(--brand-primary)",
                  !title && "ml-auto"
                )}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>

            <div className="mt-4 flex-1">{children}</div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { Drawer };
export type { DrawerProps };
