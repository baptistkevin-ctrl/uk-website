"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface SubcategoryPillsProps {
  items: { name: string; slug: string }[];
  activeSlug?: string;
  basePath: string;
}

export function SubcategoryPills({
  items,
  activeSlug,
  basePath,
}: SubcategoryPillsProps) {
  const pillBase =
    "whitespace-nowrap rounded-(--radius-full) px-4 py-2.5 text-sm font-medium transition-colors";
  const pillActive = "bg-(--brand-primary) text-white";
  const pillInactive =
    "border border-(--color-border) bg-(--color-surface) text-(--color-text-secondary) hover:border-(--color-border-strong)";

  return (
    <nav
      aria-label="Subcategories"
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
    >
      <Link
        href={basePath}
        className={cn(pillBase, !activeSlug ? pillActive : pillInactive)}
      >
        All
      </Link>

      {items.map((item) => (
        <Link
          key={item.slug}
          href={`${basePath}/${item.slug}`}
          className={cn(
            pillBase,
            activeSlug === item.slug ? pillActive : pillInactive
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
