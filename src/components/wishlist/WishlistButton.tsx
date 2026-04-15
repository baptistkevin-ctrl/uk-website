'use client'

import { useState, useEffect } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { useWishlist } from '@/hooks/use-wishlist'
import { cn } from '@/lib/utils/cn'

interface WishlistButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  isLoggedIn?: boolean
}

export function WishlistButton({
  productId,
  className,
  size = 'md',
  showLabel = false,
  isLoggedIn = false,
}: WishlistButtonProps) {
  const { productIds, toggleWishlist, syncWithServer, isInitialized } = useWishlist()
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync with server when logged in and not initialized
  useEffect(() => {
    if (isLoggedIn && !isInitialized && mounted) {
      syncWithServer()
    }
  }, [isLoggedIn, isInitialized, mounted, syncWithServer])

  const isInWishlist = mounted && productIds.has(productId)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'h-12 w-12 flex items-center justify-center rounded-xl border border-(--color-border)',
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      // Redirect to login
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }

    setIsLoading(true)
    try {
      await toggleWishlist(productId)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render anything on server to avoid hydration mismatch
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
        <Heart className={cn(sizeClasses[size], 'text-(--color-text-disabled)')} />
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'rounded-full bg-(--color-surface)/90 shadow-sm transition-all hover:bg-(--color-surface) hover:shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-(--brand-primary) focus:ring-offset-2',
        buttonSizeClasses[size],
        className
      )}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isLoading ? (
        <Loader2 className={cn(sizeClasses[size], 'animate-spin text-(--color-text-disabled)')} />
      ) : (
        <Heart
          className={cn(
            sizeClasses[size],
            'transition-colors',
            isInWishlist
              ? 'fill-red-500 text-red-500'
              : 'text-(--color-text-disabled) hover:text-red-500'
          )}
        />
      )}
      {showLabel && (
        <span className="ml-2 text-sm">
          {isInWishlist ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  )
}

// Inline button for use in product details
export function WishlistButtonInline({
  productId,
  isLoggedIn = false,
  className,
}: {
  productId: string
  isLoggedIn?: boolean
  className?: string
}) {
  const { productIds, toggleWishlist, syncWithServer, isInitialized } = useWishlist()
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isLoggedIn && !isInitialized && mounted) {
      syncWithServer()
    }
  }, [isLoggedIn, isInitialized, mounted, syncWithServer])

  const isInWishlist = mounted && productIds.has(productId)

  const handleClick = async () => {
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }

    setIsLoading(true)
    try {
      await toggleWishlist(productId)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors',
        isInWishlist
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
          : 'bg-(--color-surface) border-(--color-border) text-(--color-text-secondary) hover:bg-background',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart
          className={cn(
            'h-5 w-5',
            isInWishlist && 'fill-red-500'
          )}
        />
      )}
      <span>{isInWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
    </button>
  )
}
