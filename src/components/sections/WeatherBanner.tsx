'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeatherBannerProps {
  weatherMood: string
  season: string
}

// ---------------------------------------------------------------------------
// Weather config
// ---------------------------------------------------------------------------

interface WeatherConfig {
  emoji: string
  message: string
  linkText: string
  href: string
}

function getWeatherConfig(weatherMood: string, season: string): WeatherConfig {
  const lower = weatherMood.toLowerCase()

  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('storm')) {
    return {
      emoji: '🌧️',
      message: 'Perfect weather for a warm soup!',
      linkText: 'Browse comfort food',
      href: '/shop?category=soups-broths',
    }
  }

  if (lower.includes('sun') || lower.includes('clear') || lower.includes('hot')) {
    return {
      emoji: '☀️',
      message: 'Beautiful day! Stock up on BBQ essentials',
      linkText: 'Shop BBQ',
      href: '/shop?category=bbq',
    }
  }

  if (lower.includes('cold') || lower.includes('frost') || lower.includes('snow') || lower.includes('ice')) {
    return {
      emoji: '❄️',
      message: 'Chilly outside? Warm up with hearty meals',
      linkText: 'Shop hearty meals',
      href: '/shop?category=ready-meals',
    }
  }

  if (lower.includes('cloud') || lower.includes('overcast')) {
    return {
      emoji: '☁️',
      message: 'Cosy day — treat yourself to something warm',
      linkText: 'Browse hot drinks',
      href: '/shop?category=hot-drinks',
    }
  }

  if (lower.includes('wind') || lower.includes('breez')) {
    return {
      emoji: '💨',
      message: 'Breezy day! Great weather for a baked treat',
      linkText: 'Shop bakery',
      href: '/shop?category=bakery',
    }
  }

  // Seasonal fallback
  const seasonLower = season.toLowerCase()
  if (seasonLower === 'winter') {
    return {
      emoji: '🍵',
      message: 'Stay warm this winter with comforting classics',
      linkText: 'Shop winter warmers',
      href: '/shop?category=winter-warmers',
    }
  }
  if (seasonLower === 'summer') {
    return {
      emoji: '🍦',
      message: 'Cool down with refreshing summer picks',
      linkText: 'Shop summer favourites',
      href: '/shop?category=summer',
    }
  }
  if (seasonLower === 'spring') {
    return {
      emoji: '🌱',
      message: 'Fresh spring produce is here!',
      linkText: 'Shop fresh produce',
      href: '/shop?category=fresh',
    }
  }

  // Autumn / generic fallback
  return {
    emoji: '🍂',
    message: 'Seasonal picks just for you',
    linkText: 'Explore seasonal',
    href: '/shop?category=seasonal',
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeatherBanner({ weatherMood, season }: WeatherBannerProps) {
  const config = getWeatherConfig(weatherMood, season)

  return (
    <div
      className={cn(
        'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
        'py-2',
      )}
    >
      <Link
        href={config.href}
        className={cn(
          'flex items-center justify-between gap-3',
          'bg-(--color-elevated) rounded-xl p-4',
          'hover:bg-(--color-surface) transition-colors group',
        )}
      >
        <p className="text-sm text-(--color-text-secondary)">
          <span className="mr-1.5">{config.emoji}</span>
          {config.message}
        </p>
        <span
          className={cn(
            'shrink-0 text-sm font-medium text-(--brand-primary)',
            'group-hover:underline',
          )}
        >
          {config.linkText} &rarr;
        </span>
      </Link>
    </div>
  )
}
