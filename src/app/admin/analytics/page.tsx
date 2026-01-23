'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  PoundSterling
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  revenueGrowth: number
  ordersGrowth: number
  avgOrderValue: number
  recentOrders: Array<{
    date: string
    total: number
    count: number
  }>
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  ordersByStatus: Record<string, number>
  revenueByDay: Array<{
    date: string
    revenue: number
  }>
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    avgOrderValue: 0,
    recentOrders: [],
    topProducts: [],
    ordersByStatus: {},
    revenueByDay: [],
  })
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch orders
      const ordersRes = await fetch('/api/admin/orders?limit=1000')
      const ordersData = await ordersRes.json()
      const orders = ordersData.orders || []

      // Fetch products
      const productsRes = await fetch('/api/products?includeInactive=true')
      const products = await productsRes.json()

      // Calculate date ranges
      const now = new Date()
      const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      const prevStartDate = new Date(startDate.getTime() - daysAgo * 24 * 60 * 60 * 1000)

      // Filter orders by period
      const currentOrders = orders.filter((o: { created_at: string }) => new Date(o.created_at) >= startDate)
      const previousOrders = orders.filter(
        (o: { created_at: string }) => new Date(o.created_at) >= prevStartDate && new Date(o.created_at) < startDate
      )

      // Calculate totals
      const totalRevenue = currentOrders
        .filter((o: { payment_status: string }) => o.payment_status === 'paid')
        .reduce((sum: number, o: { total_pence: number }) => sum + o.total_pence, 0)

      const prevRevenue = previousOrders
        .filter((o: { payment_status: string }) => o.payment_status === 'paid')
        .reduce((sum: number, o: { total_pence: number }) => sum + o.total_pence, 0)

      const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
      const ordersGrowth = previousOrders.length > 0
        ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
        : 0

      // Group orders by status
      const ordersByStatus = currentOrders.reduce((acc: Record<string, number>, order: { status: string }) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {})

      // Group revenue by day
      const revenueByDay: Array<{ date: string; revenue: number }> = []
      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const dayRevenue = currentOrders
          .filter((o: { created_at: string; payment_status: string }) =>
            o.created_at.startsWith(dateStr) && o.payment_status === 'paid'
          )
          .reduce((sum: number, o: { total_pence: number }) => sum + o.total_pence, 0)
        revenueByDay.push({ date: dateStr, revenue: dayRevenue })
      }

      // Get unique customers
      const uniqueCustomers = new Set(orders.map((o: { customer_email: string }) => o.customer_email)).size

      setData({
        totalRevenue,
        totalOrders: currentOrders.length,
        totalProducts: products.length || 0,
        totalCustomers: uniqueCustomers,
        revenueGrowth,
        ordersGrowth,
        avgOrderValue: currentOrders.length > 0 ? totalRevenue / currentOrders.length : 0,
        recentOrders: [],
        topProducts: [],
        ordersByStatus,
        revenueByDay,
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`
  const formatLargePrice = (pence: number) => {
    const pounds = pence / 100
    if (pounds >= 1000000) return `£${(pounds / 1000000).toFixed(1)}M`
    if (pounds >= 1000) return `£${(pounds / 1000).toFixed(1)}K`
    return `£${pounds.toFixed(2)}`
  }

  const maxRevenue = Math.max(...data.revenueByDay.map(d => d.revenue), 1)

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-200',
    confirmed: 'bg-blue-200',
    processing: 'bg-yellow-200',
    ready_for_delivery: 'bg-purple-200',
    out_for_delivery: 'bg-orange-200',
    delivered: 'bg-emerald-200',
    cancelled: 'bg-red-200',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-emerald-600" />
            Analytics
          </h1>
          <p className="text-gray-500 mt-1">Track your store performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p === '7d' ? 'Week' : p === '30d' ? 'Month' : 'Quarter'}
              </button>
            ))}
          </div>
          <Button onClick={fetchAnalytics} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <PoundSterling className="h-6 w-6 text-emerald-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  data.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {data.revenueGrowth >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(data.revenueGrowth).toFixed(1)}%
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatLargePrice(data.totalRevenue)}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  data.ordersGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {data.ordersGrowth >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(data.ordersGrowth).toFixed(1)}%
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{data.totalOrders}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900">{formatPrice(data.avgOrderValue)}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{data.totalCustomers}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h2>
              <div className="h-64 flex items-end gap-1">
                {data.revenueByDay.slice(-30).map((day, index) => {
                  const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                  const date = new Date(day.date)
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6

                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center group relative"
                    >
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                        <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                          {formatPrice(day.revenue)}
                          <br />
                          {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <div
                        className={`w-full rounded-t transition-all ${
                          isWeekend ? 'bg-emerald-200' : 'bg-emerald-500'
                        } hover:opacity-80`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-4 text-xs text-gray-500">
                <span>{period === '7d' ? '7 days ago' : period === '30d' ? '30 days ago' : '90 days ago'}</span>
                <span>Today</span>
              </div>
            </div>

            {/* Orders by Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h2>
              <div className="space-y-4">
                {Object.entries(data.ordersByStatus).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No orders in this period</p>
                ) : (
                  Object.entries(data.ordersByStatus).map(([status, count]) => {
                    const total = Object.values(data.ordersByStatus).reduce((a, b) => a + b, 0)
                    const percentage = total > 0 ? (count / total) * 100 : 0

                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm text-gray-500">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${statusColors[status] || 'bg-gray-300'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Products</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Products</span>
                  <span className="font-medium">{data.totalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Products</span>
                  <span className="font-medium text-emerald-600">—</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Out of Stock</span>
                  <span className="font-medium text-red-600">—</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Period Summary</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Orders</span>
                  <span className="font-medium">{data.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Revenue</span>
                  <span className="font-medium text-emerald-600">{formatLargePrice(data.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Daily Revenue</span>
                  <span className="font-medium">
                    {formatPrice(data.totalRevenue / (period === '7d' ? 7 : period === '30d' ? 30 : 90))}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Performance</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Revenue Growth</span>
                  <span className={`font-medium ${data.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {data.revenueGrowth >= 0 ? '+' : ''}{data.revenueGrowth.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Orders Growth</span>
                  <span className={`font-medium ${data.ordersGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {data.ordersGrowth >= 0 ? '+' : ''}{data.ordersGrowth.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Conversion Rate</span>
                  <span className="font-medium">—</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
