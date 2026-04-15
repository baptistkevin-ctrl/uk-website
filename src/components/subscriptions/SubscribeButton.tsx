'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, ChevronDown, Minus, Plus, Sparkles, X, Pause, RefreshCw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/format'
import {
  useSubscriptionStore,
  FREQUENCY_OPTIONS,
  SUBSCRIPTION_DISCOUNT,
  type SubscriptionFrequency,
} from '@/stores/subscription-store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubscribeButtonProps {
  product: {
    id: string
    name: string
    image_url: string | null
    price_pence: number
  }
  size?: 'sm' | 'md'
}

// ---------------------------------------------------------------------------
// Subscribe Popover (frequency selector + confirm)
// ---------------------------------------------------------------------------

function SubscribePopover({
  product,
  onClose,
  size,
}: {
  product: SubscribeButtonProps['product']
  onClose: () => void
  size: 'sm' | 'md'
}) {
  const { subscribe, getSuggestedFrequency } = useSubscriptionStore()
  const suggested = getSuggestedFrequency(product.name)

  const [frequency, setFrequency] = useState<SubscriptionFrequency>(suggested)
  const [quantity, setQuantity] = useState(1)

  const discountedPence = Math.round(product.price_pence * (1 - SUBSCRIPTION_DISCOUNT / 100))
  const savingsPerDelivery = (product.price_pence - discountedPence) * quantity
  const frequencyDays = FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.days ?? 30
  const monthlyEstimate = Math.round(discountedPence * quantity * (30 / frequencyDays))

  const handleSubscribe = useCallback(() => {
    subscribe(product, frequency, quantity)
    onClose()
  }, [subscribe, product, frequency, quantity, onClose])

  return (
    <div
      className={cn(
        'absolute z-50 mt-1',
        'rounded-xl border border-(--color-border) bg-(--color-surface)',
        'shadow-(--shadow-md) p-4',
        size === 'sm' ? 'w-72 right-0' : 'w-80 left-0'
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-(--color-text)">Choose frequency</h4>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-(--color-text-muted) hover:bg-(--color-elevated)"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Frequency Options */}
      <fieldset className="mb-3 space-y-1.5">
        <legend className="sr-only">Delivery frequency</legend>
        {FREQUENCY_OPTIONS.map((option) => {
          const isSelected = frequency === option.value
          const isSuggested = option.value === suggested
          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors',
                isSelected
                  ? 'border-(--brand-primary) bg-(--brand-primary)/5'
                  : 'border-(--color-border) hover:border-(--color-border)/80 hover:bg-(--color-elevated)'
              )}
            >
              <input
                type="radio"
                name="frequency"
                value={option.value}
                checked={isSelected}
                onChange={() => setFrequency(option.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                  isSelected ? 'border-(--brand-primary)' : 'border-(--color-border)'
                )}
              >
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-(--brand-primary)" />
                )}
              </span>
              <span className="flex-1 text-(--color-text)">{option.label}</span>
              {isSuggested && (
                <span className="inline-flex items-center gap-1 rounded-full bg-(--brand-amber)/10 px-2 py-0.5 text-[11px] font-semibold text-(--brand-amber)">
                  <Sparkles size={10} />
                  Recommended
                </span>
              )}
            </label>
          )
        })}
      </fieldset>

      {/* Quantity */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-(--color-text-secondary)">Quantity</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-(--color-border) text-(--color-text-secondary) hover:bg-(--color-elevated) disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-sm font-semibold text-(--color-text)">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            disabled={quantity >= 10}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-(--color-border) text-(--color-text-secondary) hover:bg-(--color-elevated) disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Savings summary */}
      <div className="mb-3 space-y-1 rounded-lg bg-(--color-elevated) p-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-(--color-text-muted)">You save per delivery</span>
          <span className="font-semibold text-(--color-success)">
            {formatPrice(savingsPerDelivery)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-(--color-text-muted)">Estimated monthly</span>
          <span className="font-semibold text-(--color-text)">
            {formatPrice(monthlyEstimate)}
          </span>
        </div>
      </div>

      {/* Subscribe CTA */}
      <button
        type="button"
        onClick={handleSubscribe}
        className={cn(
          'w-full rounded-lg bg-(--brand-amber) px-4 py-2.5 text-sm font-semibold text-white',
          'shadow-(--shadow-amber) transition-all',
          'hover:-translate-y-0.5 hover:bg-(--brand-amber-hover)',
          'active:translate-y-0'
        )}
      >
        Subscribe
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Manage Popover (pause, change frequency, cancel)
// ---------------------------------------------------------------------------

function ManagePopover({
  productId,
  onClose,
  size,
}: {
  productId: string
  onClose: () => void
  size: 'sm' | 'md'
}) {
  const { getSubscription, pauseSubscription, resumeSubscription, unsubscribe, updateFrequency } =
    useSubscriptionStore()
  const subscription = getSubscription(productId)

  if (!subscription) return null

  const isPaused = subscription.status === 'paused'

  return (
    <div
      className={cn(
        'absolute z-50 mt-1',
        'rounded-xl border border-(--color-border) bg-(--color-surface)',
        'shadow-(--shadow-md) p-3',
        size === 'sm' ? 'w-56 right-0' : 'w-64 left-0'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-(--color-text)">Manage</h4>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-(--color-text-muted) hover:bg-(--color-elevated)"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Frequency selector */}
      <div className="mb-2">
        <label className="mb-1 block text-xs text-(--color-text-muted)">Frequency</label>
        <select
          value={subscription.frequency}
          onChange={(e) =>
            updateFrequency(subscription.id, e.target.value as SubscriptionFrequency)
          }
          className={cn(
            'w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2',
            'text-sm text-(--color-text)',
            'focus:border-(--brand-primary) focus:outline-none focus:ring-1 focus:ring-(--brand-primary)'
          )}
        >
          {FREQUENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        {/* Pause / Resume */}
        <button
          type="button"
          onClick={() => {
            isPaused
              ? resumeSubscription(subscription.id)
              : pauseSubscription(subscription.id)
            onClose()
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-(--color-text-secondary) hover:bg-(--color-elevated)"
        >
          {isPaused ? <RefreshCw size={14} /> : <Pause size={14} />}
          {isPaused ? 'Resume subscription' : 'Pause subscription'}
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={() => {
            unsubscribe(subscription.id)
            onClose()
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-(--color-error) hover:bg-(--color-error)/5"
        >
          <Trash2 size={14} />
          Cancel subscription
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SubscribeButton (main export)
// ---------------------------------------------------------------------------

export function SubscribeButton({ product, size = 'md' }: SubscribeButtonProps) {
  const { isSubscribed, getSubscription } = useSubscriptionStore()
  const subscribed = isSubscribed(product.id)
  const subscription = getSubscription(product.id)

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const isPaused = subscription?.status === 'paused'

  return (
    <div ref={containerRef} className="relative">
      {subscribed ? (
        /* Subscribed badge */
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors',
            isPaused
              ? 'bg-(--color-warning)/10 text-(--color-warning)'
              : 'bg-(--color-success)/10 text-(--color-success)',
            size === 'sm' ? 'px-3 py-2.5 text-xs' : 'px-3 py-2.5 text-sm',
            'hover:opacity-80'
          )}
        >
          <Check size={size === 'sm' ? 12 : 14} />
          {isPaused ? 'Paused' : 'Subscribed'}
          <ChevronDown size={size === 'sm' ? 10 : 12} />
        </button>
      ) : (
        /* Subscribe & Save button */
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border border-(--brand-amber)/30 font-semibold transition-all',
            'bg-(--brand-amber)/5 text-(--brand-amber)',
            'hover:bg-(--brand-amber)/10 hover:border-(--brand-amber)/50',
            size === 'sm' ? 'px-3 py-2.5 text-xs' : 'px-3 py-2.5 text-sm'
          )}
        >
          <RefreshCw size={size === 'sm' ? 12 : 14} />
          Subscribe &amp; Save {SUBSCRIPTION_DISCOUNT}%
        </button>
      )}

      {/* Popover */}
      {open &&
        (subscribed ? (
          <ManagePopover productId={product.id} onClose={() => setOpen(false)} size={size} />
        ) : (
          <SubscribePopover product={product} onClose={() => setOpen(false)} size={size} />
        ))}
    </div>
  )
}
