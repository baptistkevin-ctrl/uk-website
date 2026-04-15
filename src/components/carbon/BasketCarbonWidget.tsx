'use client'

import { useMemo, useState } from 'react'
import { Leaf, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateBasketCarbon, formatCo2 } from '@/lib/carbon/carbon-data'
import { CarbonRatingBadge } from './CarbonRatingBadge'

interface BasketItem {
  name: string
  quantity: number
  unit?: string
  is_organic?: boolean
  category_slug?: string
}

interface BasketCarbonWidgetProps {
  items: BasketItem[]
  className?: string
}

export function BasketCarbonWidget({
  items,
  className,
}: BasketCarbonWidgetProps) {
  const [expanded, setExpanded] = useState(false)

  const carbon = useMemo(() => calculateBasketCarbon(items), [items])

  if (items.length === 0) return null

  const topContributors = carbon.itemBreakdown
    .sort((a: { co2Kg: number }, b: { co2Kg: number }) => b.co2Kg - a.co2Kg)
    .slice(0, 3)

  const maxCo2 = topContributors[0]?.co2Kg ?? 1

  return (
    <div
      className={cn(
        'rounded-xl border border-(--color-border) bg-(--color-surface) p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf size={18} className="text-(--brand-primary)" />
          <span className="text-sm font-semibold text-(--color-text)">
            Carbon Footprint
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-(--color-text)">
            {formatCo2(carbon.totalCo2Kg)}
          </span>
          <CarbonRatingBadge rating={carbon.rating} size="sm" />
        </div>
      </div>

      {/* Top contributors bar chart */}
      <div className="mt-3 space-y-1.5">
        <span className="text-xs font-medium text-(--color-text-muted)">
          Top contributors
        </span>
        {topContributors.map(
          (item: { name: string; co2Kg: number }, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-24 truncate text-xs text-(--color-text-secondary)">
                {item.name}
              </span>
              <div className="flex-1">
                <div
                  className="h-2 rounded-full bg-(--brand-primary)"
                  style={{
                    width: `${Math.max((item.co2Kg / maxCo2) * 100, 8)}%`,
                    opacity: 1 - i * 0.2,
                  }}
                />
              </div>
              <span className="text-xs tabular-nums text-(--color-text-muted)">
                {formatCo2(item.co2Kg)}
              </span>
            </div>
          )
        )}
      </div>

      {/* Comparison */}
      {carbon.comparison && (
        <p className="mt-3 text-xs text-(--color-text-secondary)">
          Equivalent to {carbon.comparison.carMiles.toFixed(1)} miles by car or {carbon.comparison.treeDays} days of tree absorption
        </p>
      )}

      {/* Eco tip */}
      {carbon.deliveryCo2 !== undefined && (
        <div className="mt-3 rounded-lg bg-(--brand-primary)/5 px-3 py-2">
          <p className="text-xs text-(--brand-primary)">
            <span className="font-semibold">Eco tip:</span> Choose cargo bike
            or click & collect for zero delivery emissions.
          </p>
        </div>
      )}

      {/* Expandable breakdown */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-(--brand-primary) transition-colors hover:text-(--brand-primary)/80"
        aria-expanded={expanded}
      >
        {expanded ? 'Hide' : 'View'} breakdown
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1 border-t border-(--color-border) pt-2">
          {carbon.itemBreakdown.map(
            (
              item: { name: string; co2Kg: number; rating: string },
              i: number
            ) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-(--color-text-secondary)">
                  {item.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="tabular-nums text-(--color-text-muted)">
                    {formatCo2(item.co2Kg)}
                  </span>
                  <CarbonRatingBadge
                    rating={item.rating as 'A' | 'B' | 'C' | 'D' | 'E'}
                    size="sm"
                  />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

export type { BasketCarbonWidgetProps, BasketItem }
