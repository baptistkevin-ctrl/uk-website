'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock, ShoppingBasket } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { RECIPES, type Recipe } from '@/data/recipes'

const FEATURED_RECIPES = RECIPES.filter(
  (r) => r.categories.includes('Family Dinner') || r.categories.includes('Quick Meals'),
).slice(0, 6)

export function RecipeCarousel() {
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

    const offset = direction === 'left' ? -280 : 280
    el.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <section className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 lg:mb-8">
          <div>
            <h2 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
              Cook Something Delicious
            </h2>
            <p className="text-sm text-(--color-text-muted) mt-1">
              Browse recipes and add all ingredients in one click
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/recipes"
              className="text-sm text-(--brand-primary) hover:underline"
            >
              See all recipes &rarr;
            </Link>

            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className={cn(
                'hidden md:flex items-center justify-center',
                'h-9 w-9 rounded-full border border-(--color-border)',
                'transition-opacity duration-(--duration-fast) ease-(--ease-premium)',
                !canScrollLeft && 'opacity-40 cursor-not-allowed',
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
                !canScrollRight && 'opacity-40 cursor-not-allowed',
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
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          >
            {FEATURED_RECIPES.map((recipe) => {
              const totalTime = recipe.prepTime + recipe.cookTime

              return (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.slug}`}
                  className={cn(
                    'shrink-0 w-[240px] sm:w-[260px] lg:w-[280px] group',
                    'rounded-xl border border-(--color-border)',
                    'bg-(--color-surface) overflow-hidden',
                    'hover:shadow-(--shadow-md) transition-all duration-300 ease-(--ease-premium)',
                  )}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-(--color-elevated)">
                    <Image
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      fill
                      className="object-cover transition-transform duration-500 ease-(--ease-premium) group-hover:scale-105"
                      sizes="(min-width: 1024px) 280px, (min-width: 640px) 260px, 240px"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                      {recipe.title}
                    </h3>

                    <div className="flex items-center gap-3 mt-2 text-xs text-(--color-text-muted)">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {totalTime} min
                      </span>
                      <span
                        className={cn(
                          'font-medium',
                          recipe.difficulty === 'Easy'
                            ? 'text-(--color-success)'
                            : recipe.difficulty === 'Medium'
                              ? 'text-(--brand-amber)'
                              : 'text-(--color-error)',
                        )}
                      >
                        {recipe.difficulty}
                      </span>
                    </div>

                    <div className="mt-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5',
                          'rounded-full px-3 py-1 text-[11px] font-semibold',
                          'bg-(--brand-amber)/10 text-(--brand-amber)',
                        )}
                      >
                        <ShoppingBasket size={12} />
                        Shop Ingredients
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
