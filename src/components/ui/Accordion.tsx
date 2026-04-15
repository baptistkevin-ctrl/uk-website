"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string;
}

function Accordion({ items, defaultOpen }: AccordionProps) {
  const [openId, setOpenId] = React.useState<string | null>(
    defaultOpen ?? null
  );

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="w-full">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div
            key={item.id}
            className="border-b border-(--color-border)"
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className={cn(
                "flex w-full items-center justify-between py-4 text-left",
                "font-medium text-foreground transition-colors",
                "hover:text-(--color-text-secondary) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--brand-primary)"
              )}
            >
              <span>{item.title}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-(--color-text-muted) transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-4 text-(--color-text-secondary)">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { Accordion };
export type { AccordionProps, AccordionItem };
