'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingCart,
  Package,
  DollarSign,
  Loader2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  averageOrderValue: number
  revenueChange: number
  ordersChange: number
  topProducts: {
    id: string
    name: string
    image_url: string | null
    sold: number
    revenue: number
  }[]
  recentSales: {
    date: string
    amount: number
    orders: number
  }[]
}

function getDaysForPeriod(period: string): number {
  switch (period) {
    case '30days': return 30
    case '90days': return 90
    default: return 7
  }
}

export default function VendorAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7days')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const days = getDaysForPeriod(period)

      // Fetch stats
      const statsRes = await fetch('/api/vendor/stats')
      const stats = await statsRes.json()

      // Fetch enough orders for the selected period
      const ordersRes = await fetch(`/api/vendor/orders?limit=500`)
      const ordersData = await ordersRes.json()
      const allOrders = ordersData.orders || []

      // Build date range for selected period
      const now = new Date()
      const periodStart = new Date()
      periodStart.setDate(now.getDate() - days)
      periodStart.setHours(0, 0, 0, 0)

      // Previous period for comparison
      const prevPeriodStart = new Date()
      prevPeriodStart.setDate(periodStart.getDate() - days)
      prevPeriodStart.setHours(0, 0, 0, 0)

      // Split orders into current and previous periods
      const currentOrders = allOrders.filter((o: any) => {
        const d = new Date(o.created_at)
        return d >= periodStart && d <= now
      })
      const previousOrders = allOrders.filter((o: any) => {
        const d = new Date(o.created_at)
        return d >= prevPeriodStart && d < periodStart
      })

      // Current period stats
      const totalRevenue = currentOrders.reduce((sum: number, o: any) => sum + (o.vendor_amount || 0), 0)
      const totalOrders = currentOrders.length
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Previous period stats for % change
      const prevRevenue = previousOrders.reduce((sum: number, o: any) => sum + (o.vendor_amount || 0), 0)
      const prevOrders = previousOrders.length

      const revenueChange = prevRevenue > 0
        ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10
        : totalRevenue > 0 ? 100 : 0
      const ordersChange = prevOrders > 0
        ? Math.round(((totalOrders - prevOrders) / prevOrders) * 1000) / 10
        : totalOrders > 0 ? 100 : 0

      // Group orders by date for chart
      const salesByDate: Record<string, { amount: number; orders: number }> = {}
      const dateLabels = Array.from({ length: days }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      dateLabels.forEach(date => {
        salesByDate[date] = { amount: 0, orders: 0 }
      })

      currentOrders.forEach((order: any) => {
        const date = order.created_at?.split('T')[0]
        if (salesByDate[date]) {
          salesByDate[date].amount += order.vendor_amount || 0
          salesByDate[date].orders += 1
        }
      })

      const recentSales = Object.entries(salesByDate).map(([date, d]) => ({
        date,
        ...d
      }))

      // Build top products from order items
      const productSales: Record<string, { id: string; name: string; image_url: string | null; sold: number; revenue: number }> = {}
      currentOrders.forEach((order: any) => {
        (order.items || []).forEach((item: any) => {
          const pid = item.product_id || item.product?.id
          const pname = item.product?.name || item.product_name || 'Unknown'
          const pimg = item.product?.image_url || null
          if (!pid) return
          if (!productSales[pid]) {
            productSales[pid] = { id: pid, name: pname, image_url: pimg, sold: 0, revenue: 0 }
          }
          productSales[pid].sold += item.quantity || 1
          productSales[pid].revenue += item.total || item.price * (item.quantity || 1) || 0
        })
      })

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      setData({
        totalRevenue,
        totalOrders,
        totalProducts: stats.totalProducts || 0,
        averageOrderValue,
        revenueChange,
        ordersChange,
        topProducts,
        recentSales
      })
    } catch (error) {
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  const maxSale = Math.max(...(data?.recentSales.map(s => s.amount) || [1]))
  const maxOrders = Math.max(...(data?.recentSales.map(s => s.orders) || [1]))
  const days = getDaysForPeriod(period)

  // For 30/90 day charts, show fewer labels
  const labelInterval = days <= 7 ? 1 : days <= 30 ? 5 : 10

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-(--color-text-secondary)">Track your store performance</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
        >
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="90days">Last 90 days</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-(--brand-primary-light) rounded-lg">
              <DollarSign className="h-5 w-5 text-(--brand-primary)" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-medium ${
              (data?.revenueChange || 0) >= 0 ? 'text-(--brand-primary)' : 'text-(--color-error)'
            }`}>
              {(data?.revenueChange || 0) >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(data?.revenueChange || 0)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatPrice(data?.totalRevenue || 0)}</p>
          <p className="text-sm text-(--color-text-muted)">Total Revenue</p>
        </div>

        <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-(--color-info-bg) rounded-lg">
              <ShoppingCart className="h-5 w-5 text-(--color-info)" />
            </div>
            <span className={`flex items-center gap-1 text-sm font-medium ${
              (data?.ordersChange || 0) >= 0 ? 'text-(--brand-primary)' : 'text-(--color-error)'
            }`}>
              {(data?.ordersChange || 0) >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(data?.ordersChange || 0)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{data?.totalOrders || 0}</p>
          <p className="text-sm text-(--color-text-muted)">Total Orders</p>
        </div>

        <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-(--color-info-bg) rounded-lg">
              <Package className="h-5 w-5 text-(--color-info)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{data?.totalProducts || 0}</p>
          <p className="text-sm text-(--color-text-muted)">Active Products</p>
        </div>

        <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-(--color-warning-bg) rounded-lg">
              <BarChart3 className="h-5 w-5 text-(--brand-amber)" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatPrice(data?.averageOrderValue || 0)}</p>
          <p className="text-sm text-(--color-text-muted)">Avg. Order Value</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-foreground mb-6">Revenue Overview</h2>
          <div className="h-64 flex items-end gap-[2px]">
            {data?.recentSales.map((sale, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-(--brand-dark) text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                  {formatPrice(sale.amount)}
                </div>
                <div
                  className="w-full bg-linear-to-t from-(--brand-primary) to-(--brand-primary) rounded-t transition-all hover:from-(--brand-primary) hover:to-(--brand-primary)"
                  style={{
                    height: `${maxSale > 0 ? (sale.amount / maxSale) * 200 : 0}px`,
                    minHeight: sale.amount > 0 ? '4px' : '2px'
                  }}
                />
                {(i % labelInterval === 0 || i === (data?.recentSales.length || 0) - 1) ? (
                  <span className="text-[11px] text-(--color-text-muted) truncate max-w-full">
                    {days <= 7
                      ? new Date(sale.date).toLocaleDateString('en-GB', { weekday: 'short' })
                      : new Date(sale.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    }
                  </span>
                ) : (
                  <span className="text-[11px]">&nbsp;</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-foreground mb-6">Orders Overview</h2>
          <div className="h-64 flex items-end gap-[2px]">
            {data?.recentSales.map((sale, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-(--brand-dark) text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                  {sale.orders} order{sale.orders !== 1 ? 's' : ''}
                </div>
                <div
                  className="w-full bg-linear-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                  style={{
                    height: `${maxOrders > 0 ? (sale.orders / maxOrders) * 200 : 0}px`,
                    minHeight: sale.orders > 0 ? '4px' : '2px'
                  }}
                />
                {(i % labelInterval === 0 || i === (data?.recentSales.length || 0) - 1) ? (
                  <span className="text-[11px] text-(--color-text-muted) truncate max-w-full">
                    {days <= 7
                      ? new Date(sale.date).toLocaleDateString('en-GB', { weekday: 'short' })
                      : new Date(sale.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    }
                  </span>
                ) : (
                  <span className="text-[11px]">&nbsp;</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-(--color-surface) rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="font-semibold text-foreground">Top Performing Products</h2>
        </div>
        {data?.topProducts && data.topProducts.length > 0 ? (
          <div className="divide-y divide-(--color-border)">
            {data.topProducts.map((product, i) => (
              <div key={product.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 bg-(--color-elevated) rounded-full flex items-center justify-center text-sm font-medium text-(--color-text-secondary)">
                    {i + 1}
                  </span>
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-(--color-elevated) flex items-center justify-center">
                      <Package className="h-5 w-5 text-(--color-text-disabled)" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-(--color-text-muted)">{product.sold} sold</p>
                  </div>
                </div>
                <p className="font-semibold text-foreground">{formatPrice(product.revenue)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No sales data yet</h3>
            <p className="text-(--color-text-muted)">Top products will appear here once you start making sales</p>
          </div>
        )}
      </div>
    </div>
  )
}
