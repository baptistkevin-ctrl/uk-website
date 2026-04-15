'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import { useWeatherStore } from '@/stores/weather-store'
import { useCart } from '@/hooks/use-cart'

/* ─── Types ────────────────────────────────────────────────── */

interface WeatherProductItem {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
}

interface WeatherProductRowProps {
  promotionId?: string
}

/* ─── Compact Product Card ─────────────────────────────────── */

function CompactProductCard({ product }: { product: WeatherProductItem }) {
  const { addItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAdding(true)
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price_pence: product.price_pence,
      image_url: product.image_url,
    })
    setTimeout(() => setIsAdding(false), 400)
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group/card shrink-0 w-[160px] rounded-lg',
        'border border-(--color-border) bg-(--color-surface)',
        'overflow-hidden transition-shadow hover:shadow-(--shadow-md)'
      )}
    >
      {/* Image */}
      <div className="relative aspect-square bg-(--color-bg) overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover/card:scale-105 transition-transform duration-300"
            sizes="160px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-(--color-text-muted) text-2xl">
            🛒
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 space-y-1.5">
        <h3 className="text-xs font-medium text-(--color-text) leading-tight line-clamp-2 min-h-[32px]">
          {product.name}
        </h3>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-(--brand-primary)">
            {formatPrice(product.price_pence)}
          </span>

          <button
            onClick={handleAdd}
            disabled={isAdding}
            aria-label={`Add ${product.name} to cart`}
            className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center',
              'bg-(--brand-primary) text-white transition-all',
              'hover:opacity-90 active:scale-95',
              isAdding && 'opacity-70'
            )}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  )
}

/* ─── Main Component ───────────────────────────────────────── */

export function WeatherProductRow({ promotionId }: WeatherProductRowProps) {
  const {
    promotions,
    products,
    weather,
    isLoading,
    fetchWeather,
    isStale,
  } = useWeatherStore()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    if (isStale()) {
      fetchWeather()
    }
  }, [fetchWeather, isStale])

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    return () => el.removeEventListener('scroll', checkScroll)
  }, [checkScroll, products])

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const offset = direction === 'left' ? -320 : 320
    el.scrollBy({ left: offset, behavior: 'smooth' })
  }, [])

  if (!weather && !isLoading) return null

  const targetPromo = promotionId
    ? promotions.find((p) => p.id === promotionId)
    : promotions[0]

  if (!targetPromo) return null

  const promoProducts = (products[targetPromo.id] ?? []) as WeatherProductItem[]
  if (promoProducts.length === 0) return null

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      aria-label={targetPromo.title}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            {targetPromo.emoji}
          </span>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-(--color-text)">
            {targetPromo.title}
          </h2>
        </div>

        {/* Scroll arrows */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={cn(
              'h-8 w-8 rounded-full border border-(--color-border)',
              'flex items-center justify-center transition-colors',
              canScrollLeft
                ? 'text-(--color-text) hover:bg-(--color-elevated)'
                : 'text-(--color-text-muted) opacity-40 cursor-default'
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={cn(
              'h-8 w-8 rounded-full border border-(--color-border)',
              'flex items-center justify-center transition-colors',
              canScrollRight
                ? 'text-(--color-text) hover:bg-(--color-elevated)'
                : 'text-(--color-text-muted) opacity-40 cursor-default'
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal scroll row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mb-2"
      >
        {promoProducts.map((product) => (
          <CompactProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
