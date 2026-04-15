'use client'

import { useRouter } from 'next/navigation'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { ShoppingCart, Loader2 } from 'lucide-react'

export function PullToRefreshIndicator() {
  const router = useRouter()

  const { pulling, refreshing, pullDistance, progress, pastThreshold } =
    usePullToRefresh({
      onRefresh: async () => {
        router.refresh()
        // Small delay for visual feedback
        await new Promise((r) => setTimeout(r, 600))
      },
    })

  if (!pulling && !refreshing) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center lg:hidden pointer-events-none"
      style={{
        height: `${pullDistance}px`,
        transition: pulling ? 'none' : 'height 0.3s ease-out',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-(--brand-primary) text-white shadow-lg"
        style={{
          width: 40,
          height: 40,
          opacity: Math.min(progress * 1.5, 1),
          transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 360}deg)`,
          transition: pulling ? 'none' : 'all 0.3s ease-out',
        }}
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ShoppingCart
            className="h-5 w-5"
            style={{
              color: pastThreshold ? 'white' : 'rgba(255,255,255,0.7)',
            }}
          />
        )}
      </div>
    </div>
  )
}
