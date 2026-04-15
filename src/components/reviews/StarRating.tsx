'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const handleClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, starIndex: number) => {
    if (interactive && onRatingChange && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onRatingChange(starIndex + 1)
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, index) => {
          const filled = index < Math.floor(rating)
          const partial = !filled && index < rating
          const fillPercentage = partial ? (rating - index) * 100 : 0

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'relative focus:outline-none',
                interactive && 'cursor-pointer hover:scale-110 transition-transform',
                !interactive && 'cursor-default'
              )}
              aria-label={interactive ? `Rate ${index + 1} stars` : undefined}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  filled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-(--color-text-disabled)'
                )}
              />
              {partial && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      'fill-yellow-400 text-yellow-400'
                    )}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>
      {showValue && (
        <span className={cn('text-(--color-text-secondary) ml-1', textClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Compact version for product cards
export function StarRatingCompact({
  rating,
  reviewCount,
  size = 'sm',
  className,
}: {
  rating: number
  reviewCount: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  }

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Star className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')} />
      <span className={cn('font-medium', textClasses[size])}>{rating.toFixed(1)}</span>
      <span className={cn('text-(--color-text-muted)', textClasses[size])}>
        ({reviewCount.toLocaleString()})
      </span>
    </div>
  )
}
