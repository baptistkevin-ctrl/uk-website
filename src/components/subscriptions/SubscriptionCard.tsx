'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Pause,
  Play,
  SkipForward,
  Settings,
  Trash2,
  ChevronDown,
  Minus,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/format'
import { formatUKDate } from '@/lib/locale'
import {
  useSubscriptionStore,
  FREQUENCY_OPTIONS,
  SUBSCRIPTION_DISCOUNT,
  type ProductSubscription,
  type SubscriptionFrequency,
} from '@/stores/subscription-store'

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    dotClass: 'bg-(--color-success)',
    bgClass: 'bg-(--color-success)/10',
    textClass: 'text-(--color-success)',
  },
  paused: {
    label: 'Paused',
    dotClass: 'bg-(--color-warning)',
    bgClass: 'bg-(--color-warning)/10',
    textClass: 'text-(--color-warning)',
  },
  cancelled: {
    label: 'Cancelled',
    dotClass: 'bg-(--color-text-muted)',
    bgClass: 'bg-(--color-text-muted)/10',
    textClass: 'text-(--color-text-muted)',
  },
} as const

function StatusBadge({ status }: { status: ProductSubscription['status'] }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        config.bgClass,
        config.textClass
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Edit Panel (inline expandable)
// ---------------------------------------------------------------------------

function EditPanel({
  subscription,
  onClose,
}: {
  subscription: ProductSubscription
  onClose: () => void
}) {
  const { updateFrequency, updateQuantity } = useSubscriptionStore()

  return (
    <div className="mt-3 rounded-lg border border-(--color-border) bg-(--color-elevated) p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-(--color-text-secondary)">
          Edit subscription
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-(--color-text-muted) hover:text-(--color-text-secondary)"
        >
          Done
        </button>
      </div>

      {/* Frequency */}
      <div className="mb-2">
        <label className="mb-1 block text-xs text-(--color-text-muted)">Frequency</label>
        <div className="relative">
          <select
            value={subscription.frequency}
            onChange={(e) =>
              updateFrequency(subscription.id, e.target.value as SubscriptionFrequency)
            }
            className={cn(
              'w-full appearance-none rounded-lg border border-(--color-border)',
              'bg-(--color-surface) px-3 py-2 pr-8 text-sm text-(--color-text)',
              'focus:border-(--brand-primary) focus:outline-none focus:ring-1 focus:ring-(--brand-primary)'
            )}
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-(--color-text-muted)"
          />
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="mb-1 block text-xs text-(--color-text-muted)">Quantity</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateQuantity(subscription.id, subscription.quantity - 1)}
            disabled={subscription.quantity <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-(--color-border) text-(--color-text-secondary) hover:bg-(--color-elevated) disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-sm font-semibold text-(--color-text)">
            {subscription.quantity}
          </span>
          <button
            type="button"
            onClick={() => updateQuantity(subscription.id, subscription.quantity + 1)}
            disabled={subscription.quantity >= 10}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-(--color-border) text-(--color-text-secondary) hover:bg-(--color-elevated) disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SubscriptionCard (main export)
// ---------------------------------------------------------------------------

interface SubscriptionCardProps {
  subscription: ProductSubscription
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const { pauseSubscription, resumeSubscription, skipNextDelivery, unsubscribe } =
    useSubscriptionStore()
  const [editing, setEditing] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const frequencyLabel =
    FREQUENCY_OPTIONS.find((f) => f.value === subscription.frequency)?.label ?? subscription.frequency
  const originalPrice = subscription.productPrice * subscription.quantity
  const discountedPrice = Math.round(originalPrice * (1 - SUBSCRIPTION_DISCOUNT / 100))
  const nextDate = new Date(subscription.nextDeliveryDate)
  const isActive = subscription.status === 'active'
  const isPaused = subscription.status === 'paused'
  const isCancelled = subscription.status === 'cancelled'

  return (
    <div
      className={cn(
        'rounded-xl border bg-(--color-surface) p-4 transition-shadow',
        isCancelled
          ? 'border-(--color-border) opacity-60'
          : 'border-(--color-border) hover:shadow-(--shadow-sm)'
      )}
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-(--color-elevated)">
          {subscription.productImage ? (
            <Image
              src={subscription.productImage}
              alt={subscription.productName}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-(--color-text-muted)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
              </svg>
            </div>
          )}
        </div>

        {/* Center info */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-(--color-text)">
              {subscription.productName}
            </h3>
            <StatusBadge status={subscription.status} />
          </div>

          <p className="text-xs text-(--color-text-muted)">
            {frequencyLabel}
            {subscription.quantity > 1 && ` \u00b7 Qty: ${subscription.quantity}`}
          </p>

          {!isCancelled && (
            <p className="mt-0.5 text-xs text-(--color-text-muted)">
              Next delivery:{' '}
              <span className="font-medium text-(--color-text-secondary)">
                {formatUKDate(nextDate)}
              </span>
            </p>
          )}
        </div>

        {/* Right — pricing */}
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-(--color-text)">
            {formatPrice(discountedPrice)}
          </p>
          <p className="text-xs text-(--color-text-muted) line-through">
            {formatPrice(originalPrice)}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-(--color-success)">
            Save {SUBSCRIPTION_DISCOUNT}%
          </p>
        </div>
      </div>

      {/* Action buttons */}
      {!isCancelled && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-(--color-border) pt-3">
          {/* Pause / Resume */}
          <button
            type="button"
            onClick={() =>
              isPaused
                ? resumeSubscription(subscription.id)
                : pauseSubscription(subscription.id)
            }
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border border-(--color-border) px-3 py-2',
              'text-xs font-medium text-(--color-text-secondary)',
              'transition-colors hover:bg-(--color-elevated)'
            )}
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          {/* Skip Next (only if active) */}
          {isActive && (
            <button
              type="button"
              onClick={() => skipNextDelivery(subscription.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border border-(--color-border) px-3 py-2',
                'text-xs font-medium text-(--color-text-secondary)',
                'transition-colors hover:bg-(--color-elevated)'
              )}
            >
              <SkipForward size={12} />
              Skip Next
            </button>
          )}

          {/* Edit */}
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border border-(--color-border) px-3 py-2',
              'text-xs font-medium text-(--color-text-secondary)',
              'transition-colors hover:bg-(--color-elevated)',
              editing && 'border-(--brand-primary)/30 bg-(--brand-primary)/5 text-(--brand-primary)'
            )}
          >
            <Settings size={12} />
            Edit
          </button>

          {/* Cancel */}
          {confirmCancel ? (
            <div className="ml-auto flex items-center gap-1.5">
              <span className="text-xs text-(--color-text-muted)">Cancel?</span>
              <button
                type="button"
                onClick={() => {
                  unsubscribe(subscription.id)
                  setConfirmCancel(false)
                }}
                className="rounded-lg bg-(--color-error) px-3 py-2.5 text-xs font-semibold text-white"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="rounded-lg border border-(--color-border) px-3 py-2.5 text-xs font-medium text-(--color-text-secondary)"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className={cn(
                'ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2',
                'text-xs font-medium text-(--color-error)',
                'transition-colors hover:bg-(--color-error)/5'
              )}
            >
              <Trash2 size={12} />
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Edit panel */}
      {editing && !isCancelled && (
        <EditPanel subscription={subscription} onClose={() => setEditing(false)} />
      )}
    </div>
  )
}
