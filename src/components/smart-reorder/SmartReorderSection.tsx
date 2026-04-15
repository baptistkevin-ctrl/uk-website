'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Check, Minus, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import { useCart, type CartProduct } from '@/hooks/use-cart'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConfidenceLevel = 'high' | 'medium' | 'low'

interface SmartReorderItem {
  id: string
  name: string
  slug: string
  brand: string | null
  unit: string | null
  price_pence: number
  image_url: string | null
  confidence: ConfidenceLevel
  frequency_days: number
  purchase_count: number
  reason: string
}

interface SmartReorderResponse {
  items: SmartReorderItem[]
  order_count: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { label: string; dotClass: string; textClass: string }
> = {
  high: {
    label: 'Weekly staple',
    dotClass: 'bg-(--color-success)',
    textClass: 'text-(--color-success)',
  },
  medium: {
    label: 'Regular buy',
    dotClass: 'bg-(--brand-amber)',
    textClass: 'text-(--brand-amber)',
  },
  low: {
    label: 'Occasional',
    dotClass: 'bg-(--color-text-muted)',
    textClass: 'text-(--color-text-muted)',
  },
}

function toCartProduct(item: SmartReorderItem): CartProduct {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    price_pence: item.price_pence,
    image_url: item.image_url,
    unit: item.unit,
  }
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function ReorderSkeleton() {
  return (
    <section className="py-12 lg:py-20 bg-(--color-surface)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="hidden sm:block h-11 w-48 rounded-xl" />
        </div>

        {/* Card skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-14" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Item Card
// ---------------------------------------------------------------------------

interface ItemCardProps {
  item: SmartReorderItem
  selected: boolean
  quantity: number
  onToggle: () => void
  onQuantityChange: (qty: number) => void
}

function ItemCard({
  item,
  selected,
  quantity,
  onToggle,
  onQuantityChange,
}: ItemCardProps) {
  const conf = CONFIDENCE_CONFIG[item.confidence]

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-(--color-surface) p-3',
        'transition-all duration-200 ease-(--ease-premium)',
        selected
          ? 'border-(--brand-primary) shadow-(--shadow-sm)'
          : 'border-(--color-border) opacity-60'
      )}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={selected ? `Deselect ${item.name}` : `Select ${item.name}`}
        className={cn(
          'absolute top-2.5 right-2.5 z-10 flex h-5 w-5 items-center justify-center',
          'rounded-md border transition-colors duration-150 ease-(--ease-premium)',
          selected
            ? 'border-(--brand-primary) bg-(--brand-primary) text-white'
            : 'border-(--color-border) bg-(--color-surface)'
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </button>

      {/* Content */}
      <div className="flex items-start gap-3">
        {/* Image */}
        <Link
          href={`/products/${item.slug}`}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-(--color-elevated)"
        >
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-(--color-text-muted)">
              <ShoppingCart className="h-6 w-6" />
            </div>
          )}
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <Link href={`/products/${item.slug}`}>
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {item.name}
            </p>
          </Link>

          {(item.brand || item.unit) && (
            <p className="text-xs text-(--color-text-muted)">
              {item.brand}
              {item.brand && item.unit && ' \u00B7 '}
              {item.unit}
            </p>
          )}

          {/* Confidence */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn('inline-block h-1.5 w-1.5 rounded-full', conf.dotClass)}
            />
            <span className={cn('text-[11px] font-medium', conf.textClass)}>
              {conf.label}
            </span>
          </div>

          {/* Price */}
          <p className="font-mono text-sm font-semibold text-foreground">
            {formatPrice(item.price_pence)}
          </p>

          {/* Quantity stepper */}
          {selected && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md',
                  'border border-(--color-border) bg-(--color-elevated)',
                  'transition-colors hover:border-(--brand-primary) hover:text-(--brand-primary)'
                )}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[1.25rem] text-center text-xs font-semibold text-foreground">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => onQuantityChange(quantity + 1)}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md',
                  'border border-(--color-border) bg-(--color-elevated)',
                  'transition-colors hover:border-(--brand-primary) hover:text-(--brand-primary)'
                )}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reason */}
      <p className="mt-2 text-xs italic text-(--color-text-muted) line-clamp-1">
        {item.reason}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Section
// ---------------------------------------------------------------------------

export function SmartReorderSection() {
  const { addItem, openCart } = useCart()

  const [data, setData] = useState<SmartReorderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Selection & quantity maps keyed by product id
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // "Added!" success flash
  const [addedFlash, setAddedFlash] = useState(false)

  // ---- Fetch ---------------------------------------------------------------

  useEffect(() => {
    let cancelled = false

    async function fetchReorder() {
      try {
        const res = await fetch('/api/smart-reorder')
        if (!res.ok) throw new Error('fetch failed')
        const json: SmartReorderResponse = await res.json()
        if (cancelled) return

        setData(json)

        // Default: all selected, quantity 1
        const sel: Record<string, boolean> = {}
        const qty: Record<string, number> = {}
        for (const item of json.items) {
          sel[item.id] = true
          qty[item.id] = 1
        }
        setSelected(sel)
        setQuantities(qty)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchReorder()
    return () => {
      cancelled = true
    }
  }, [])

  // ---- Handlers ------------------------------------------------------------

  const toggleItem = useCallback((id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const changeQuantity = useCallback((id: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [id]: qty }))
  }, [])

  const handleAddAll = useCallback(() => {
    if (!data) return

    const selectedItems = data.items.filter((item) => selected[item.id])
    for (const item of selectedItems) {
      addItem(toCartProduct(item), quantities[item.id] ?? 1)
    }

    setAddedFlash(true)
    openCart()
    setTimeout(() => setAddedFlash(false), 2000)
  }, [data, selected, quantities, addItem, openCart])

  // ---- Derived values ------------------------------------------------------

  const selectedItems = data?.items?.filter((item) => selected[item.id]) ?? []
  const selectedCount = selectedItems.length
  const totalPence = selectedItems.reduce(
    (sum, item) => sum + item.price_pence * (quantities[item.id] ?? 1),
    0
  )

  // ---- Guards --------------------------------------------------------------

  if (loading) return <ReorderSkeleton />
  if (error || !data || data.items.length === 0) return null

  // ---- Render --------------------------------------------------------------

  return (
    <section className="py-12 lg:py-20 bg-(--color-surface)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
          {/* Left */}
          <div className="space-y-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
                'bg-(--brand-primary)/10 text-(--brand-primary) text-xs font-semibold'
              )}
            >
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
              Your Weekly Shop
            </h2>
            <p className="text-sm text-(--color-text-secondary)">
              Based on your purchase history &mdash; ready in one click
            </p>
          </div>

          {/* Right — Add All */}
          <div className="flex items-center gap-3">
            <Link
              href="/smart-reorder"
              className="hidden sm:inline text-sm text-(--brand-primary) hover:underline"
            >
              See all &rarr;
            </Link>

            <button
              type="button"
              onClick={handleAddAll}
              disabled={selectedCount === 0 || addedFlash}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-5 py-2.5',
                'text-sm font-semibold text-white transition-all duration-200 ease-(--ease-premium)',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                addedFlash
                  ? 'bg-(--color-success)'
                  : 'bg-(--brand-amber) hover:bg-(--brand-amber-hover) shadow-(--shadow-amber)'
              )}
            >
              {addedFlash ? (
                <>
                  <Check className="h-4 w-4" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Add All to Basket
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {formatPrice(totalPence)}
                  </span>
                </>
              )}
            </button>

            {selectedCount > 0 && !addedFlash && (
              <span className="hidden sm:inline text-xs text-(--color-text-muted)">
                {selectedCount} item{selectedCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {data.items.slice(0, 10).map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              selected={!!selected[item.id]}
              quantity={quantities[item.id] ?? 1}
              onToggle={() => toggleItem(item.id)}
              onQuantityChange={(qty) => changeQuantity(item.id, qty)}
            />
          ))}
        </div>

        {/* Mobile "See all" link */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/smart-reorder"
            className="text-sm font-medium text-(--brand-primary) hover:underline"
          >
            See all suggestions &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
