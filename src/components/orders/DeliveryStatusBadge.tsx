'use client'

import { cn } from '@/lib/utils'

interface DeliveryStatusBadgeProps {
  status: string
}

const STATUS_CONFIG: Record<
  string,
  { label: string; dotClass: string; textClass: string; animated?: boolean; checkIcon?: boolean }
> = {
  pending: {
    label: 'Pending',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-600',
  },
  confirmed: {
    label: 'Confirmed',
    dotClass: 'bg-(--color-info)',
    textClass: 'text-(--color-info)',
  },
  processing: {
    label: 'Being Packed',
    dotClass: 'bg-(--brand-amber)',
    textClass: 'text-(--brand-amber)',
  },
  dispatched: {
    label: 'Out for Delivery',
    dotClass: 'bg-(--color-success)',
    textClass: 'text-(--color-success)',
    animated: true,
  },
  delivered: {
    label: 'Delivered',
    dotClass: 'bg-(--color-success)',
    textClass: 'text-(--color-success)',
    checkIcon: true,
  },
  cancelled: {
    label: 'Cancelled',
    dotClass: 'bg-red-500',
    textClass: 'text-red-500',
  },
}

export function DeliveryStatusBadge({ status }: DeliveryStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
    dotClass: 'bg-(--color-text-muted)',
    textClass: 'text-(--color-text-muted)',
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {config.checkIcon ? (
        <svg
          className={cn('h-3.5 w-3.5', config.textClass)}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.15" />
          <path
            d="M5 8.5L7 10.5L11 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span className="relative flex h-2 w-2">
          {config.animated && (
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                config.dotClass
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              config.dotClass
            )}
          />
        </span>
      )}
      <span className={cn('text-xs font-medium', config.textClass)}>
        {config.label}
      </span>
    </span>
  )
}
