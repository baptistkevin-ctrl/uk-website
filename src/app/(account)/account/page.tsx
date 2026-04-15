import Link from 'next/link'
import Image from 'next/image'
import {
  Package, MapPin, Settings, ArrowRight, Heart, Gift, CreditCard,
  Shield, Truck, Clock, CheckCircle, Star, ShoppingBag, RotateCcw,
  Bell, Users, TrendingUp, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Account',
}

const ORDER_STEPS = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered']
const STEP_LABELS = ['Ordered', 'Confirmed', 'Preparing', 'On the way', 'Delivered']

function getStepIndex(status: string): number {
  const idx = ORDER_STEPS.indexOf(status)
  return idx >= 0 ? idx : 0
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'warning'
    case 'confirmed':
    case 'processing': return 'info'
    case 'out_for_delivery': return 'info'
    case 'delivered': return 'success'
    case 'cancelled': return 'destructive'
    default: return 'secondary'
  }
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Parallel data fetching
  const [profileResult, ordersResult, addressResult, wishlistResult, loyaltyResult, recentlyViewedResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('orders').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('addresses').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('wishlists').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('loyalty_accounts').select('current_points, lifetime_points').eq('user_id', user!.id).single(),
    supabase.from('recently_viewed').select('product_id, viewed_at, products(id, name, slug, image_url, price_pence)').eq('user_id', user!.id).order('viewed_at', { ascending: false }).limit(6),
  ])

  const profile = profileResult.data
  const allOrders = ordersResult.data || []
  const addressCount = addressResult.count || 0
  const wishlistCount = wishlistResult.count || 0
  const loyalty = loyaltyResult.data
  const recentlyViewed = recentlyViewedResult.data || []

  // Active orders (not delivered or cancelled)
  const activeOrders = allOrders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const deliveredOrders = allOrders.filter(o => o.status === 'delivered')
  const totalOrders = allOrders.length

  // Buy again: get products from delivered orders
  let buyAgainProducts: { id: string; name: string; slug: string; image_url: string | null; price_pence: number }[] = []
  if (deliveredOrders.length > 0) {
    const deliveredIds = deliveredOrders.map(o => o.id)
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, product_name, products(id, name, slug, image_url, price_pence)')
      .in('order_id', deliveredIds)
      .limit(20)

    if (orderItems) {
      const seen = new Set<string>()
      for (const item of orderItems) {
        const product = item.products as unknown as { id: string; name: string; slug: string; image_url: string | null; price_pence: number } | null
        if (product && !seen.has(product.id)) {
          seen.add(product.id)
          buyAgainProducts.push(product)
        }
        if (buyAgainProducts.length >= 6) break
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-(--color-text-muted) mt-1">{user?.email}</p>
        </div>
        {loyalty && (
          <Link href="/account/rewards" className="flex items-center gap-2 px-4 py-2 bg-(--brand-amber)/10 rounded-xl hover:bg-(--brand-amber)/20 transition-colors">
            <Star className="h-5 w-5 text-(--brand-amber)" />
            <div className="text-right">
              <p className="font-bold text-foreground text-sm">{loyalty.current_points?.toLocaleString() || 0}</p>
              <p className="text-xs text-(--color-text-muted)">Points</p>
            </div>
          </Link>
        )}
      </div>

      {/* Active Orders - Amazon-style tracking */}
      {activeOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Truck className="h-5 w-5 text-(--brand-primary)" />
            Active Orders
          </h2>
          <div className="space-y-3">
            {activeOrders.map((order) => {
              const stepIdx = getStepIndex(order.status)
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block rounded-xl border border-(--color-border) bg-(--color-surface) p-5 hover:border-(--brand-primary) transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">Order #{order.order_number}</p>
                      <p className="text-xs text-(--color-text-muted) mt-0.5">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-semibold text-foreground">{formatPrice(order.total_pence)}</p>
                      <ChevronRight className="h-4 w-4 text-(--color-text-muted)" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-1">
                    {STEP_LABELS.map((label, i) => (
                      <div key={i} className="flex-1">
                        <div className={`h-1.5 rounded-full ${i <= stepIdx ? 'bg-(--brand-primary)' : 'bg-(--color-border)'}`} />
                        <p className={`text-[10px] mt-1 text-center ${i <= stepIdx ? 'text-(--brand-primary) font-medium' : 'text-(--color-text-disabled)'}`}>
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/account/orders', icon: Package, label: 'Orders', count: totalOrders, color: 'bg-(--brand-primary-light) text-(--brand-primary)' },
            { href: '/account/addresses', icon: MapPin, label: 'Addresses', count: addressCount, color: 'bg-(--color-info-bg) text-(--color-info)' },
            { href: '/account/wishlist', icon: Heart, label: 'Wishlist', count: wishlistCount, color: 'bg-(--color-error)/10 text-(--color-error)' },
            { href: '/account/rewards', icon: Gift, label: 'Rewards', count: loyalty?.current_points || 0, suffix: 'pts', color: 'bg-(--brand-amber)/10 text-(--brand-amber)' },
            { href: '/account/returns', icon: RotateCcw, label: 'Returns', color: 'bg-(--color-warning-bg) text-(--color-warning)' },
            { href: '/account/referrals', icon: Users, label: 'Referrals', color: 'bg-(--color-success-bg) text-(--color-success)' },
            { href: '/account/spending', icon: TrendingUp, label: 'Spending', color: 'bg-(--brand-primary-light) text-(--brand-primary)' },
            { href: '/account/settings', icon: Settings, label: 'Settings', color: 'bg-(--color-elevated) text-(--color-text-secondary)' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 hover:border-(--brand-primary) hover:shadow-sm transition-all"
            >
              <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                <action.icon className="h-5 w-5" />
              </div>
              <p className="font-medium text-foreground text-sm">{action.label}</p>
              {action.count !== undefined && (
                <p className="text-xs text-(--color-text-muted) mt-0.5">{action.count.toLocaleString()}{action.suffix ? ` ${action.suffix}` : ''}</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Buy Again */}
      {buyAgainProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-(--brand-primary)" />
              Buy Again
            </h2>
            <Link href="/account/orders" className="text-sm text-(--brand-primary) hover:underline flex items-center gap-1">
              View order history <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {buyAgainProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3 hover:border-(--brand-primary) hover:shadow-sm transition-all text-center"
              >
                <div className="aspect-square rounded-lg bg-(--color-elevated) overflow-hidden mb-2 relative">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-(--color-text-disabled)" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-2">{product.name}</p>
                <p className="text-xs font-bold text-(--brand-primary) mt-1">{formatPrice(product.price_pence)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-(--color-text-muted)" />
            Recently Viewed
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {recentlyViewed.map((item, i) => {
              const product = item.products as unknown as { id: string; name: string; slug: string; image_url: string | null; price_pence: number } | null
              if (!product) return null
              return (
                <Link
                  key={i}
                  href={`/products/${product.slug}`}
                  className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3 hover:border-(--brand-primary) hover:shadow-sm transition-all text-center"
                >
                  <div className="aspect-square rounded-lg bg-(--color-elevated) overflow-hidden mb-2 relative">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-(--color-text-disabled)" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground line-clamp-2">{product.name}</p>
                  <p className="text-xs font-bold text-(--brand-primary) mt-1">{formatPrice(product.price_pence)}</p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border)">
          <h2 className="text-lg font-semibold text-foreground">Order History</h2>
          <Link href="/account/orders" className="text-sm text-(--brand-primary) hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {allOrders.length > 0 ? (
          <div className="divide-y divide-(--color-border)">
            {allOrders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-background transition-colors"
              >
                <div>
                  <p className="font-mono text-sm font-medium text-foreground">#{order.order_number}</p>
                  <p className="text-xs text-(--color-text-muted) mt-0.5">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-mono font-semibold text-foreground text-sm">{formatPrice(order.total_pence)}</p>
                  <Badge variant={getStatusColor(order.status) as 'default'}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-5">
            <Package className="h-10 w-10 mx-auto mb-3 text-(--color-text-disabled)" />
            <p className="text-sm font-medium text-(--color-text-secondary)">No orders yet</p>
            <p className="text-xs text-(--color-text-muted) mt-1 mb-4">Start shopping to see your orders here</p>
            <Link href="/">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Account Security Reminder */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-(--color-success-bg) flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-(--color-success)" />
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">Account Security</p>
            <p className="text-xs text-(--color-text-muted)">Keep your account safe with a strong password</p>
          </div>
        </div>
        <Link href="/account/security">
          <Button variant="outline" size="sm">
            Review <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
