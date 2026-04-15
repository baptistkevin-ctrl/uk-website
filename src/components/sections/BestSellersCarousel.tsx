'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Product {
  id: string
  name: string
  slug: string
  imageUrl: string
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  category: string
  isOrganic?: boolean
  onSale?: boolean
  isNew?: boolean
}

interface BestSellersCarouselProps {
  products: Product[]
}

export function BestSellersCarousel({ products }: BestSellersCarouselProps) {
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

    const offset = direction === 'left' ? -240 : 240
    el.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <section className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 lg:mb-8">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
            Best Sellers This Week
          </h2>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="text-sm text-(--brand-primary) hover:underline"
            >
              See all &rarr;
            </Link>

            {/* Desktop arrow buttons */}
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className={cn(
                'hidden md:flex items-center justify-center',
                'h-9 w-9 rounded-full border border-(--color-border)',
                'transition-opacity duration-(--duration-fast) ease-(--ease-premium)',
                !canScrollLeft && 'opacity-40 cursor-not-allowed'
              )}
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className={cn(
                'hidden md:flex items-center justify-center',
                'h-9 w-9 rounded-full border border-(--color-border)',
                'transition-opacity duration-(--duration-fast) ease-(--ease-premium)',
                !canScrollRight && 'opacity-40 cursor-not-allowed'
              )}
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
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
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 ease-(--ease-premium) group-hover:scale-105"
                    sizes="(min-width: 1024px) 220px, (min-width: 640px) 200px, 180px"
                  />

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
                    {product.isNew && (
                      <span className="rounded-full bg-(--color-text) text-white text-[11px] font-bold px-2 py-0.5">
                        NEW
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="pt-3 space-y-1">
                  <p className="text-[11px] uppercase tracking-wide text-(--color-text-muted)">
                    {product.category}
                  </p>
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {product.name}
                  </p>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="font-bold text-foreground">
                      &pound;{product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-(--color-text-muted) line-through">
                        &pound;{product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-(--color-text-secondary)">
                    <span className="text-amber-500">&starf;</span>{' '}
                    {product.rating.toFixed(1)} ({product.reviewCount})
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
