'use client'

import { StarRating } from './StarRating'
import { cn } from '@/lib/utils/cn'

interface ReviewSummaryProps {
  avgRating: number
  reviewCount: number
  breakdown: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  className?: string
}

export function ReviewSummary({
  avgRating,
  reviewCount,
  breakdown,
  className,
}: ReviewSummaryProps) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)

  return (
    <div className={cn('flex gap-8', className)}>
      {/* Overall Rating */}
      <div className="text-center">
        <div className="text-5xl font-bold text-foreground">
          {avgRating.toFixed(1)}
        </div>
        <StarRating rating={avgRating} size="lg" className="mt-2 justify-center" />
        <div className="text-sm text-(--color-text-muted) mt-1">
          {reviewCount.toLocaleString()} {reviewCount === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = breakdown[star as keyof typeof breakdown]
          const percentage = total > 0 ? (count / total) * 100 : 0

          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-sm text-(--color-text-secondary) w-12">{star} star</span>
              <div className="flex-1 h-2 bg-(--color-elevated) rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-(--color-text-muted) w-12 text-right">
                {percentage.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Compact version for sidebar or mobile
export function ReviewSummaryCompact({
  avgRating,
  reviewCount,
  className,
}: {
  avgRating: number
  reviewCount: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-2xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
      <div>
        <StarRating rating={avgRating} size="sm" />
        <div className="text-xs text-(--color-text-muted)">
          {reviewCount.toLocaleString()} reviews
        </div>
      </div>
    </div>
  )
}
