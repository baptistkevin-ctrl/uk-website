'use client'

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search,
  Package,
  Loader2,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  ShoppingBag,
  AlertCircle,
  ArrowLeft,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils/format'

const trackingSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  email: z.string().email('Please enter a valid email'),
})

type TrackingForm = z.infer<typeof trackingSchema>

interface OrderItem {
  id: string
  product_name: string
  product_image_url: string | null
  quantity: number
  unit_price_pence: number
  total_price_pence: number
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  customer_name: string
  customer_email: string
  delivery_address_line_1: string
  delivery_address_line_2: string | null
  delivery_city: string
  delivery_postcode: string
  subtotal_pence: number
  delivery_fee_pence: number
  total_pence: number
  created_at: string
  confirmed_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  order_items: OrderItem[]
}

const statusSteps = [
  { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
]

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-(--color-warning-bg)', text: 'text-(--color-warning)', border: 'border-(--color-warning)' },
  confirmed: { bg: 'bg-(--color-info-bg)', text: 'text-(--color-info)', border: 'border-(--color-info)' },
  processing: { bg: 'bg-(--color-info-bg)', text: 'text-(--color-info)', border: 'border-(--color-info)' },
  shipped: { bg: 'bg-(--brand-amber-soft)', text: 'text-(--brand-amber)', border: 'border-(--brand-amber)' },
  delivered: { bg: 'bg-(--color-success-bg)', text: 'text-(--color-success)', border: 'border-(--color-success)' },
  cancelled: { bg: 'bg-(--color-error-bg)', text: 'text-(--color-error)', border: 'border-(--color-error)' },
}

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const initialOrderNumber = searchParams.get('order') || ''

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TrackingForm>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      orderNumber: initialOrderNumber,
      email: '',
    },
  })

  useEffect(() => {
    if (initialOrderNumber) {
      setValue('orderNumber', initialOrderNumber)
    }
  }, [initialOrderNumber, setValue])

  const onSubmit = async (data: TrackingForm) => {
    setIsLoading(true)
    setError(null)
    setOrder(null)

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Order not found')
        return
      }

      setOrder(result)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIndex = (status: string) => {
    const index = statusSteps.findIndex((s) => s.key === status)
    return index === -1 ? 0 : index
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-(--color-text-muted) hover:text-(--brand-primary) mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to store
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-(--brand-primary) rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-(--shadow-green)">
          <Search className="h-8 w-8 text-(--color-text-inverse)" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Track Your Order</h1>
        <p className="text-(--color-text-muted)">
          Enter your order number and email to see your order status
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8 shadow-(--shadow-lg)">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber" className="font-medium">
                  Order Number
                </Label>
                <Input
                  id="orderNumber"
                  placeholder="FM-XXXXXX"
                  className="h-11"
                  {...register('orderNumber')}
                />
                {errors.orderNumber && (
                  <p className="text-sm text-(--color-error)">{errors.orderNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-(--color-error)">{errors.email.message}</p>
                )}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Track Order
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-8 border-(--color-error) bg-(--color-error-bg)">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-(--color-error-bg) rounded-full flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5 text-(--color-error)" />
              </div>
              <div>
                <h3 className="font-semibold text-(--color-error) mb-1">Order Not Found</h3>
                <p className="text-sm text-(--color-error)">{error}</p>
                <p className="text-xs text-(--color-error) mt-2">
                  Please check your order number and email address, then try again.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details */}
      {order && (
        <div className="space-y-6">
          {/* Order Header */}
          <Card className="shadow-(--shadow-sm)">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-(--color-text-muted)">Order Number</p>
                  <p className="text-2xl font-bold text-foreground">{order.order_number}</p>
                </div>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium ${
                    statusColors[order.status]?.bg || 'bg-(--color-elevated)'
                  } ${statusColors[order.status]?.text || 'text-(--color-text-secondary)'} ${
                    statusColors[order.status]?.border || 'border-(--color-border)'
                  } border`}
                >
                  {order.status === 'delivered' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : order.status === 'cancelled' ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Progress Tracker */}
          {order.status !== 'cancelled' && (
            <Card className="shadow-(--shadow-sm)">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-(--brand-primary)" />
                  Delivery Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Progress bar */}
                  <div className="absolute top-4 left-4 right-4 h-1 bg-(--color-elevated) rounded-full">
                    <div
                      className="h-full bg-(--brand-primary) rounded-full transition-all duration-500"
                      style={{
                        width: `${(getStatusIndex(order.status) / (statusSteps.length - 1)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="relative flex justify-between">
                    {statusSteps.map((step, index) => {
                      const isCompleted = getStatusIndex(order.status) >= index
                      const isCurrent = getStatusIndex(order.status) === index
                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? 'bg-(--brand-primary) text-(--color-text-inverse)'
                                : 'bg-(--color-elevated) text-(--color-text-disabled)'
                            } ${isCurrent ? 'ring-4 ring-(--brand-primary-light)' : ''}`}
                          >
                            <step.icon className="h-4 w-4" />
                          </div>
                          <p
                            className={`mt-2 text-xs font-medium text-center ${
                              isCompleted ? 'text-(--brand-primary)' : 'text-(--color-text-disabled)'
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-8 space-y-3">
                  {order.delivered_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-(--color-success)" />
                      <span className="text-(--color-text-secondary)">Delivered:</span>
                      <span className="font-medium">{formatDate(order.delivered_at)}</span>
                    </div>
                  )}
                  {order.shipped_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <Truck className="h-4 w-4 text-(--brand-amber)" />
                      <span className="text-(--color-text-secondary)">Shipped:</span>
                      <span className="font-medium">{formatDate(order.shipped_at)}</span>
                    </div>
                  )}
                  {order.confirmed_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-(--color-info)" />
                      <span className="text-(--color-text-secondary)">Confirmed:</span>
                      <span className="font-medium">{formatDate(order.confirmed_at)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-(--color-text-disabled)" />
                    <span className="text-(--color-text-secondary)">Ordered:</span>
                    <span className="font-medium">{formatDate(order.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Address */}
          <Card className="shadow-(--shadow-sm)">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-(--color-info)" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{order.customer_name}</p>
              <p className="text-(--color-text-secondary)">{order.delivery_address_line_1}</p>
              {order.delivery_address_line_2 && (
                <p className="text-(--color-text-secondary)">{order.delivery_address_line_2}</p>
              )}
              <p className="text-(--color-text-secondary)">
                {order.delivery_city}, {order.delivery_postcode}
              </p>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="shadow-(--shadow-sm)">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="h-5 w-5 text-(--color-info)" />
                Order Items ({order.order_items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-(--color-elevated) shrink-0">
                      {item.product_image_url ? (
                        <Image
                          src={item.product_image_url}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-(--color-text-disabled)">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.product_name}</p>
                      <p className="text-sm text-(--color-text-muted)">
                        {formatPrice(item.unit_price_pence)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-foreground">
                      {formatPrice(item.total_price_pence)}
                    </p>
                  </li>
                ))}
              </ul>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-(--color-text-secondary)">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal_pence)}</span>
                </div>
                <div className="flex justify-between text-(--color-text-secondary)">
                  <span>Delivery</span>
                  <span>
                    {order.delivery_fee_pence === 0 ? (
                      <span className="text-(--color-success)">Free</span>
                    ) : (
                      formatPrice(order.delivery_fee_pence)
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-(--brand-primary)">{formatPrice(order.total_pence)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="shadow-(--shadow-sm) bg-background border-(--color-border)">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-(--color-text-muted) mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Need Help?</h3>
                  <p className="text-sm text-(--color-text-secondary)">
                    If you have any questions about your order, please contact our customer
                    support team at{' '}
                    <a
                      href="mailto:support@ukgrocerystore.com"
                      className="text-(--brand-primary) hover:underline"
                    >
                      support@ukgrocerystore.com
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No order searched yet */}
      {!order && !error && !isLoading && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-(--color-text-disabled) mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Enter your order details</h3>
          <p className="text-(--color-text-muted)">
            Use the form above to track your order status and delivery progress
          </p>
        </div>
      )}
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Suspense
          fallback={
            <div className="max-w-3xl mx-auto text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-(--brand-primary) mx-auto" />
            </div>
          }
        >
          <TrackOrderContent />
        </Suspense>
      </div>
    </div>
  )
}
