'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingCart,
  Check,
  Minus,
  Plus,
  Sparkles,
  ArrowUpDown,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import { useCart, type CartProduct } from '@/hooks/use-cart'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConfidenceLevel = 'high' | 'medium' | 'low'
type FilterValue = 'all' | ConfidenceLevel
type SortValue = 'confidence' | 'frequency' | 'price'

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
// Constants
// ---------------------------------------------------------------------------

const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { label: string; dotClass: string; textClass: string; rank: number }
> = {
  high: {
    label: 'Weekly staple',
    dotClass: 'bg-(--color-success)',
    textClass: 'text-(--color-success)',
    rank: 3,
  },
  medium: {
    label: 'Regular buy',
    dotClass: 'bg-(--brand-amber)',
    textClass: 'text-(--brand-amber)',
    rank: 2,
  },
  low: {
    label: 'Occasional',
    dotClass: 'bg-(--color-text-muted)',
    textClass: 'text-(--color-text-muted)',
    rank: 1,
  },
}

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High Confidence' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'confidence', label: 'By confidence' },
  { value: 'frequency', label: 'By frequency' },
  { value: 'price', label: 'By price' },
]

const BREADCRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Your Weekly Shop' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function sortItems(items: SmartReorderItem[], sort: SortValue): SmartReorderItem[] {
  const sorted = [...items]
  switch (sort) {
    case 'confidence':
      return sorted.sort(
        (a, b) => CONFIDENCE_CONFIG[b.confidence].rank - CONFIDENCE_CONFIG[a.confidence].rank
      )
    case 'frequency':
      return sorted.sort((a, b) => b.purchase_count - a.purchase_count)
    case 'price':
      return sorted.sort((a, b) => a.price_pence - b.price_pence)
    default:
      return sorted
  }
}

// ---------------------------------------------------------------------------
// Skeleton loader (full page)
// ---------------------------------------------------------------------------

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-(--color-bg)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-4 w-48 mb-8" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Item Card (full page variant)
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
                  'flex h-8 w-8 sm:h-6 sm:w-6 items-center justify-center rounded-md',
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
                  'flex h-8 w-8 sm:h-6 sm:w-6 items-center justify-center rounded-md',
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
      <p className="mt-2 text-xs italic text-(--color-text-muted) line-clamp-2">
        {item.reason}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function SmartReorderPage() {
  const { addItem, openCart } = useCart()

  const [data, setData] = useState<SmartReorderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const [filter, setFilter] = useState<FilterValue>('all')
  const [sort, setSort] = useState<SortValue>('confidence')

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

  const handleAddSelected = useCallback(() => {
    if (!data) return

    const items = data.items.filter((item) => selected[item.id])
    for (const item of items) {
      addItem(toCartProduct(item), quantities[item.id] ?? 1)
    }

    setAddedFlash(true)
    openCart()
    setTimeout(() => setAddedFlash(false), 2000)
  }, [data, selected, quantities, addItem, openCart])

  // ---- Derived values ------------------------------------------------------

  const filteredSortedItems = useMemo(() => {
    if (!data) return []
    const filtered =
      filter === 'all'
        ? data.items
        : data.items.filter((item) => item.confidence === filter)
    return sortItems(filtered, sort)
  }, [data, filter, sort])

  const selectedItems = data?.items?.filter((item) => selected[item.id]) ?? []
  const selectedCount = selectedItems.length
  const totalPence = selectedItems.reduce(
    (sum, item) => sum + item.price_pence * (quantities[item.id] ?? 1),
    0
  )

  // ---- Guards --------------------------------------------------------------

  if (loading) return <PageSkeleton />

  if (error || !data || data.items.length === 0) {
    return (
      <div className="min-h-screen bg-(--color-bg)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-(--color-text-muted) mb-4" />
          <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
            No suggestions yet
          </h1>
          <p className="text-sm text-(--color-text-secondary) mb-6">
            Once you have some order history, we&apos;ll suggest your weekly shop here.
          </p>
          <Link
            href="/products"
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-6 py-3',
              'bg-(--brand-primary) text-white text-sm font-semibold',
              'transition-colors hover:bg-(--brand-primary)/90'
            )}
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  // ---- Render --------------------------------------------------------------

  return (
    <div className="min-h-screen bg-(--color-bg)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={BREADCRUMBS} className="mb-6" />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
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
            <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
              Your Weekly Shop
            </h1>
            <p className="text-sm text-(--color-text-secondary)">
              Based on your last {data.order_count} orders &mdash; ready in one
              click
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-(--color-text-muted) uppercase tracking-wide">
                Estimated Total
              </p>
              <p className="font-mono text-xl font-bold text-foreground">
                {formatPrice(totalPence)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-(--color-text-muted) uppercase tracking-wide">
                Selected Items
              </p>
              <p className="font-mono text-xl font-bold text-foreground">
                {selectedCount}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Sort bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-(--color-text-muted)" />
            <div className="flex gap-1.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilter(opt.value)}
                  className={cn(
                    'rounded-full px-3 py-2.5 text-xs font-medium transition-colors duration-150',
                    filter === opt.value
                      ? 'bg-(--brand-primary) text-white'
                      : 'bg-(--color-elevated) text-(--color-text-secondary) hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 sm:ml-auto">
            <ArrowUpDown className="h-4 w-4 text-(--color-text-muted)" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
              className={cn(
                'rounded-lg border border-(--color-border) bg-(--color-surface)',
                'px-3 py-2.5 text-xs text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-(--brand-primary)/30'
              )}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-24 lg:pb-8">
          {filteredSortedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              selected={!!selected[item.id]}
              quantity={quantities[item.id] ?? 1}
              onToggle={() => toggleItem(item.id)}
              onQuantityChange={(qty) => changeQuantity(item.id, qty)}
            />
          ))}

          {filteredSortedItems.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-sm text-(--color-text-muted)">
                No items match this filter.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom bar (mobile) */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 lg:hidden',
          'border-t border-(--color-border) bg-white/95 backdrop-blur-md',
          'px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-(--color-text-muted)">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </p>
            <p className="font-mono text-lg font-bold text-foreground">
              {formatPrice(totalPence)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddSelected}
            disabled={selectedCount === 0 || addedFlash}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-6 py-3',
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
                Add Selected to Basket
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
