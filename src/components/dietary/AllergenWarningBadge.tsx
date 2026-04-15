"use client"

import { useState, useRef, useEffect } from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDietaryStore } from "@/stores/dietary-store"

interface AllergenWarningBadgeProps {
  product: {
    is_vegan?: boolean
    is_vegetarian?: boolean
    is_gluten_free?: boolean
    is_organic?: boolean
    allergens?: string | null
    name?: string
  }
}

export function AllergenWarningBadge({ product }: AllergenWarningBadgeProps) {
  const { isActive, isProductSafe } = useDietaryStore()
  const [showPopup, setShowPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPopup) return

    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showPopup])

  if (!isActive) return null

  const { safe, warnings } = isProductSafe(product)

  if (safe) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-(--color-success)/10 px-2 py-0.5 text-[11px] font-semibold text-(--color-success)">
        <CheckCircle2 className="h-3 w-3" />
        Safe
      </span>
    )
  }

  const primaryWarning =
    warnings.length === 1
      ? warnings[0].message
      : `${warnings.length} warnings`

  return (
    <div className="relative" ref={popupRef}>
      <button
        type="button"
        onClick={() => setShowPopup((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors",
          "bg-(--color-warning)/10 text-(--color-warning)",
          "hover:bg-(--color-warning)/20"
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        {primaryWarning}
      </button>

      {showPopup && warnings.length > 1 && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-1.5 min-w-[200px]",
            "rounded-lg border border-(--color-border) bg-(--color-surface) p-3 shadow-(--shadow-md)"
          )}
        >
          <p className="mb-2 text-xs font-semibold text-foreground">
            Dietary Warnings
          </p>
          <ul className="space-y-1.5">
            {warnings.map((warning) => (
              <li
                key={warning.message}
                className="flex items-start gap-1.5 text-xs"
              >
                <AlertTriangle
                  className={cn(
                    "mt-0.5 h-3 w-3 shrink-0",
                    warning.type === "allergy"
                      ? "text-(--color-error)"
                      : "text-(--color-warning)"
                  )}
                />
                <span className="text-(--color-text-secondary)">
                  {warning.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
