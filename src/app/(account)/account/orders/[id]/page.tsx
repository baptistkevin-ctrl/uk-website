import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Package, MapPin, CreditCard, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPrice, formatDate } from '@/lib/utils/format'

export const metadata = {
  title: 'Order Details',
}

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch order with items
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!order) {
    notFound()
  }

  // Fetch order items with product details
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      *,
      product:products(name, slug, image_url)
    `)
    .eq('order_id', order.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary'
      case 'confirmed':
      case 'processing':
        return 'info'
      case 'ready_for_delivery':
      case 'out_for_delivery':
        return 'warning'
      case 'delivered':
        return 'success'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'confirmed', 'processing', 'ready_for_delivery', 'out_for_delivery', 'delivered']
    return steps.indexOf(status)
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'ready_for_delivery', label: 'Ready' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ]

  const currentStep = getStatusStep(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/account/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
          <p className="text-gray-500">Placed on {formatDate(order.created_at)}</p>
        </div>
      </div>

      {/* Order Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Status
            </span>
            <Badge variant={getStatusColor(order.status) as 'default'}>
              {order.status.replace(/_/g, ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCancelled ? (
            <div className="text-center py-4">
              <p className="text-red-600 font-medium">This order has been cancelled</p>
            </div>
          ) : (
            <div className="relative">
              {/* Progress bar */}
              <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded">
                <div
                  className="h-full bg-green-600 rounded transition-all"
                  style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index <= currentStep
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <p
                      className={`text-xs mt-2 text-center ${
                        index <= currentStep ? 'text-green-600 font-medium' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems?.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.product?.slug}`}
                        className="font-medium text-gray-900 hover:text-green-700"
                      >
                        {item.product?.name || item.product_name}
                      </Link>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.unit_price_pence * item.quantity)}</p>
                      <p className="text-sm text-gray-500">{formatPrice(item.unit_price_pence)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.delivery_date && (
                <div>
                  <p className="text-sm text-gray-500">Delivery Date</p>
                  <p className="font-medium">{formatDate(order.delivery_date)}</p>
                  {order.delivery_slot && (
                    <p className="text-sm text-gray-600">{order.delivery_slot}</p>
                  )}
                </div>
              )}
              <Separator />
              <div>
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="font-medium">{order.delivery_address_line_1}</p>
                {order.delivery_address_line_2 && (
                  <p className="text-gray-600">{order.delivery_address_line_2}</p>
                )}
                <p className="text-gray-600">{order.delivery_city}</p>
                <p className="text-gray-600">{order.delivery_postcode}</p>
              </div>
              {order.delivery_instructions && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">Delivery Instructions</p>
                    <p className="text-gray-600">{order.delivery_instructions}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(order.subtotal_pence)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span>
                    {order.delivery_fee_pence === 0
                      ? 'FREE'
                      : formatPrice(order.delivery_fee_pence)}
                  </span>
                </div>
                {order.discount_pence > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount_pence)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(order.total_pence)}</span>
                </div>
                <p className="text-xs text-gray-500 text-right">
                  {order.payment_status === 'paid' ? 'Paid via card' : 'Payment pending'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 mb-4">Need help with this order?</p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
