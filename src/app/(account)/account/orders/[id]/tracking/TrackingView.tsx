'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Home,
  Package,
  Truck,
  Check,
  Clock,
  MapPin,
  Phone,
  Star,
  ShoppingBag,
  ChevronDown,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/format'
import { toast } from '@/hooks/use-toast'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface DriverInfo {
  name: string
  rating: number
  vehicle: string
  avatar: string | null
  phone: string
}

interface DriverLocation {
  lat: number
  lng: number
}

interface EtaInfo {
  minutes: number
  distance: string
  trafficLevel: string
}

interface OrderItem {
  id: string
  product_name: string
  product_image_url: string | null
  quantity: number
  unit_price_pence: number
  total_price_pence: number
}

interface TrackingData {
  id: string
  order_number: string
  status: string
  delivery_postcode: string
  delivery_city: string
  created_at: string
  confirmed_at: string | null
  processing_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  subtotal_pence: number
  delivery_fee_pence: number
  total_pence: number
  order_items: OrderItem[]
  driver: DriverInfo | null
  driver_location: DriverLocation | null
  eta: EtaInfo | null
  delivery_slot: { date: string; from: string; to: string } | null
}

/* -------------------------------------------------------------------------- */
/*  Status definitions                                                        */
/* -------------------------------------------------------------------------- */

const ORDER_STATUSES = [
  {
    key: 'pending',
    label: 'Order Placed',
    description: 'Your order has been received',
    icon: ShoppingBag,
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    description: 'Order confirmed and payment verified',
    icon: Check,
  },
  {
    key: 'processing',
    label: 'Being Packed',
    description: 'Your items are being carefully packed',
    icon: Package,
  },
  {
    key: 'dispatched',
    label: 'Out for Delivery',
    description: 'Your order is on its way to you',
    icon: Truck,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Your order has been delivered',
    icon: Check,
  },
] as const

function getStatusIndex(status: string): number {
  const idx = ORDER_STATUSES.findIndex((s) => s.key === status)
  return idx === -1 ? 0 : idx
}

function getStatusBannerClasses(status: string): string {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return 'bg-(--color-info)/8 border-(--color-info)/20'
    case 'processing':
      return 'bg-(--brand-amber)/8 border-(--brand-amber)/20'
    case 'dispatched':
      return 'bg-(--brand-primary)/8 border-(--brand-primary)/20'
    case 'delivered':
      return 'bg-(--color-success)/8 border-(--color-success)/20'
    default:
      return 'bg-(--color-elevated) border-(--color-border)'
  }
}

function getStatusIconColor(status: string): string {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return 'text-(--color-info)'
    case 'processing':
      return 'text-(--brand-amber)'
    case 'dispatched':
      return 'text-(--brand-primary)'
    case 'delivered':
      return 'text-(--color-success)'
    default:
      return 'text-(--color-text-muted)'
  }
}

/* -------------------------------------------------------------------------- */
/*  TrackingMap                                                               */
/* -------------------------------------------------------------------------- */

function TrackingMap({
  driverLocation,
  destinationPostcode,
  eta,
}: {
  driverLocation: DriverLocation | null
  destinationPostcode: string
  eta: EtaInfo | null
}) {
  const [driverOffset, setDriverOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setDriverOffset((prev) => (prev + 1) % 100)
    }, 150)
    return () => clearInterval(interval)
  }, [])

  const driverX = driverLocation ? 25 + (driverOffset * 0.3) % 30 : 35
  const driverY = driverLocation ? 60 - (driverOffset * 0.15) % 20 : 55
  const destX = 75
  const destY = 30

  return (
    <div className="relative rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[16/9] aspect-[4/3] bg-(--brand-dark)">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Grid lines for map effect */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * 5}
            x2="100"
            y2={i * 5}
            stroke="white"
            strokeOpacity="0.04"
            strokeWidth="0.2"
          />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 5}
            y1="0"
            x2={i * 5}
            y2="100"
            stroke="white"
            strokeOpacity="0.04"
            strokeWidth="0.2"
          />
        ))}

        {/* Stylized road lines */}
        <path
          d="M 10 80 Q 30 70 40 55 T 60 40 T 85 25"
          fill="none"
          stroke="white"
          strokeOpacity="0.08"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 5 90 Q 25 75 45 65 T 70 45 T 90 30"
          fill="none"
          stroke="white"
          strokeOpacity="0.06"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Animated dashed route line */}
        <path
          d={`M ${driverX} ${driverY} Q ${(driverX + destX) / 2} ${Math.min(driverY, destY) - 10} ${destX} ${destY}`}
          fill="none"
          stroke="var(--brand-primary)"
          strokeOpacity="0.6"
          strokeWidth="0.6"
          strokeDasharray="2 1.5"
          strokeLinecap="round"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-7"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>

        {/* Destination pin */}
        <g transform={`translate(${destX}, ${destY})`}>
          <circle r="2.5" fill="var(--brand-amber)" opacity="0.2">
            <animate
              attributeName="r"
              values="2.5;4;2.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="1.2" fill="var(--brand-amber)" />
          <path
            d="M 0 -4 C -2 -4 -3.5 -2.5 -3.5 -1 C -3.5 1.5 0 4 0 4 C 0 4 3.5 1.5 3.5 -1 C 3.5 -2.5 2 -4 0 -4Z"
            fill="var(--brand-amber)"
            transform="translate(0, -5) scale(0.7)"
          />
          <circle r="0.5" fill="white" cy="-3.5" transform="scale(0.7)" />
        </g>

        {/* Driver dot */}
        <g transform={`translate(${driverX}, ${driverY})`}>
          <circle r="3" fill="var(--color-success)" opacity="0.15">
            <animate
              attributeName="r"
              values="3;5;3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="1.8" fill="var(--color-success)" opacity="0.3">
            <animate
              attributeName="r"
              values="1.8;3;1.8"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="1.2" fill="var(--color-success)" />
          <text
            x="0"
            y="0.5"
            textAnchor="middle"
            fontSize="1.8"
            fill="white"
            dominantBaseline="middle"
          >
            &#x1F69A;
          </text>
        </g>
      </svg>

      {/* ETA overlay card */}
      {eta && (
        <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md rounded-lg px-4 py-3 border border-white/10">
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
            ETA
          </p>
          <p className="text-white text-xl font-bold leading-tight">
            {eta.minutes} min
          </p>
          <p className="text-white/50 text-xs mt-0.5">{eta.distance} away</p>
        </div>
      )}

      {/* Destination label */}
      <div className="absolute bottom-3 left-3 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-(--brand-amber)" />
          <span className="text-white/80 text-xs font-medium">
            {destinationPostcode}
          </span>
        </div>
      </div>

      {/* Live indicator */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--color-success) opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-(--color-success)" />
        </span>
        <span className="text-white/80 text-xs font-medium">LIVE</span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function TrackingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-4 w-64 bg-(--color-elevated) rounded" />
      <div className="h-40 bg-(--color-elevated) rounded-2xl" />
      <div className="h-64 bg-(--color-elevated) rounded-2xl" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-(--color-elevated)" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-(--color-elevated) rounded" />
              <div className="h-3 w-48 bg-(--color-elevated) rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  TrackingView                                                              */
/* -------------------------------------------------------------------------- */

const STATUS_TOAST_MESSAGES: Record<string, { title: string; description: string; type: 'success' | 'info' }> = {
  confirmed: { title: 'Order Confirmed!', description: 'Your payment has been verified and order confirmed.', type: 'info' },
  processing: { title: 'Being Packed', description: 'Your items are being carefully picked and packed.', type: 'info' },
  dispatched: { title: 'Out for Delivery!', description: 'Your driver is on the way with your order.', type: 'success' },
  delivered: { title: 'Delivered!', description: 'Your order has been delivered. Enjoy your groceries!', type: 'success' },
}

export function TrackingView({ orderId }: { orderId: string }) {
  const [tracking, setTracking] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const prevStatusRef = useRef<string | null>(null)

  const fetchTracking = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/track`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to load tracking information')
      }
      const data: TrackingData = await res.json()

      // Detect status change and show toast notification
      if (prevStatusRef.current && data.status !== prevStatusRef.current) {
        const msg = STATUS_TOAST_MESSAGES[data.status]
        if (msg) {
          if (msg.type === 'success') {
            toast.success(msg.title, { description: msg.description })
          } else {
            toast.info(msg.title, { description: msg.description })
          }
        }

        // Browser notification if permitted
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const notifMsg = STATUS_TOAST_MESSAGES[data.status]
          if (notifMsg) {
            new Notification(notifMsg.title, { body: notifMsg.description, icon: '/icons/icon.svg' })
          }
        }
      }
      prevStatusRef.current = data.status

      setTracking(data)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong'
      )
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchTracking()

    // Request browser notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [fetchTracking])

  // Poll every 10s while not delivered/cancelled
  useEffect(() => {
    if (!tracking) return
    if (tracking.status === 'delivered' || tracking.status === 'cancelled') return

    const interval = setInterval(fetchTracking, 10_000)
    return () => clearInterval(interval)
  }, [tracking?.status, fetchTracking])

  if (loading) return <TrackingSkeleton />

  if (error || !tracking) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-16 w-16 text-(--color-text-muted) mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Unable to load tracking
        </h2>
        <p className="text-(--color-text-muted) mb-6">
          {error || 'Order not found'}
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-(--brand-primary) text-white font-medium hover:opacity-90 transition-opacity"
        >
          Back to Orders
        </Link>
      </div>
    )
  }

  const currentIndex = getStatusIndex(tracking.status)
  const isDispatched = tracking.status === 'dispatched'
  const isDelivered = tracking.status === 'delivered'
  const CurrentStatusIcon =
    ORDER_STATUSES[currentIndex]?.icon || Package

  function formatTimestamp(dateStr: string | null): string | null {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getStepTimestamp(key: string): string | null {
    switch (key) {
      case 'pending':
        return formatTimestamp(tracking!.created_at)
      case 'confirmed':
        return formatTimestamp(tracking!.confirmed_at)
      case 'processing':
        return formatTimestamp(tracking!.processing_at)
      case 'dispatched':
        return formatTimestamp(tracking!.shipped_at)
      case 'delivered':
        return formatTimestamp(tracking!.delivered_at)
      default:
        return null
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-(--color-text-muted)">
        <Link
          href="/"
          className="hover:text-(--brand-primary) transition-colors"
        >
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href="/account/orders"
          className="hover:text-(--brand-primary) transition-colors"
        >
          Orders
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/account/orders/${orderId}`}
          className="hover:text-(--brand-primary) transition-colors"
        >
          #{tracking.order_number}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-(--color-text) font-medium">Track</span>
      </nav>

      {/* Status Banner */}
      <div
        className={cn(
          'rounded-2xl border p-6 md:p-8',
          getStatusBannerClasses(tracking.status)
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div
            className={cn(
              'h-14 w-14 rounded-full flex items-center justify-center shrink-0',
              isDelivered
                ? 'bg-(--color-success)/15'
                : isDispatched
                  ? 'bg-(--brand-primary)/15'
                  : 'bg-(--color-info)/15',
              !isDelivered && 'animate-pulse'
            )}
          >
            <CurrentStatusIcon
              className={cn('h-7 w-7', getStatusIconColor(tracking.status))}
            />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {ORDER_STATUSES[currentIndex]?.label || tracking.status}
            </h1>
            {isDispatched && tracking.eta ? (
              <p className="text-(--color-text-secondary) mt-1">
                Arriving in ~{tracking.eta.minutes} minutes
              </p>
            ) : tracking.delivery_slot ? (
              <p className="text-(--color-text-secondary) mt-1">
                Estimated delivery: {tracking.delivery_slot.date},{' '}
                {tracking.delivery_slot.from} - {tracking.delivery_slot.to}
              </p>
            ) : isDelivered ? (
              <p className="text-(--color-text-secondary) mt-1">
                Delivered on {formatTimestamp(tracking.delivered_at)}
              </p>
            ) : null}
            {isDispatched && (
              <p className="text-(--brand-primary) text-sm font-medium mt-2 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Your driver is on the way
                <span className="inline-flex gap-0.5 ml-1">
                  <span className="animate-bounce [animation-delay:0ms]">.</span>
                  <span className="animate-bounce [animation-delay:150ms]">.</span>
                  <span className="animate-bounce [animation-delay:300ms]">.</span>
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Map Section (dispatched only) */}
      {isDispatched && (
        <TrackingMap
          driverLocation={tracking.driver_location}
          destinationPostcode={tracking.delivery_postcode}
          eta={tracking.eta}
        />
      )}

      {/* Driver Info Card (dispatched only) */}
      {isDispatched && tracking.driver && (
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-(--brand-primary)/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-(--brand-primary)">
              {tracking.driver.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">
              {tracking.driver.name}
            </p>
            <div className="flex items-center gap-3 text-sm text-(--color-text-secondary) mt-0.5">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-(--brand-amber) fill-(--brand-amber)" />
                {tracking.driver.rating}
              </span>
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" />
                {tracking.driver.vehicle}
              </span>
            </div>
          </div>
          <a
            href={`tel:${tracking.driver.phone}`}
            className="flex items-center justify-center h-10 w-10 rounded-lg bg-(--brand-primary) text-white hover:opacity-90 transition-opacity shrink-0"
            aria-label="Call driver"
          >
            <Phone className="h-4.5 w-4.5" />
          </a>
        </div>
      )}

      {/* Timeline Section */}
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 md:p-8">
        <h2 className="text-lg font-semibold text-foreground mb-6">
          Order Timeline
        </h2>
        <div className="relative">
          {ORDER_STATUSES.map((step, index) => {
            const isCompleted = currentIndex > index
            const isCurrent = currentIndex === index
            const isUpcoming = currentIndex < index
            const StepIcon = step.icon
            const timestamp = getStepTimestamp(step.key)

            return (
              <div key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                {/* Connecting line */}
                {index < ORDER_STATUSES.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-5 top-10 w-0.5 h-[calc(100%-2.5rem)]',
                      isCompleted
                        ? 'bg-(--brand-primary)'
                        : 'bg-(--color-border)'
                    )}
                  />
                )}

                {/* Circle icon */}
                <div
                  className={cn(
                    'relative z-10 flex items-center justify-center shrink-0 rounded-full transition-all',
                    isCompleted &&
                      'h-10 w-10 bg-(--brand-primary) text-white',
                    isCurrent &&
                      'h-12 w-12 bg-(--brand-amber) text-white shadow-(--shadow-md)',
                    isUpcoming &&
                      'h-10 w-10 bg-(--color-elevated) text-(--color-text-muted)'
                  )}
                >
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full bg-(--brand-amber) animate-ping opacity-20" />
                  )}
                  <StepIcon
                    className={cn(
                      'relative z-10',
                      isCurrent ? 'h-5 w-5' : 'h-4 w-4'
                    )}
                  />
                </div>

                {/* Step content */}
                <div
                  className={cn(
                    'pt-1',
                    isCurrent && 'pt-2.5'
                  )}
                >
                  <p
                    className={cn(
                      'font-semibold',
                      isCompleted && 'text-foreground',
                      isCurrent && 'text-foreground text-lg',
                      isUpcoming && 'text-(--color-text-muted)'
                    )}
                  >
                    {step.label}
                  </p>
                  <p
                    className={cn(
                      'text-sm mt-0.5',
                      isUpcoming
                        ? 'text-(--color-text-muted)'
                        : 'text-(--color-text-secondary)'
                    )}
                  >
                    {step.description}
                  </p>
                  {timestamp && (
                    <p className="text-xs text-(--color-text-muted) mt-1">
                      <Clock className="inline h-3 w-3 mr-1 -mt-0.5" />
                      {timestamp}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Order Summary (collapsible) */}
      <OrderSummary tracking={tracking} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Order Summary (collapsible)                                               */
/* -------------------------------------------------------------------------- */

function OrderSummary({ tracking }: { tracking: TrackingData }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-(--color-elevated)/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-5 w-5 text-(--color-text-muted)" />
          <span className="font-semibold text-foreground">
            Order Summary
          </span>
          <span className="text-sm text-(--color-text-muted)">
            ({tracking.order_items.length} item
            {tracking.order_items.length !== 1 ? 's' : ''})
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-(--color-text-muted) transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-(--color-border)">
          {/* Items */}
          <ul className="divide-y divide-(--color-border)">
            {tracking.order_items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="h-10 w-10 rounded-lg bg-(--color-elevated) flex items-center justify-center shrink-0 overflow-hidden">
                  {item.product_image_url ? (
                    <img
                      src={item.product_image_url}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-(--color-text-muted)" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-(--color-text-muted)">
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground shrink-0">
                  {formatPrice(item.total_price_pence)}
                </p>
              </li>
            ))}
          </ul>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-(--color-border) space-y-2">
            <div className="flex justify-between text-sm text-(--color-text-secondary)">
              <span>Subtotal</span>
              <span>{formatPrice(tracking.subtotal_pence)}</span>
            </div>
            <div className="flex justify-between text-sm text-(--color-text-secondary)">
              <span>Delivery</span>
              <span>
                {tracking.delivery_fee_pence === 0 ? (
                  <span className="text-(--color-success) font-medium">
                    Free
                  </span>
                ) : (
                  formatPrice(tracking.delivery_fee_pence)
                )}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-(--color-border)">
              <span>Total</span>
              <span className="text-(--brand-primary)">
                {formatPrice(tracking.total_pence)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
