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
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  processing: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  shipped: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
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
        className="inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to store
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
          <Search className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-500">
          Enter your order number and email to see your order status
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8 shadow-lg">
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
                  <p className="text-sm text-red-500">{errors.orderNumber.message}</p>
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
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
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
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Order Not Found</h3>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-2">
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
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="text-2xl font-bold text-gray-900">{order.order_number}</p>
                </div>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    statusColors[order.status]?.bg || 'bg-gray-100'
                  } ${statusColors[order.status]?.text || 'text-gray-700'} ${
                    statusColors[order.status]?.border || 'border-gray-200'
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
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-emerald-600" />
                  Delivery Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Progress bar */}
                  <div className="absolute top-4 left-4 right-4 h-1 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
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
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-200 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                          >
                            <step.icon className="h-4 w-4" />
                          </div>
                          <p
                            className={`mt-2 text-xs font-medium text-center ${
                              isCompleted ? 'text-emerald-600' : 'text-gray-400'
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
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <span className="text-gray-600">Delivered:</span>
                      <span className="font-medium">{formatDate(order.delivered_at)}</span>
                    </div>
                  )}
                  {order.shipped_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <Truck className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-600">Shipped:</span>
                      <span className="font-medium">{formatDate(order.shipped_at)}</span>
                    </div>
                  )}
                  {order.confirmed_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-600">Confirmed:</span>
                      <span className="font-medium">{formatDate(order.confirmed_at)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Ordered:</span>
                    <span className="font-medium">{formatDate(order.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Address */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-gray-900">{order.customer_name}</p>
              <p className="text-gray-600">{order.delivery_address_line_1}</p>
              {order.delivery_address_line_2 && (
                <p className="text-gray-600">{order.delivery_address_line_2}</p>
              )}
              <p className="text-gray-600">
                {order.delivery_city}, {order.delivery_postcode}
              </p>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingBag className="h-5 w-5 text-purple-600" />
                Order Items ({order.order_items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {item.product_image_url ? (
                        <Image
                          src={item.product_image_url}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.unit_price_pence)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.total_price_pence)}
                    </p>
                  </li>
                ))}
              </ul>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal_pence)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>
                    {order.delivery_fee_pence === 0 ? (
                      <span className="text-emerald-600">Free</span>
                    ) : (
                      formatPrice(order.delivery_fee_pence)
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-emerald-600">{formatPrice(order.total_pence)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="shadow-sm bg-slate-50 border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-slate-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Need Help?</h3>
                  <p className="text-sm text-gray-600">
                    If you have any questions about your order, please contact our customer
                    support team at{' '}
                    <a
                      href="mailto:support@freshmart.co.uk"
                      className="text-emerald-600 hover:underline"
                    >
                      support@freshmart.co.uk
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
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Enter your order details</h3>
          <p className="text-gray-500">
            Use the form above to track your order status and delivery progress
          </p>
        </div>
      )}
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <Suspense
          fallback={
            <div className="max-w-3xl mx-auto text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
            </div>
          }
        >
          <TrackOrderContent />
        </Suspense>
      </div>
    </div>
  )
}
