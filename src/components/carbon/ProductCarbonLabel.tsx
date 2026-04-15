'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { estimateProductCarbon, formatCo2 } from '@/lib/carbon/carbon-data'
import { CarbonRatingBadge } from './CarbonRatingBadge'

interface ProductCarbonLabelProps {
  productName: string
  unit?: string
  isOrganic?: boolean
  categorySlug?: string
  className?: string
}

export function ProductCarbonLabel({
  productName,
  unit,
  isOrganic,
  categorySlug,
  className,
}: ProductCarbonLabelProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const carbon = useMemo(
    () =>
      estimateProductCarbon({
        name: productName,
        unit,
        is_organic: isOrganic,
        category_slug: categorySlug,
      }),
    [productName, unit, isOrganic, categorySlug]
  )

  return (
    <span
      className={cn('relative inline-flex items-center gap-1', className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="group"
      aria-label={`Carbon footprint: ${formatCo2(carbon.co2Kg)}, rating ${carbon.rating}`}
    >
      <CarbonRatingBadge rating={carbon.rating} size="sm" />

      <span className="text-xs text-(--color-text-secondary)">
        {formatCo2(carbon.co2Kg)}
      </span>

      {carbon.origin && carbon.origin !== 'UK' && (
        <span className="text-[11px] text-(--color-text-muted)">
          ({carbon.origin})
        </span>
      )}

      {showTooltip && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2',
            'w-48 rounded-lg bg-(--color-text) p-2.5 text-xs text-white shadow-(--shadow-lg)'
          )}
        >
          <span className="block font-semibold">{productName}</span>
          <span className="mt-1 block">
            CO₂: {formatCo2(carbon.co2Kg)}
          </span>
          <span className="block">Rating: {carbon.rating}</span>
          {carbon.foodMiles !== undefined && (
            <span className="block">Food miles: ~{carbon.foodMiles} mi</span>
          )}
          {carbon.origin && (
            <span className="block">Origin: {carbon.origin}</span>
          )}
          <span
            className={cn(
              'absolute top-full left-1/2 -translate-x-1/2 border-4',
              'border-t-(--color-text) border-x-transparent border-b-transparent'
            )}
          />
        </span>
      )}
    </span>
  )
}

export type { ProductCarbonLabelProps }
