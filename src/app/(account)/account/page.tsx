import Link from 'next/link'
import { Package, MapPin, Settings, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Account',
}

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Fetch recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Fetch address count
  const { count: addressCount } = await supabase
    .from('addresses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'confirmed':
      case 'processing':
        return 'info'
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
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Welcome back, {profile?.full_name || 'there'}!
        </h1>
        <p className="text-(--color-text-muted) mt-1">{user?.email}</p>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/account/orders">
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--brand-primary) cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-(--brand-primary-light) flex items-center justify-center">
                <Package className="h-5 w-5 text-(--brand-primary)" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {recentOrders?.length ?? 0}
                </p>
                <p className="text-sm text-(--color-text-muted)">Orders</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/account/addresses">
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--brand-primary) cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-(--brand-primary-light) flex items-center justify-center">
                <MapPin className="h-5 w-5 text-(--brand-primary)" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {addressCount || 0}
                </p>
                <p className="text-sm text-(--color-text-muted)">Addresses</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/account/settings">
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--brand-primary) cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-(--brand-primary-light) flex items-center justify-center">
                <Settings className="h-5 w-5 text-(--brand-primary)" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  Manage
                </p>
                <p className="text-sm text-(--color-text-muted)">Settings</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="text-sm text-(--brand-primary) hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentOrders && recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="rounded-lg border border-(--color-border) p-4 flex items-center justify-between hover:border-(--brand-primary) transition-colors"
              >
                <div>
                  <p className="font-mono text-sm font-medium text-foreground">
                    {order.order_number}
                  </p>
                  <p className="text-xs text-(--color-text-muted) mt-0.5">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-mono font-semibold text-foreground">
                    {formatPrice(order.total_pence)}
                  </p>
                  <Badge variant={getStatusColor(order.status) as 'default'}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-(--color-text-muted) mb-4">
              You haven&apos;t placed any orders yet.
            </p>
            <Link href="/products">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
