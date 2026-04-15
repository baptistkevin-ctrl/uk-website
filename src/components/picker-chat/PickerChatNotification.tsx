'use client'

import { useEffect, useState, useCallback } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/* ── Constants ── */

const AUTO_DISMISS_MS = 5_000

/* ── Props ── */

interface PickerChatNotificationProps {
  message: string
  pickerName: string
  onOpen: () => void
}

/* ── Component ── */

export default function PickerChatNotification({
  message,
  pickerName,
  onOpen,
}: PickerChatNotificationProps) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => setVisible(false), 300)
  }, [])

  /* Auto-dismiss */
  useEffect(() => {
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [dismiss])

  /* Haptic feedback */
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'fixed top-4 right-4 z-[60]',
        'w-[340px] rounded-xl',
        'bg-(--color-surface) border border-(--color-border)',
        'shadow-(--shadow-(--shadow-xl))',
        'overflow-hidden',
        'transition-all duration-300',
        exiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100 animate-in slide-in-from-right-full',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Avatar */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center',
            'rounded-full bg-(--brand-primary) text-white',
          )}
        >
          <MessageCircle className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-(--color-text)">
            {pickerName}
          </p>
          <p className="mt-0.5 text-sm text-(--color-text-secondary) line-clamp-2">
            {message}
          </p>

          <button
            type="button"
            onClick={() => {
              onOpen()
              dismiss()
            }}
            className={cn(
              'mt-2 rounded-lg px-3 py-1.5',
              'text-xs font-semibold',
              'bg-(--brand-primary) text-white',
              'hover:bg-(--brand-primary-hover)',
              'transition-colors cursor-pointer',
            )}
          >
            Reply
          </button>
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={dismiss}
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center',
            'rounded-full hover:bg-(--color-elevated)',
            'text-(--color-text-muted) transition-colors cursor-pointer',
          )}
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-(--color-elevated)">
        <div
          className="h-full bg-(--brand-primary) origin-left"
          style={{
            animation: `shrinkWidth ${AUTO_DISMISS_MS}ms linear forwards`,
          }}
        />
      </div>

      {/* Inline keyframe for the progress bar */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
