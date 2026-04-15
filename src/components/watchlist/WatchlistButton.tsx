'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useWatchlist } from '@/hooks/use-watchlist'
import { cn } from '@/lib/utils/cn'

interface WatchlistButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function WatchlistButton({
  productId,
  className,
  size = 'md',
  showLabel = false,
}: WatchlistButtonProps) {
  const { items, toggleWatchlist } = useWatchlist()
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isInWatchlist = mounted && items.has(productId)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsLoading(true)
    try {
      toggleWatchlist(productId)
    } finally {
      setTimeout(() => setIsLoading(false), 200)
    }
  }

  if (!mounted) {
    return (
      <button
        className={cn(
          'rounded-full bg-(--color-surface)/90 shadow-sm transition-all hover:bg-(--color-surface) hover:shadow-md',
          buttonSizeClasses[size],
          className
        )}
        disabled
      >
        <Eye className={cn(sizeClasses[size], 'text-(--color-text-disabled)')} />
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'rounded-full bg-(--color-surface)/90 shadow-sm transition-all hover:bg-(--color-surface) hover:shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        buttonSizeClasses[size],
        className
      )}
      aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {isLoading ? (
        <Loader2 className={cn(sizeClasses[size], 'animate-spin text-(--color-text-disabled)')} />
      ) : isInWatchlist ? (
        <EyeOff
          className={cn(
            sizeClasses[size],
            'transition-colors',
            'fill-blue-500 text-blue-500'
          )}
        />
      ) : (
        <Eye
          className={cn(
            sizeClasses[size],
            'transition-colors',
            'text-(--color-text-disabled) hover:text-blue-500'
          )}
        />
      )}
      {showLabel && (
        <span className="ml-2 text-sm">
          {isInWatchlist ? 'Watching' : 'Watch'}
        </span>
      )}
    </button>
  )
}

export function WatchlistButtonInline({
  productId,
  className,
}: {
  productId: string
  className?: string
}) {
  const { items, toggleWatchlist } = useWatchlist()
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isInWatchlist = mounted && items.has(productId)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      toggleWatchlist(productId)
    } finally {
      setTimeout(() => setIsLoading(false), 200)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors',
        isInWatchlist
          ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
          : 'bg-(--color-surface) border-(--color-border) text-(--color-text-secondary) hover:bg-background',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isInWatchlist ? (
        <EyeOff className="h-5 w-5 fill-blue-500" />
      ) : (
        <Eye className="h-5 w-5" />
      )}
      <span>{isInWatchlist ? 'Watching' : 'Add to Watchlist'}</span>
    </button>
  )
}
