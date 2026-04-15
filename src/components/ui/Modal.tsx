"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: keyof typeof sizeMap;
}

function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
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
            "fixed left-1/2 top-1/2 z-(--z-modal)",
            "-translate-x-1/2 -translate-y-1/2",
            "w-[calc(100%-2rem)]",
            sizeMap[size],
            "rounded-2xl bg-(--color-surface) p-6 shadow-(--shadow-2xl)",
            "data-state-open:animate-in data-state-open:fade-in-0 data-state-open:zoom-in-95",
            "data-state-closed:animate-out data-state-closed:fade-out-0 data-state-closed:zoom-out-95",
            "duration-200 focus:outline-none"
          )}
        >
          <DialogPrimitive.Close
            className={cn(
              "absolute right-4 top-4 rounded-md p-1",
              "text-(--color-text-muted) transition-colors",
              "hover:text-foreground focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          <DialogPrimitive.Title className="font-display text-xl font-semibold text-foreground">
            {title}
          </DialogPrimitive.Title>

          {description && (
            <DialogPrimitive.Description className="mt-1.5 text-sm text-(--color-text-secondary)">
              {description}
            </DialogPrimitive.Description>
          )}

          <div className="mt-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { Modal };
export type { ModalProps };
