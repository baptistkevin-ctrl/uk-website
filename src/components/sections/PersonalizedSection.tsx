'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sun, Moon, CloudRain, Sunrise, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import { useCart } from '@/hooks/use-cart'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PersonalizedProduct {
  id: string
  name: string
  slug: string
  imageUrl: string
  price: number
  originalPrice?: number
  category?: string
  isOrganic?: boolean
  onSale?: boolean
}

interface PersonalizedSectionData {
  id: string
  title: string
  subtitle?: string
  icon?: string
  reason?: string
  products: PersonalizedProduct[]
}

interface SeasonalBanner {
  title: string
  subtitle?: string
  ctaText?: string
  ctaUrl?: string
  gradient?: string
}

interface PersonalizedResponse {
  greeting: string
  context: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    weather?: string
    season?: string
    subtitle?: string
  }
  sections: PersonalizedSectionData[]
  seasonalBanner?: SeasonalBanner
}

// ---------------------------------------------------------------------------
// Time-of-day helpers
// ---------------------------------------------------------------------------

function getTimeGradient(timeOfDay: string): string {
  switch (timeOfDay) {
    case 'morning':
      return 'bg-linear-to-r from-(--brand-amber-soft) to-(--brand-amber-soft)/60'
    case 'afternoon':
      return 'bg-linear-to-r from-(--brand-primary-light) to-(--brand-primary-light)/60'
    case 'evening':
      return 'bg-linear-to-r from-(--brand-dark)/8 to-(--brand-primary)/5'
    case 'night':
      return 'bg-linear-to-r from-(--color-elevated) to-(--color-elevated)/80'
    default:
      return 'bg-(--color-elevated)'
  }
}

function TimeIcon({ timeOfDay }: { timeOfDay: string }) {
  const cls = 'h-8 w-8 lg:h-10 lg:w-10'

  switch (timeOfDay) {
    case 'morning':
      return <Sunrise className={cn(cls, 'text-(--brand-amber)')} />
    case 'afternoon':
      return <Sun className={cn(cls, 'text-(--brand-amber)')} />
    case 'evening':
      return <Moon className={cn(cls, 'text-white/70')} />
    case 'night':
      return <Moon className={cn(cls, 'text-white/50')} />
    default:
      return <Sun className={cn(cls, 'text-(--brand-amber)')} />
  }
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function PersonalizedSkeleton() {
  return (
    <section className="py-8 lg:py-12" aria-busy="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Greeting skeleton */}
        <div className="rounded-2xl p-6 lg:p-8 bg-(--color-elevated) animate-pulse">
          <div className="h-7 w-64 rounded bg-(--color-border)" />
          <div className="h-4 w-48 rounded bg-(--color-border) mt-3" />
        </div>

        {/* Section skeleton */}
        {[1, 2].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-6 w-52 rounded bg-(--color-border) animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="shrink-0 w-[160px] sm:w-[180px] space-y-2">
                  <div className="aspect-square rounded-xl bg-(--color-elevated) animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-(--color-elevated) animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-(--color-elevated) animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Horizontal scroll row
// ---------------------------------------------------------------------------

function ProductRow({ products }: { products: PersonalizedProduct[] }) {
  const { addItem } = useCart()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)

    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  function scroll(direction: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    const offset = direction === 'left' ? -200 : 200
    el.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <div className="relative group/row">
      {/* Scroll buttons — desktop only */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className={cn(
            'hidden md:flex absolute -left-3 top-1/3 z-10',
            'items-center justify-center h-9 w-9 rounded-full',
            'bg-(--color-surface) shadow-(--shadow-md) border border-(--color-border)',
            'opacity-0 group-hover/row:opacity-100 transition-opacity',
          )}
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className={cn(
            'hidden md:flex absolute -right-3 top-1/3 z-10',
            'items-center justify-center h-9 w-9 rounded-full',
            'bg-(--color-surface) shadow-(--shadow-md) border border-(--color-border)',
            'opacity-0 group-hover/row:opacity-100 transition-opacity',
          )}
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-3 lg:gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="shrink-0 w-50 sm:w-55 lg:w-60 group"
          >
            {/* Image */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-(--color-elevated)">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 ease-(--ease-premium) group-hover:scale-105"
                  sizes="(min-width: 640px) 180px, 160px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-(--color-text-muted) text-2xl">🛒</div>
              )}

              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {product.isOrganic && (
                  <span className="rounded-full bg-(--brand-primary) text-white text-[11px] font-bold px-2 py-0.5">
                    ORGANIC
                  </span>
                )}
                {product.onSale && (
                  <span className="rounded-full bg-(--brand-amber) text-white text-[11px] font-bold px-2 py-0.5">
                    SALE
                  </span>
                )}
              </div>

              {/* Add button — on hover */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  addItem({
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price_pence: Math.round(product.price * 100),
                    image_url: product.imageUrl,
                  } as Parameters<typeof addItem>[0])
                }}
                aria-label={`Add ${product.name} to basket`}
                className={cn(
                  'absolute bottom-2 right-2',
                  'flex items-center gap-1 px-3 py-1.5 rounded-full',
                  'bg-(--brand-amber) hover:bg-(--brand-amber-hover) text-white',
                  'text-xs font-semibold shadow-(--shadow-sm)',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                )}
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>

            {/* Content */}
            <div className="pt-2 space-y-0.5">
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {product.name}
              </p>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-sm font-semibold text-foreground">
                  {formatPrice(product.price * 100)}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-(--color-text-muted) line-through">
                    {formatPrice(product.originalPrice * 100)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PersonalizedSection() {
  const [data, setData] = useState<PersonalizedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchPersonalized() {
      try {
        const res = await fetch('/api/personalized')
        if (!res.ok) throw new Error('Failed to fetch')
        const json: PersonalizedResponse = await res.json()
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPersonalized()
    return () => { cancelled = true }
  }, [])

  if (loading) return <PersonalizedSkeleton />
  if (error || !data || data.sections.length === 0) return null

  const { greeting, context, sections, seasonalBanner } = data
  const displaySections = sections.slice(0, 3)

  return (
    <section className="py-4 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── Greeting Banner ── */}
        <div className="relative rounded-2xl overflow-hidden bg-(--brand-dark) p-6 lg:p-8">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-(--brand-primary)/15 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-(--brand-amber)/10 blur-3xl" />
            <div className="absolute top-0 right-0 w-full h-full bg-linear-to-br from-white/3 to-transparent" />
          </div>

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 lg:gap-5">
              {/* Icon circle */}
              <div className="flex h-12 w-12 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <TimeIcon timeOfDay={context.timeOfDay} />
              </div>
              <div>
                <h2 className="font-display text-xl lg:text-2xl font-semibold text-white">
                  {greeting}
                </h2>
                <p className="mt-0.5 text-sm text-white/50">
                  {context.subtitle || "Here are some picks just for you"}
                </p>
              </div>
            </div>

            {/* Right side — context pills */}
            <div className="hidden md:flex items-center gap-2">
              {context.timeOfDay && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/70 text-xs font-medium px-3 py-1.5 rounded-full border border-white/10">
                  {context.timeOfDay === 'morning' ? '☀️' : context.timeOfDay === 'afternoon' ? '🌤️' : context.timeOfDay === 'evening' ? '🌆' : '🌙'}
                  {context.timeOfDay.charAt(0).toUpperCase() + context.timeOfDay.slice(1)}
                </span>
              )}
              {context.season && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/70 text-xs font-medium px-3 py-1.5 rounded-full border border-white/10">
                  {context.season === 'spring' ? '🌱' : context.season === 'summer' ? '☀️' : context.season === 'autumn' ? '🍂' : '❄️'}
                  {context.season.charAt(0).toUpperCase() + context.season.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Seasonal Banner ── */}
        {seasonalBanner && (
          <div
            className={cn(
              'rounded-2xl p-6 lg:p-8',
              seasonalBanner.gradient ?? 'bg-gradient-to-r from-green-600 to-emerald-500',
            )}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg lg:text-xl font-semibold text-white">
                  {seasonalBanner.title}
                </h3>
                {seasonalBanner.subtitle && (
                  <p className="mt-1 text-sm text-white/80">
                    {seasonalBanner.subtitle}
                  </p>
                )}
              </div>
              {seasonalBanner.ctaText && seasonalBanner.ctaUrl && (
                <Link
                  href={seasonalBanner.ctaUrl}
                  className={cn(
                    'shrink-0 px-5 py-2.5 rounded-lg',
                    'bg-(--color-surface) text-(--brand-primary) font-semibold text-sm',
                    'hover:bg-white/90 transition-colors',
                  )}
                >
                  {seasonalBanner.ctaText}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Product Sections ── */}
        {displaySections.map((section) => (
          <div key={section.id} className="space-y-4">
            {/* Context pill */}
            {section.reason && (
              <span className="inline-block text-xs bg-(--color-elevated) text-(--color-text-secondary) rounded-full px-3 py-1">
                {section.reason}
              </span>
            )}

            {/* Section heading */}
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                {section.icon && <span className="mr-2">{section.icon}</span>}
                {section.title}
              </h3>
              {section.subtitle && (
                <p className="text-sm text-(--color-text-muted) mt-0.5">
                  {section.subtitle}
                </p>
              )}
            </div>

            {/* Products */}
            {section.products.length > 0 && (
              <ProductRow products={section.products} />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
