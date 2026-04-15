'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Subcategory {
  name: string
  slug: string
}

interface Category {
  name: string
  slug: string
  subcategories?: Subcategory[]
}

interface MegaMenuProps {
  categories: Category[]
}

const POPULAR_ITEMS: Record<string, string[]> = {
  'fresh-produce': ['Organic Baby Spinach', 'Conference Pears', 'Salad Mixed Leaves'],
  'meat-fish': ['Free Range Chicken Breast', 'Scottish Salmon Fillets', 'Lean Beef Mince'],
  'dairy-eggs': ['Semi-Skimmed Milk', 'Mature Cheddar', 'Free Range Eggs'],
  'bakery': ['Sourdough Loaf', 'Croissants', 'Tiger Bread'],
  'pantry': ['Basmati Rice', 'Extra Virgin Olive Oil', 'Chopped Tomatoes'],
  'drinks': ['English Breakfast Tea', 'Colombian Coffee', 'Orange Juice'],
  'frozen-foods': ['Garden Peas', 'Fish Fingers', 'Vanilla Ice Cream'],
  'health-beauty': ['Multivitamins', 'Hand Wash', 'Paracetamol'],
}

export function MegaMenu({ categories }: MegaMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const clearDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const handleCategoryEnter = useCallback(
    (slug: string) => {
      clearDebounce()
      timeoutRef.current = setTimeout(() => {
        setActiveCategory(slug)
      }, 150)
    },
    [clearDebounce]
  )

  const handleCategoryLeave = useCallback(() => {
    clearDebounce()
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null)
    }, 150)
  }, [clearDebounce])

  const handlePanelEnter = useCallback(() => {
    clearDebounce()
  }, [clearDebounce])

  const handlePanelLeave = useCallback(() => {
    clearDebounce()
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null)
    }, 150)
  }, [clearDebounce])

  useEffect(() => {
    return () => clearDebounce()
  }, [clearDebounce])

  const activeCategoryData = categories.find((c) => c.slug === activeCategory)
  const popularItems = activeCategory ? POPULAR_ITEMS[activeCategory] ?? [] : []

  return (
    <div ref={menuRef} className="relative hidden lg:block">
      {/* Category nav links */}
      <nav className="flex items-center gap-1">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className={cn(
              'relative px-3 py-2 text-sm font-medium transition-colors',
              'text-(--color-text-secondary) hover:text-foreground',
              'rounded-md',
              activeCategory === category.slug &&
                'bg-(--color-elevated) text-foreground'
            )}
            onMouseEnter={() => handleCategoryEnter(category.slug)}
            onMouseLeave={handleCategoryLeave}
          >
            {category.name}
          </Link>
        ))}
      </nav>

      {/* Mega menu panel */}
      {activeCategoryData && (
        <div
          className={cn(
            'absolute left-0 right-0 top-full mt-0',
            'z-(--z-dropdown)',
            'rounded-b-(--radius-xl)',
            'border border-(--color-border) border-t-0',
            'bg-(--color-surface)',
            'shadow-(--shadow-2xl)',
            'p-8',
            'animate-mega-menu-in'
          )}
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
          style={{
            animation: 'mega-menu-in var(--duration-base) var(--ease-premium) forwards',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold uppercase tracking-wide text-foreground">
              {activeCategoryData.name}
            </h3>
          </div>

          <div className="mb-6 h-px w-full bg-(--color-border)" />

          <div className="grid grid-cols-12 gap-8">
            {/* Left: Subcategories grid */}
            <div className="col-span-4">
              {activeCategoryData.subcategories &&
              activeCategoryData.subcategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {activeCategoryData.subcategories.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/categories/${activeCategoryData.slug}/${sub.slug}`}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium',
                        'text-(--color-text-secondary)',
                        'transition-colors duration-(--duration-base)',
                        'hover:bg-(--color-elevated) hover:text-(--brand-primary)'
                      )}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-(--color-text-muted)">
                  Browse all {activeCategoryData.name} products
                </p>
              )}
            </div>

            {/* Middle: Popular right now */}
            <div className="col-span-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
                Popular right now
              </h4>
              <ul className="space-y-2">
                {popularItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-(--color-text-secondary)"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--brand-primary)" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Featured category image placeholder + CTA */}
            <div className="col-span-4 flex flex-col">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
                Featured Category
              </h4>
              <div className="mb-4 flex flex-1 items-center justify-center rounded-lg bg-(--color-elevated)">
                <span className="text-sm text-(--color-text-muted)">
                  Category image
                </span>
              </div>
              <Link
                href={`/categories/${activeCategoryData.slug}`}
                className={cn(
                  'inline-flex items-center gap-1 text-sm font-semibold',
                  'text-(--brand-primary)',
                  'transition-colors hover:text-(--brand-amber)'
                )}
              >
                See all {activeCategoryData.name}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
