'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { hapticLight } from '@/lib/utils/haptics'

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  maxPull?: number
  disabled?: boolean
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  disabled = false,
}: PullToRefreshOptions) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const currentY = useRef(0)
  const hapticFired = useRef(false)

  const canPull = useCallback(() => {
    if (disabled || refreshing) return false
    // Only pull when at top of page
    return window.scrollY <= 0
  }, [disabled, refreshing])

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!canPull()) return
      startY.current = e.touches[0].clientY
      hapticFired.current = false
    },
    [canPull]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!canPull() || startY.current === 0) return

      currentY.current = e.touches[0].clientY
      const diff = currentY.current - startY.current

      if (diff > 0) {
        // Apply resistance curve
        const distance = Math.min(diff * 0.5, maxPull)
        setPulling(true)
        setPullDistance(distance)

        // Haptic when crossing threshold
        if (distance >= threshold && !hapticFired.current) {
          hapticLight()
          hapticFired.current = true
        }
      }
    },
    [canPull, maxPull, threshold]
  )

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) {
      startY.current = 0
      return
    }

    if (pullDistance >= threshold) {
      setRefreshing(true)
      setPullDistance(threshold * 0.6)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }

    setPulling(false)
    setPullDistance(0)
    startY.current = 0
  }, [pulling, pullDistance, threshold, onRefresh])

  useEffect(() => {
    // Only attach on mobile/tablet
    const mql = window.matchMedia('(max-width: 1023px)')
    if (!mql.matches) return

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const progress = Math.min(pullDistance / threshold, 1)
  const pastThreshold = pullDistance >= threshold

  return { pulling, refreshing, pullDistance, progress, pastThreshold }
}
