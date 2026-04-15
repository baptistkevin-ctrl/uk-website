import { cn } from '@/lib/utils'

type CarbonRating = 'A' | 'B' | 'C' | 'D' | 'E'

interface CarbonRatingBadgeProps {
  rating: CarbonRating
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

const ratingColors: Record<CarbonRating, string> = {
  A: 'bg-emerald-500 text-white',
  B: 'bg-green-400 text-white',
  C: 'bg-amber-400 text-white',
  D: 'bg-orange-500 text-white',
  E: 'bg-red-500 text-white',
}

const ratingLabels: Record<CarbonRating, string> = {
  A: 'Low Carbon',
  B: 'Low Carbon',
  C: 'Moderate',
  D: 'High Carbon',
  E: 'High Carbon',
}

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
}

export function CarbonRatingBadge({
  rating,
  size = 'md',
  showLabel = false,
  className,
}: CarbonRatingBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full font-bold',
          ratingColors[rating],
          sizeClasses[size]
        )}
        aria-label={`Carbon rating ${rating}: ${ratingLabels[rating]}`}
      >
        {rating}
      </span>
      {showLabel && (
        <span
          className={cn(
            'font-medium text-(--color-text-secondary)',
            size === 'sm' ? 'text-xs' : 'text-sm'
          )}
        >
          {ratingLabels[rating]}
        </span>
      )}
    </span>
  )
}

export type { CarbonRating, CarbonRatingBadgeProps }
