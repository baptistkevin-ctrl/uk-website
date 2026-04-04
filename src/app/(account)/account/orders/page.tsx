import Link from 'next/link'
import { Package, ArrowRight, Store, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils/format'
import { OrderChatButton } from '@/components/chat/order-chat-button'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Orders',
}

export default async function OrdersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  // Fetch order items with vendor info for all orders
  const orderIds = orders?.map((o) => o.id) || []
  const { data: allOrderItems } = orderIds.length > 0
    ? await supabase
        .from('order_items')
        .select('order_id, product:products(vendor_id, vendor:vendors(id, business_name, logo_url))')
        .in('order_id', orderIds)
    : { data: [] }

  // Build a map: orderId → unique vendors
  const orderVendorsMap = new Map<string, { id: string; business_name: string; logo_url: string | null }[]>()
  allOrderItems?.forEach((item: Record<string, unknown>) => {
    const product = item.product as Record<string, unknown> | null
    const vendorRaw = product?.vendor
    // Supabase may return nested FK as object or array
    const vendor = Array.isArray(vendorRaw) ? vendorRaw[0] : vendorRaw
    if (!vendor?.id) return
    const orderId = item.order_id as string
    if (!orderVendorsMap.has(orderId)) {
      orderVendorsMap.set(orderId, [])
    }
    const vendors = orderVendorsMap.get(orderId)!
    if (!vendors.some((v) => v.id === vendor.id)) {
      vendors.push({ id: vendor.id, business_name: vendor.business_name, logo_url: vendor.logo_url })
    }
  })

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">View and track your orders</p>
      </div>

      {orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const vendors = orderVendorsMap.get(order.id) || []
            return (
              <Card key={order.id} className="overflow-hidden">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border">
                      <Package className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{order.order_number}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(order.status) as 'default'}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-base font-bold">{formatPrice(order.total_pence)}</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/account/orders/${order.id}`}>
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Vendor Stores — AliExpress style contact per seller */}
                {vendors.length > 0 && (
                  <CardContent className="p-0 divide-y">
                    {vendors.map((vendor) => (
                      <div key={vendor.id} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {vendor.logo_url ? (
                            <img
                              src={vendor.logo_url}
                              alt={vendor.business_name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center ring-1 ring-emerald-200">
                              <Store className="h-4 w-4 text-emerald-600" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {vendor.business_name}
                          </span>
                        </div>
                        <OrderChatButton
                          vendorId={vendor.id}
                          vendorName={vendor.business_name}
                          orderId={order.id}
                          orderNumber={order.order_number}
                        />
                      </div>
                    ))}
                  </CardContent>
                )}

                {/* Delivery info */}
                {order.delivery_date && (
                  <div className="px-5 py-2 bg-gray-50 border-t text-xs text-gray-500">
                    Delivery: {formatDate(order.delivery_date)}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">
              When you place an order, it will appear here.
            </p>
            <Button asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
