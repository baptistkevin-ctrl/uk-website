'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { CategoryFilters } from './CategoryFilters'

interface MobileFilterButtonProps {
  brands: string[]
  maxPrice: number
}

export function MobileFilterButton({ brands, maxPrice }: MobileFilterButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center gap-1.5 text-sm px-3 py-2.5 bg-(--color-surface) border border-(--color-border) rounded-lg text-(--color-text-secondary) hover:border-(--brand-primary)/30"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-80 max-w-full bg-(--color-surface) z-50 lg:hidden overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-(--color-border)">
              <h3 className="font-semibold text-foreground">Filters</h3>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-(--color-elevated) rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <CategoryFilters brands={brands} maxPrice={maxPrice} />
            </div>
          </div>
        </>
      )}
    </>
  )
}
