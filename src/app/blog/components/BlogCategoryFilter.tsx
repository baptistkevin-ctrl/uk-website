"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface BlogCategoryFilterProps {
  categories: string[];
  activeCategory: string;
}

export function BlogCategoryFilter({
  categories,
  activeCategory,
}: BlogCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleCategoryClick(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "All") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    const qs = params.toString();
    router.push(qs ? `/blog?${qs}` : "/blog");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isActive = category === activeCategory;
        return (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-(--brand-primary) text-white"
                : "bg-(--color-surface) text-(--color-text-secondary) border border-(--color-border) hover:border-(--brand-primary) hover:text-(--brand-primary)"
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
