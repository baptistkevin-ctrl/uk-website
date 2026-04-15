import Link from 'next/link'
import { Package, ArrowRight, Store, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'confirmed':
      case 'processing':
        return 'info'
      case 'ready_for_delivery':
      case 'out_for_delivery':
        return 'warning'
      case 'dispatched':
        return 'organic'
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
      <h1 className="font-display text-2xl font-semibold text-foreground">
        My Orders
      </h1>

      {orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => {
            const vendors = orderVendorsMap.get(order.id) || []
            return (
              <div
                key={order.id}
                className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 lg:p-5 hover:border-(--color-border-strong) transition-colors duration-200"
                style={{ transitionTimingFunction: 'var(--ease-premium)' }}
              >
                {/* Top row: order number + status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-foreground">
                    {order.order_number}
                  </span>
                  <Badge variant={getStatusVariant(order.status) as 'default'}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {/* Middle: items + total */}
                <div className="mt-2 flex items-center justify-between text-sm text-(--color-text-secondary)">
                  <span>
                    {order.item_count ?? ''} {order.item_count === 1 ? 'item' : 'items'}
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatPrice(order.total_pence)}
                  </span>
                </div>

                {/* Vendor stores */}
                {vendors.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-(--color-border) pt-3">
                    {vendors.map((vendor) => (
                      <div key={vendor.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {vendor.logo_url ? (
                            <img
                              src={vendor.logo_url}
                              alt={vendor.business_name}
                              className="w-6 h-6 rounded-full object-cover ring-1 ring-(--color-border)"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-(--color-elevated) ring-1 ring-(--color-border)">
                              <Store className="h-3 w-3 text-(--color-text-muted)" />
                            </div>
                          )}
                          <span className="text-xs font-medium text-(--color-text-secondary) truncate">
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
                  </div>
                )}

                {/* Bottom: date + view details */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-(--color-text-muted)">
                    {formatDate(order.created_at)}
                    {order.delivery_date && (
                      <> &middot; Delivery: {formatDate(order.delivery_date)}</>
                    )}
                  </span>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="text-sm font-medium text-(--brand-primary) hover:underline inline-flex items-center gap-1"
                  >
                    View Details
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-(--color-border) bg-(--color-surface) py-16 px-6">
          <Package className="h-16 w-16 text-(--color-text-muted) mb-4" />
          <h2 className="font-display text-lg font-semibold text-foreground mb-1">
            No orders yet
          </h2>
          <p className="text-sm text-(--color-text-muted) mb-6 text-center max-w-xs">
            When you place an order, it will appear here.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-lg bg-(--brand-amber) px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Start Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
