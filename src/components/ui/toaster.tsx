'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'
import { Toast } from './toast'
import { useToastStore } from '@/hooks/use-toast'

export interface ToasterProps {
  /**
   * Position of the toast container
   * @default 'bottom-right'
   */
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'

  /**
   * Maximum width of toast container
   * @default 420
   */
  maxWidth?: number

  /**
   * Gap between toasts in pixels
   * @default 12
   */
  gap?: number

  /**
   * Offset from the edge of the viewport
   * @default 24
   */
  offset?: number

  /**
   * Additional class names
   */
  className?: string

  /**
   * Whether to expand toasts on hover
   * @default true
   */
  expandOnHover?: boolean
}

const positionClasses: Record<NonNullable<ToasterProps['position']>, string> = {
  'top-left': 'top-0 left-0 items-start',
  'top-center': 'top-0 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-0 right-0 items-end',
  'bottom-left': 'bottom-0 left-0 items-start',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-0 right-0 items-end',
}

export function Toaster({
  position = 'bottom-right',
  maxWidth = 420,
  gap = 12,
  offset = 24,
  className,
  expandOnHover = true,
}: ToasterProps) {
  const [mounted, setMounted] = React.useState(false)
  const [exitingIds, setExitingIds] = React.useState<Set<string>>(new Set())
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const handleDismiss = React.useCallback(
    (id: string) => {
      // Start exit animation
      setExitingIds((prev) => new Set([...prev, id]))

      // Remove after animation completes
      setTimeout(() => {
        removeToast(id)
        setExitingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 300) // Match the animation duration
    },
    [removeToast]
  )

  // Keyboard accessibility - dismiss on Escape
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const latestToast = toasts[toasts.length - 1]
        if (latestToast && latestToast.dismissable !== false) {
          handleDismiss(latestToast.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toasts, handleDismiss])

  if (!mounted) {
    return null
  }

  // Render nothing if no toasts
  if (toasts.length === 0) {
    return null
  }

  const isTop = position.startsWith('top')

  const content = (
    <div
      aria-live="polite"
      aria-label="Notifications"
      role="region"
      className={cn(
        'fixed z-[100] flex flex-col pointer-events-none',
        positionClasses[position],
        expandOnHover && 'group/toaster',
        className
      )}
      style={{
        padding: offset,
        gap: gap,
        maxWidth: maxWidth,
        width: '100%',
      }}
    >
      <div
        className={cn(
          'flex flex-col w-full',
          isTop ? 'flex-col' : 'flex-col-reverse'
        )}
        style={{ gap: gap }}
      >
        {toasts.map((toast, index) => {
          const isExiting = exitingIds.has(toast.id)
          // Calculate stacking for collapsed state
          const reversedIndex = isTop ? index : toasts.length - 1 - index
          const isFirst = reversedIndex === 0

          return (
            <div
              key={toast.id}
              className={cn(
                'transition-all duration-300 ease-out',
                expandOnHover && !isFirst && 'group-hover/toaster:translate-y-0',
                isExiting && 'pointer-events-none'
              )}
              style={{
                animationDelay: `${reversedIndex * 50}ms`,
              }}
            >
              <Toast
                {...toast}
                isExiting={isExiting}
                onDismiss={() => handleDismiss(toast.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export { Toaster as default }
