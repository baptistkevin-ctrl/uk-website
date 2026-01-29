'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DealProgressProps {
  claimed: number
  total: number | null
  className?: string
  showText?: boolean
}

export function DealProgress({
  claimed,
  total,
  className,
  showText = true,
}: DealProgressProps) {
  if (total === null) {
    // Unlimited quantity
    return showText ? (
      <div className={cn('text-sm text-gray-500', className)}>
        {claimed.toLocaleString()} claimed
      </div>
    ) : null
  }

  const percentage = Math.min((claimed / total) * 100, 100)
  const remaining = Math.max(total - claimed, 0)
  const isLow = remaining <= Math.max(total * 0.1, 5) // Less than 10% or 5 items
  const isSoldOut = remaining === 0

  return (
    <div className={cn('space-y-1', className)}>
      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isSoldOut
              ? 'bg-gray-400'
              : isLow
              ? 'bg-orange-500'
              : 'bg-green-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Text */}
      {showText && (
        <div className="flex items-center justify-between text-xs">
          <span className={cn(
            'font-medium',
            isSoldOut
              ? 'text-gray-500'
              : isLow
              ? 'text-orange-600'
              : 'text-gray-600'
          )}>
            {isSoldOut ? (
              'Sold Out!'
            ) : isLow ? (
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                Only {remaining} left!
              </span>
            ) : (
              `${remaining.toLocaleString()} left`
            )}
          </span>
          <span className="text-gray-500">
            {percentage.toFixed(0)}% claimed
          </span>
        </div>
      )}
    </div>
  )
}

// Compact version for card overlay
export function DealProgressBadge({
  claimed,
  total,
  className,
}: {
  claimed: number
  total: number | null
  className?: string
}) {
  if (total === null) return null

  const remaining = Math.max(total - claimed, 0)
  const isLow = remaining <= Math.max(total * 0.1, 5)
  const isSoldOut = remaining === 0

  if (isSoldOut) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        'bg-gray-500 text-white',
        className
      )}>
        Sold Out
      </span>
    )
  }

  if (isLow) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        'bg-orange-500 text-white',
        className
      )}>
        <Flame className="h-3 w-3" />
        {remaining} left!
      </span>
    )
  }

  return null
}
