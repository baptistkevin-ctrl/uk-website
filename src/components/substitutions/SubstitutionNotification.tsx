'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Check, X, Package, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubstitutionNotificationProps {
  orderId: string
  originalProduct: {
    name: string
    image_url?: string
  }
  substitution: {
    name: string
    price_pence: number
    score: number
  }
  onAccept: () => void
  onReject: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTO_DISMISS_MS = 30_000
const VIBRATION_PATTERN = [100, 50, 100]

// ---------------------------------------------------------------------------
// Score badge
// ---------------------------------------------------------------------------

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-(--color-success)/15 text-(--color-success)'
      : score >= 60
        ? 'bg-(--brand-amber)/15 text-(--brand-amber)'
        : 'bg-(--color-error)/15 text-(--color-error)'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold',
        color,
      )}
    >
      {score}% match
    </span>
  )
}

// ---------------------------------------------------------------------------
// SubstitutionNotification
// ---------------------------------------------------------------------------

export function SubstitutionNotification({
  orderId,
  originalProduct,
  substitution,
  onAccept,
  onReject,
}: SubstitutionNotificationProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(AUTO_DISMISS_MS / 1000)

  // Vibrate on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(VIBRATION_PATTERN)
    }
  }, [])

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (dismissed) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [dismissed])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => setDismissed(true), 300)
  }, [])

  function handleAccept() {
    onAccept()
    handleDismiss()
  }

  function handleReject() {
    onReject()
    handleDismiss()
  }

  if (dismissed) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'fixed right-4 bottom-4 z-50 w-full max-w-sm transition-all duration-300 ease-out',
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0',
      )}
    >
      <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-lg)">
        {/* Progress bar */}
        <div className="h-1 w-full bg-(--color-elevated)">
          <div
            className="h-full bg-(--brand-primary) transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / (AUTO_DISMISS_MS / 1000)) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-(--brand-primary)/10">
              <Package className="h-3.5 w-3.5 text-(--brand-primary)" />
            </div>
            <span className="text-xs font-medium text-(--color-text-secondary)">
              Your order is being picked
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-6 w-6 items-center justify-center rounded-full text-(--color-text-muted) transition-colors hover:bg-(--color-elevated) hover:text-foreground"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pt-2.5 pb-3">
          <p className="text-xs text-(--color-text-muted)">
            <span className="line-through">{originalProduct.name}</span>
            {' '}is unavailable
          </p>

          <div className="mt-2.5 flex items-center gap-3">
            {/* Substitute image */}
            {originalProduct.image_url && (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-(--color-elevated)">
                <Image
                  src={originalProduct.image_url}
                  alt={substitution.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {substitution.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {formatPrice(substitution.price_pence)}
                </span>
                <ScoreBadge score={substitution.score} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-(--color-border) px-4 py-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={handleAccept}
          >
            <Check className="h-3.5 w-3.5" />
            Accept
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={handleReject}
          >
            <X className="h-3.5 w-3.5" />
            Decline
          </Button>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-1 pb-2">
          <Clock className="h-3 w-3 text-(--color-text-muted)" />
          <span className="text-[11px] text-(--color-text-muted)">
            Auto-dismisses in {timeLeft}s
          </span>
        </div>
      </div>
    </div>
  )
}
