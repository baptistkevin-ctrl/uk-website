'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { useWeatherStore } from '@/stores/weather-store'
import type { WeatherCondition } from '@/lib/weather/weather-engine'

/* ─── Condition mapping ────────────────────────────────────── */

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

/* ─── Props ────────────────────────────────────────────────── */

interface WeatherWidgetProps {
  compact?: boolean
}

/* ─── Component ────────────────────────────────────────────── */

export function WeatherWidget({ compact = false }: WeatherWidgetProps) {
  const { weather, isLoading, fetchWeather, isStale } = useWeatherStore()

  useEffect(() => {
    if (isStale()) {
      fetchWeather()
    }
  }, [fetchWeather, isStale])

  if (!weather && isLoading) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-(--color-text-muted) animate-pulse">
          <span className="w-3 h-3 rounded-full bg-(--color-border)" />
          <span className="w-8 h-3 rounded bg-(--color-border)" />
        </span>
      )
    }

    return (
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 animate-pulse space-y-3">
        <div className="h-8 w-20 rounded bg-(--color-border)" />
        <div className="h-4 w-32 rounded bg-(--color-border)" />
        <div className="h-4 w-24 rounded bg-(--color-border)" />
      </div>
    )
  }

  if (!weather) return null

  const emoji = CONDITION_EMOJI[weather.condition] ?? '🌤️'
  const label = CONDITION_LABEL[weather.condition] ?? 'Weather'

  /* ── Compact mode (header) ─────────────────────────────── */

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 text-sm text-(--color-text-secondary) select-none"
        title={`${weather.temperature}°C · ${label} · ${weather.location}`}
      >
        <span className="text-(--color-text)">{weather.temperature}°C</span>
        <span>{emoji}</span>
      </span>
    )
  }

  /* ── Full mode (sidebar) ───────────────────────────────── */

  return (
    <div
      className={cn(
        'rounded-xl border border-(--color-border)',
        'bg-(--color-surface) p-4 space-y-3'
      )}
    >
      {/* Temperature */}
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-bold text-(--color-text)">
          {weather.temperature}°C
        </span>
        <span className="text-xl" aria-hidden="true">
          {emoji}
        </span>
      </div>

      {/* Condition + Location */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-(--color-text)">
          {label}
        </p>
        <p className="text-xs text-(--color-text-muted)">
          {weather.location}
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/products?source=weather"
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium',
          'text-(--brand-primary) hover:underline'
        )}
      >
        Shop weather picks
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
