"use client"

import Link from "next/link"
import { Shield, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDietaryStore } from "@/stores/dietary-store"

const DIET_LABELS: Record<string, string> = {
  none: "No restrictions",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  pescatarian: "Pescatarian",
  keto: "Keto",
  paleo: "Paleo",
}

const PREFERENCE_LABELS: Record<string, string> = {
  organic: "Organic",
  halal: "Halal",
  kosher: "Kosher",
  "low-sugar": "Low Sugar",
  "low-salt": "Low Salt",
  "high-protein": "High Protein",
  "locally-sourced": "Local",
  "palm-oil-free": "Palm Oil Free",
}

export function DietaryFilterBar() {
  const { isActive, dietType, allergies, preferences, toggleActive } =
    useDietaryStore()

  if (!isActive) return null

  const pills: string[] = []

  if (dietType !== "none") {
    pills.push(DIET_LABELS[dietType])
  }

  for (const allergy of allergies) {
    pills.push(`No ${allergy}`)
  }

  for (const pref of preferences) {
    pills.push(PREFERENCE_LABELS[pref] ?? pref)
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg px-4 py-2",
        "bg-(--brand-primary)/8 border border-(--brand-primary)/15"
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <Shield className="h-4 w-4 shrink-0 text-(--brand-primary)" />
        <span className="shrink-0 text-sm font-medium text-foreground">
          Dietary filter active
        </span>
        {pills.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {pills.map((pill) => (
              <span
                key={pill}
                className="shrink-0 rounded-full bg-(--brand-primary)/12 px-2 py-0.5 text-[11px] font-medium text-(--brand-primary)"
              >
                {pill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Link
          href="/dietary-setup"
          className="text-xs font-medium text-(--brand-primary) transition-colors hover:text-(--brand-primary)/80"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={toggleActive}
          className="flex items-center gap-1 text-xs font-medium text-(--color-text-muted) transition-colors hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Turn off
        </button>
      </div>
    </div>
  )
}
