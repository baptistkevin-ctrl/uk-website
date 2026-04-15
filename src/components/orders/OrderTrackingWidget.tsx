'use client'

import Link from 'next/link'
import {
  ShoppingBag,
  Check,
  Package,
  Truck,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderTrackingWidgetProps {
  orderId: string
  orderNumber: string
  status: string
  deliverySlot?: { date: string; from: string; to: string }
}

const STEPS = [
  { key: 'pending', label: 'Placed', icon: ShoppingBag },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'processing', label: 'Packing', icon: Package },
  { key: 'dispatched', label: 'Delivering', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
] as const

function getStepIndex(status: string): number {
  const idx = STEPS.findIndex((s) => s.key === status)
  return idx === -1 ? 0 : idx
}

export function OrderTrackingWidget({
  orderId,
  orderNumber,
  status,
  deliverySlot,
}: OrderTrackingWidgetProps) {
  const currentIndex = getStepIndex(status)
  const isDispatched = status === 'dispatched'
  const isDelivered = status === 'delivered'

  function getStatusText(): string {
    switch (status) {
      case 'pending':
        return 'Order placed'
      case 'confirmed':
        return 'Order confirmed'
      case 'processing':
        return 'Being packed'
      case 'dispatched':
        return 'Out for delivery'
      case 'delivered':
        return 'Delivered'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          #{orderNumber}
        </p>
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            isDelivered
              ? 'bg-(--color-success)/10 text-(--color-success)'
              : isDispatched
                ? 'bg-(--brand-primary)/10 text-(--brand-primary)'
                : 'bg-(--color-info)/10 text-(--color-info)'
          )}
        >
          {getStatusText()}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, index) => {
          const isCompleted = currentIndex > index
          const isCurrent = currentIndex === index

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Dot */}
              <div className="relative">
                <div
                  className={cn(
                    'h-3 w-3 rounded-full transition-all',
                    isCompleted && 'bg-(--brand-primary)',
                    isCurrent && 'bg-(--brand-amber)',
                    !isCompleted && !isCurrent && 'bg-(--color-border)'
                  )}
                />
                {isCurrent && !isDelivered && (
                  <span className="absolute inset-0 rounded-full bg-(--brand-amber) animate-ping opacity-30" />
                )}
              </div>

              {/* Connecting line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-0.5',
                    isCompleted
                      ? 'bg-(--brand-primary)'
                      : 'bg-(--color-border)'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* ETA or delivery slot */}
      {deliverySlot && !isDelivered && (
        <p className="text-xs text-(--color-text-muted)">
          {isDispatched
            ? 'Arriving soon'
            : `Delivery: ${deliverySlot.date}, ${deliverySlot.from} - ${deliverySlot.to}`}
        </p>
      )}

      {/* Track Live button (dispatched only) */}
      {isDispatched && (
        <Link
          href={`/account/orders/${orderId}/tracking`}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-(--brand-primary) text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--color-surface) opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-(--color-surface)" />
          </span>
          Track Live
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}
