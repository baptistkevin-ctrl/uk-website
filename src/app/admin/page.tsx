import Link from 'next/link'
import { Package, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils/format'

export const metadata = {
  title: 'Admin Dashboard',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch statistics
  const [
    { count: totalProducts },
    { count: totalOrders },
    { data: recentOrders },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('products')
      .select('*')
      .eq('track_inventory', true)
      .lte('stock_quantity', 10)
      .gt('stock_quantity', 0)
      .limit(5),
  ])

  // Calculate revenue (simplified - would need date filtering in production)
  const { data: paidOrders } = await supabase
    .from('orders')
    .select('total_pence')
    .eq('payment_status', 'paid')

  const totalRevenue = paidOrders?.reduce((sum, order) => sum + order.total_pence, 0) || 0

  const stats = [
    {
      title: 'Total Revenue',
      value: formatPrice(totalRevenue),
      change: '+12%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
    {
      title: 'Total Orders',
      value: totalOrders?.toString() || '0',
      change: '+8%',
      changeType: 'positive' as const,
      icon: ShoppingCart,
    },
    {
      title: 'Total Products',
      value: totalProducts?.toString() || '0',
      change: '+3',
      changeType: 'positive' as const,
      icon: Package,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'info'
      case 'processing':
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/products/new">Add Product</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm ${
                        stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-400">vs last month</span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <stat.icon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-gray-500">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total_pence)}</p>
                      <Badge variant={getStatusColor(order.status) as 'default'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No orders yet</p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low Stock Alert</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/products">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</p>
                    </div>
                    <Badge variant="warning">{product.stock_quantity} left</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">All products are well stocked</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
