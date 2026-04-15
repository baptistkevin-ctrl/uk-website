'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'
import { useWeatherStore } from '@/stores/weather-store'
import type { WeatherCondition } from '@/lib/weather/weather-engine'

/* ─── Weather condition icons ──────────────────────────────── */

const CONDITION_EMOJI: Record<WeatherCondition, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
  snowy: '🌨️',
  cold: '🥶',
  hot: '🔥',
  windy: '💨',
  mild: '🌤️',
  foggy: '🌫️',
}

const CONDITION_LABEL: Record<WeatherCondition, string> = {
  sunny: 'Sunny',
  cloudy: 'Cloudy',
  rainy: 'Rainy',
  stormy: 'Stormy',
  snowy: 'Snowy',
  cold: 'Cold',
  hot: 'Hot',
  windy: 'Windy',
  mild: 'Mild',
  foggy: 'Foggy',
}

/* ─── Particle types by condition ──────────────────────────── */

type ParticleType = 'rain' | 'snow' | 'glow' | 'none'

function getParticleType(condition: WeatherCondition): ParticleType {
  if (condition === 'rainy' || condition === 'stormy') return 'rain'
  if (condition === 'snowy' || condition === 'cold') return 'snow'
  if (condition === 'sunny' || condition === 'hot') return 'glow'
  return 'none'
}

/* ─── Skeleton ─────────────────────────────────────────────── */

function BannerSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div
        className={cn(
          'rounded-2xl overflow-hidden min-h-[140px]',
          'bg-(--color-elevated) animate-pulse'
        )}
      >
        <div className="flex items-center gap-6 p-6 lg:p-8">
          <div className="flex-1 space-y-3">
            <div className="h-5 w-40 rounded bg-(--color-border)" />
            <div className="h-7 w-64 rounded bg-(--color-border)" />
            <div className="h-4 w-48 rounded bg-(--color-border)" />
          </div>
          <div className="hidden lg:flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 w-16 rounded-lg bg-(--color-border)"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Weather Particles ────────────────────────────────────── */

function WeatherParticles({ type }: { type: ParticleType }) {
  if (type === 'none') return null

  if (type === 'glow') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-4 right-12 w-24 h-24 rounded-full bg-white/8 blur-2xl animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute bottom-2 right-1/3 w-16 h-16 rounded-full bg-white/5 blur-xl animate-[pulse_6s_ease-in-out_infinite_1s]" />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: type === 'rain' ? 20 : 12 }).map((_, i) => {
        const left = `${(i * 7.3 + 3) % 100}%`
        const delay = `${(i * 0.37) % 3}s`
        const duration = type === 'rain' ? '0.8s' : '3.5s'
        const size = type === 'rain' ? 'w-px h-3' : 'w-1.5 h-1.5 rounded-full'

        return (
          <span
            key={i}
            className={cn(
              'absolute bg-white/30 opacity-0',
              size,
              type === 'rain'
                ? 'animate-[weather-rain_var(--dur)_linear_var(--delay)_infinite]'
                : 'animate-[weather-snow_var(--dur)_ease-in-out_var(--delay)_infinite]'
            )}
            style={
              {
                left,
                '--delay': delay,
                '--dur': duration,
              } as React.CSSProperties
            }
          />
        )
      })}

      {/* Inline keyframes via style tag — keeps CSS self-contained */}
      <style>{`
        @keyframes weather-rain {
          0% { top: -8px; opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.4; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes weather-snow {
          0% { top: -8px; opacity: 0; transform: translateX(0); }
          20% { opacity: 0.7; }
          50% { transform: translateX(8px); }
          80% { opacity: 0.5; }
          100% { top: 100%; opacity: 0; transform: translateX(-4px); }
        }
      `}</style>
    </div>
  )
}

/* ─── Product Thumbnail Strip ──────────────────────────────── */

interface ProductThumb {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
}

function ProductThumbnails({ products }: { products: ProductThumb[] }) {
  if (products.length === 0) return null

  return (
    <div className="flex items-start gap-3 overflow-x-auto scrollbar-none py-2">
      {products.slice(0, 6).map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          className="group/thumb shrink-0"
        >
          <div className="flex flex-col items-center gap-2 w-27.5">
            <div className="relative h-27.5 w-27.5 rounded-xl overflow-hidden bg-(--color-surface) ring-2 ring-white/20 shadow-(--shadow-lg) transition-all duration-200 group-hover/thumb:scale-105 group-hover/thumb:ring-white/50 group-hover/thumb:shadow-(--shadow-xl)">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="110px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-(--color-elevated) text-(--color-text-muted) text-xl">
                  🛒
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-[11px] text-white/70 line-clamp-1 max-w-25">{product.name}</p>
              <span className="font-mono text-xs font-bold text-white">
                {formatPrice(product.price_pence)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

/* ─── Main Component ───────────────────────────────────────── */

export function WeatherPromoBanner() {
  const {
    weather,
    promotions,
    products,
    isLoading,
    fetchWeather,
    isStale,
  } = useWeatherStore()

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (isStale()) {
      fetchWeather()
    }
  }, [fetchWeather, isStale])

  const handleDotClick = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  if (isLoading && !weather) return <BannerSkeleton />
  if (!weather || promotions.length === 0) return null

  const activePromo = promotions[activeIndex] ?? promotions[0]
  if (!activePromo) return null

  const promoProducts = (products[activePromo.id] ?? []) as ProductThumb[]
  const particleType = getParticleType(weather.condition)
  const emoji = CONDITION_EMOJI[weather.condition] ?? '🌤️'
  const conditionLabel = CONDITION_LABEL[weather.condition] ?? 'Weather'

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
      aria-label="Weather-based promotions"
    >
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden min-h-[140px]',
          'text-white transition-all duration-500'
        )}
        style={{ background: activePromo.bgGradient }}
      >
        <WeatherParticles type={particleType} />

        <div className="relative z-10 p-5 sm:p-6 lg:p-8">
          {/* Top row: weather pill + promo info */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-10">
            {/* Left: text content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Weather pill */}
              <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs font-medium">
                <span>{emoji}</span>
                <span>{weather.temperature}°C</span>
                <span className="text-white/40">·</span>
                <span className="text-white/90">{conditionLabel}</span>
                <span className="text-white/40">·</span>
                <span className="text-white/60">{weather.location}</span>
              </div>

              {/* Title */}
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight">
                {activePromo.emoji} {activePromo.title}
              </h2>

              {/* Subtitle */}
              <p className="text-sm lg:text-base text-white/70 max-w-lg leading-relaxed">
                {activePromo.subtitle}
              </p>

              {/* CTA */}
              <Link
                href={activePromo.categorySlug ? `/categories/${activePromo.categorySlug}` : '/products'}
                className={cn(
                  'inline-flex items-center gap-2',
                  'bg-(--brand-amber) text-white',
                  'rounded-lg px-5 py-2.5 text-sm font-semibold',
                  'shadow-[0_4px_16px_rgba(232,134,26,0.3)]',
                  'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(232,134,26,0.4)]',
                  'transition-all duration-200'
                )}
              >
                Shop Now
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* Right: product thumbnails */}
            <div className="lg:shrink-0">
              <ProductThumbnails products={promoProducts} />
            </div>
          </div>
        </div>

        {/* Promotion dots */}
        {promotions.length > 1 && (
          <div className="relative z-10 flex items-center justify-center gap-1.5 pb-4">
            {promotions.map((promo, index) => (
              <button
                key={promo.id}
                onClick={() => handleDotClick(index)}
                aria-label={`View promotion: ${promo.title}`}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  index === activeIndex
                    ? 'bg-(--color-surface) w-5'
                    : 'bg-white/40 hover:bg-white/60'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
