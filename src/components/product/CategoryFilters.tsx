'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CategoryFiltersProps {
  brands: string[]
  maxPrice: number
}

export function CategoryFilters({ brands, maxPrice }: CategoryFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [priceOpen, setPriceOpen] = useState(true)
  const [dietaryOpen, setDietaryOpen] = useState(true)
  const [brandOpen, setBrandOpen] = useState(false)

  const currentFilters = {
    minPrice: searchParams.get('min_price') || '',
    maxPrice: searchParams.get('max_price') || '',
    isOrganic: searchParams.get('is_organic') === 'true',
    isVegan: searchParams.get('is_vegan') === 'true',
    isVegetarian: searchParams.get('is_vegetarian') === 'true',
    isGlutenFree: searchParams.get('is_gluten_free') === 'true',
    brand: searchParams.get('brand') || '',
    inStock: searchParams.get('in_stock') !== 'false',
  }

  const activeFilterCount = [
    currentFilters.minPrice,
    currentFilters.maxPrice,
    currentFilters.isOrganic,
    currentFilters.isVegan,
    currentFilters.isVegetarian,
    currentFilters.isGlutenFree,
    currentFilters.brand,
    !currentFilters.inStock,
  ].filter(Boolean).length

  function updateFilter(key: string, value: string | boolean) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === '' || value === false) {
      params.delete(key)
    } else {
      params.set(key, String(value))
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function clearAll() {
    router.push(pathname, { scroll: false })
  }

  return (
    <div className="rounded-xl bg-(--color-surface) border border-(--color-border) p-5 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-(--brand-primary) text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <button onClick={clearAll} className="text-xs text-(--brand-primary) hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="border-t border-(--color-border) pt-3">
        <button onClick={() => setPriceOpen(!priceOpen)} className="flex items-center justify-between w-full py-2">
          <span className="text-sm font-medium text-foreground">Price Range</span>
          {priceOpen ? <ChevronUp className="h-4 w-4 text-(--color-text-muted)" /> : <ChevronDown className="h-4 w-4 text-(--color-text-muted)" />}
        </button>
        {priceOpen && (
          <div className="flex items-center gap-2 py-2">
            <input
              type="number"
              placeholder="Min"
              value={currentFilters.minPrice}
              onChange={e => updateFilter('min_price', e.target.value)}
              className="w-full h-9 px-2 text-sm border border-(--color-border) rounded-lg bg-background text-foreground focus:border-(--brand-primary) outline-none"
            />
            <span className="text-(--color-text-muted) text-sm">-</span>
            <input
              type="number"
              placeholder="Max"
              value={currentFilters.maxPrice}
              onChange={e => updateFilter('max_price', e.target.value)}
              className="w-full h-9 px-2 text-sm border border-(--color-border) rounded-lg bg-background text-foreground focus:border-(--brand-primary) outline-none"
            />
          </div>
        )}
      </div>

      {/* Dietary */}
      <div className="border-t border-(--color-border) pt-3">
        <button onClick={() => setDietaryOpen(!dietaryOpen)} className="flex items-center justify-between w-full py-2">
          <span className="text-sm font-medium text-foreground">Dietary</span>
          {dietaryOpen ? <ChevronUp className="h-4 w-4 text-(--color-text-muted)" /> : <ChevronDown className="h-4 w-4 text-(--color-text-muted)" />}
        </button>
        {dietaryOpen && (
          <div className="space-y-2 py-2">
            {[
              { key: 'is_organic', label: 'Organic', checked: currentFilters.isOrganic },
              { key: 'is_vegan', label: 'Vegan', checked: currentFilters.isVegan },
              { key: 'is_vegetarian', label: 'Vegetarian', checked: currentFilters.isVegetarian },
              { key: 'is_gluten_free', label: 'Gluten Free', checked: currentFilters.isGlutenFree },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={e => updateFilter(item.key, e.target.checked)}
                  className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary)"
                />
                <span className="text-sm text-(--color-text-secondary)">{item.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div className="border-t border-(--color-border) pt-3">
          <button onClick={() => setBrandOpen(!brandOpen)} className="flex items-center justify-between w-full py-2">
            <span className="text-sm font-medium text-foreground">Brand</span>
            {brandOpen ? <ChevronUp className="h-4 w-4 text-(--color-text-muted)" /> : <ChevronDown className="h-4 w-4 text-(--color-text-muted)" />}
          </button>
          {brandOpen && (
            <div className="space-y-2 py-2 max-h-40 overflow-y-auto">
              {brands.map(brand => (
                <label key={brand} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentFilters.brand === brand}
                    onChange={e => updateFilter('brand', e.target.checked ? brand : '')}
                    className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary)"
                  />
                  <span className="text-sm text-(--color-text-secondary)">{brand}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* In Stock */}
      <div className="border-t border-(--color-border) pt-3 mt-1">
        <label className="flex items-center gap-2.5 cursor-pointer py-2">
          <input
            type="checkbox"
            checked={currentFilters.inStock}
            onChange={e => updateFilter('in_stock', e.target.checked ? '' : 'false')}
            className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary)"
          />
          <span className="text-sm text-(--color-text-secondary)">In stock only</span>
        </label>
      </div>
    </div>
  )
}

export function ActiveFilterTags() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters: { key: string; label: string }[] = []

  if (searchParams.get('min_price')) filters.push({ key: 'min_price', label: `Min £${searchParams.get('min_price')}` })
  if (searchParams.get('max_price')) filters.push({ key: 'max_price', label: `Max £${searchParams.get('max_price')}` })
  if (searchParams.get('is_organic') === 'true') filters.push({ key: 'is_organic', label: 'Organic' })
  if (searchParams.get('is_vegan') === 'true') filters.push({ key: 'is_vegan', label: 'Vegan' })
  if (searchParams.get('is_vegetarian') === 'true') filters.push({ key: 'is_vegetarian', label: 'Vegetarian' })
  if (searchParams.get('is_gluten_free') === 'true') filters.push({ key: 'is_gluten_free', label: 'Gluten Free' })
  if (searchParams.get('brand')) filters.push({ key: 'brand', label: searchParams.get('brand')! })

  if (filters.length === 0) return null

  function removeFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function clearAll() {
    router.push(pathname, { scroll: false })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => removeFilter(f.key)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-(--brand-primary-light) text-(--brand-primary) text-xs font-medium rounded-full hover:bg-(--brand-primary)/20 transition-colors"
        >
          {f.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button onClick={clearAll} className="text-xs text-(--color-text-muted) hover:text-(--brand-primary) transition-colors ml-1">
        Clear all
      </button>
    </div>
  )
}
