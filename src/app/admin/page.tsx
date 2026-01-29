'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock,
  CheckCircle2,
  Truck,
  AlertTriangle,
  PoundSterling,
  Users,
  Plus,
  RefreshCw,
  Star,
  Store,
  Tag,
  Zap,
  Bell,
  AlertCircle,
  Info,
  XCircle,
  MessageSquare,
  UserPlus,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface DashboardData {
  overview: {
    totalRevenue: number
    thisMonthRevenue: number
    revenueChange: number
    totalOrders: number
    todayOrders: number
    thisMonthOrders: number
    averageOrderValue: number
  }
  orders: {
    byStatus: {
      pending: number
      processing: number
      shipped: number
      delivered: number
      cancelled: number
    }
    recent: Array<{
      id: string
      order_number: string
      customer_name: string
      customer_email: string
      total_pence: number
      status: string
      created_at: string
    }>
  }
  users: {
    total: number
    newToday: number
    newThisMonth: number
    recent: Array<{
      id: string
      full_name: string
      email: string
      created_at: string
    }>
  }
  products: {
    total: number
    active: number
    lowStock: number
    outOfStock: number
    pendingApproval: number
    topSelling: Array<{
      id: string
      name: string
      slug: string
      image_url: string | null
      quantity: number
    }>
  }
  vendors: {
    total: number
    pendingApplications: number
  }
  reviews: {
    total: number
    pending: number
    recent: Array<{
      id: string
      rating: number
      title: string
      status: string
      created_at: string
      profiles: { full_name: string; email: string } | null
      products: { name: string; slug: string } | null
    }>
  }
  marketing: {
    activeCoupons: number
    activeDeals: number
  }
  charts: {
    salesByDay: Array<{
      date: string
      day: string
      orders: number
      revenue: number
    }>
    salesByMonth: Array<{
      month: string
      orders: number
      revenue: number
    }>
  }
  alerts: Array<{
    type: 'warning' | 'error' | 'info'
    title: string
    message: string
    link: string
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartView, setChartView] = useState<'daily' | 'monthly'>('daily')

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) {
        if (res.status === 403) {
          setError('Access denied. Admin privileges required.')
        } else {
          throw new Error('Failed to fetch dashboard data')
        }
        return
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">{error}</h2>
          <button
            onClick={fetchDashboardData}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const getMaxChartValue = () => {
    if (!data) return 100
    if (chartView === 'daily') {
      return Math.max(...data.charts.salesByDay.map(d => d.revenue), 1)
    }
    return Math.max(...data.charts.salesByMonth.map(d => d.revenue), 1)
  }

  const statCards = data ? [
    {
      title: 'Total Revenue',
      value: formatPrice(data.overview.totalRevenue),
      change: `${data.overview.revenueChange >= 0 ? '+' : ''}${data.overview.revenueChange}%`,
      trend: data.overview.revenueChange >= 0 ? 'up' : 'down',
      subtext: `${formatPrice(data.overview.thisMonthRevenue)} this month`,
      icon: PoundSterling,
      gradient: 'from-emerald-500 to-teal-600',
      href: '/admin/orders',
    },
    {
      title: 'Total Orders',
      value: data.overview.totalOrders,
      change: `${data.overview.todayOrders} today`,
      trend: 'up',
      subtext: `${data.overview.thisMonthOrders} this month`,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-indigo-600',
      href: '/admin/orders',
    },
    {
      title: 'Avg Order Value',
      value: formatPrice(data.overview.averageOrderValue),
      change: 'Per order',
      trend: 'up',
      subtext: 'Based on paid orders',
      icon: TrendingUp,
      gradient: 'from-violet-500 to-purple-600',
      href: '/admin/orders',
    },
    {
      title: 'Total Users',
      value: data.users.total,
      change: `+${data.users.newToday} today`,
      trend: 'up',
      subtext: `${data.users.newThisMonth} this month`,
      icon: Users,
      gradient: 'from-pink-500 to-rose-600',
      href: '/admin/users',
    },
    {
      title: 'Products',
      value: data.products.total,
      change: `${data.products.active} active`,
      trend: data.products.lowStock > 0 ? 'down' : 'up',
      subtext: `${data.products.lowStock} low stock`,
      icon: Package,
      gradient: 'from-amber-500 to-orange-600',
      href: '/admin/products',
    },
    {
      title: 'Vendors',
      value: data.vendors.total,
      change: data.vendors.pendingApplications > 0 ? `${data.vendors.pendingApplications} pending` : 'All reviewed',
      trend: data.vendors.pendingApplications > 0 ? 'down' : 'up',
      subtext: 'Marketplace sellers',
      icon: Store,
      gradient: 'from-cyan-500 to-blue-600',
      href: '/admin/vendor-applications',
    },
    {
      title: 'Reviews',
      value: data.reviews.total,
      change: data.reviews.pending > 0 ? `${data.reviews.pending} pending` : 'All moderated',
      trend: data.reviews.pending > 5 ? 'down' : 'up',
      subtext: 'Product feedback',
      icon: Star,
      gradient: 'from-yellow-500 to-amber-600',
      href: '/admin/reviews',
    },
    {
      title: 'Marketing',
      value: data.marketing.activeCoupons + data.marketing.activeDeals,
      change: `${data.marketing.activeCoupons} coupons`,
      trend: 'up',
      subtext: `${data.marketing.activeDeals} active deals`,
      icon: Tag,
      gradient: 'from-green-500 to-emerald-600',
      href: '/admin/coupons',
    },
  ] : []

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Super Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Complete overview of your marketplace performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {data && data.alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.alerts.map((alert, index) => (
            <Link
              key={index}
              href={alert.link as any}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                alert.type === 'error'
                  ? 'bg-red-50 border-red-200 hover:bg-red-100'
                  : alert.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                alert.type === 'error'
                  ? 'bg-red-100 text-red-600'
                  : alert.type === 'warning'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {alert.type === 'error' ? (
                  <XCircle className="w-5 h-5" />
                ) : alert.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900">{alert.title}</h4>
                <p className="text-sm text-slate-600 truncate">{alert.message}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                <div className="w-20 h-6 bg-slate-200 rounded-full" />
              </div>
              <div className="w-24 h-10 bg-slate-200 rounded-lg mb-2" />
              <div className="w-32 h-4 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              href={stat.href as any}
              className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700`} />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      stat.trend === 'up'
                        ? 'text-emerald-700 bg-emerald-100'
                        : 'text-red-700 bg-red-100'
                    }`}
                  >
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">
                  {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                </h3>
                <p className="text-slate-500 font-medium">{stat.title}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.subtext}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Charts and Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Sales Overview</h2>
              <p className="text-slate-500 text-sm mt-0.5">Revenue performance</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setChartView('daily')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartView === 'daily'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setChartView('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartView === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 6 Months
              </button>
            </div>
          </div>

          {loading ? (
            <div className="h-72 flex items-end gap-4 px-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 bg-slate-200 rounded-xl animate-pulse" style={{ height: `${Math.random() * 200 + 50}px` }} />
              ))}
            </div>
          ) : data && (
            <div className="h-72 flex items-end gap-4 px-2">
              {(chartView === 'daily' ? data.charts.salesByDay : data.charts.salesByMonth).map((item, i) => {
                const maxValue = getMaxChartValue()
                const height = maxValue > 0 ? (item.revenue / maxValue) * 230 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="relative w-full">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-xl transition-all duration-500 group-hover:from-emerald-600 group-hover:to-emerald-500 relative min-h-[4px]"
                        style={{ height: `${Math.max(height, 4)}px` }}
                      >
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          <div className="font-semibold">{formatPrice(item.revenue)}</div>
                          <div className="text-slate-400">{item.orders} orders</div>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium group-hover:text-emerald-600 transition-colors">
                      {chartView === 'daily' ? (item as { day: string }).day : (item as { month: string }).month}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Order Status</h2>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-20 h-4 bg-slate-200 rounded" />
                    <div className="w-8 h-4 bg-slate-200 rounded" />
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : data && (
            <div className="space-y-4">
              {[
                { label: 'Pending', count: data.orders.byStatus.pending, color: 'amber' },
                { label: 'Processing', count: data.orders.byStatus.processing, color: 'blue' },
                { label: 'Shipped', count: data.orders.byStatus.shipped, color: 'indigo' },
                { label: 'Delivered', count: data.orders.byStatus.delivered, color: 'emerald' },
                { label: 'Cancelled', count: data.orders.byStatus.cancelled, color: 'red' },
              ].map((status) => {
                const total = Object.values(data.orders.byStatus).reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? (status.count / total) * 100 : 0
                return (
                  <div key={status.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600">{status.label}</span>
                      <span className="text-sm font-bold text-slate-900">{status.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          status.color === 'amber' ? 'bg-amber-500' :
                          status.color === 'blue' ? 'bg-blue-500' :
                          status.color === 'indigo' ? 'bg-indigo-500' :
                          status.color === 'emerald' ? 'bg-emerald-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <Link
            href="/admin/orders"
            className="flex items-center justify-center gap-2 mt-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            View All Orders
          </Link>
        </div>
      </div>

      {/* Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            </div>
            <Link href="/admin/orders" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-slate-200 rounded mb-1" />
                    <div className="w-32 h-3 bg-slate-100 rounded" />
                  </div>
                  <div className="w-16 h-4 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : data && data.orders.recent.length > 0 ? (
            <div className="space-y-4">
              {data.orders.recent.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    order.status === 'delivered' ? 'bg-emerald-500' :
                    order.status === 'shipped' ? 'bg-blue-500' :
                    order.status === 'processing' ? 'bg-amber-500' :
                    order.status === 'cancelled' ? 'bg-red-500' :
                    'bg-slate-500'
                  }`}>
                    #{order.order_number.slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate group-hover:text-emerald-600">
                      {order.customer_name || order.customer_email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(order.total_pence)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No orders yet</p>
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Recent Reviews</h2>
            </div>
            <Link href="/admin/reviews" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-16 h-4 bg-slate-200 rounded" />
                    <div className="w-12 h-4 bg-slate-100 rounded" />
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : data && data.reviews.recent.length > 0 ? (
            <div className="space-y-4">
              {data.reviews.recent.map((review) => (
                <Link
                  key={review.id}
                  href="/admin/reviews"
                  className="block p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      review.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {review.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-emerald-600">
                    {review.title || 'No title'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    on {review.products?.name || 'Unknown product'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No reviews yet</p>
            </div>
          )}
        </div>

        {/* New Users */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-pink-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">New Users</h2>
            </div>
            <Link href="/admin/users" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-slate-200 rounded mb-1" />
                    <div className="w-32 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : data && data.users.recent.length > 0 ? (
            <div className="space-y-4">
              {data.users.recent.map((user) => (
                <Link
                  key={user.id}
                  href="/admin/users"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {(user.full_name || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate group-hover:text-emerald-600">
                      {user.full_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(user.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No new users</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Selling Products and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Top Selling Products</h2>
                <p className="text-sm text-slate-500">Based on units sold</p>
              </div>
            </div>
            <Link href="/admin/products" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              View all products
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-16 h-16 bg-slate-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-slate-200 rounded mb-2" />
                    <div className="w-20 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : data && data.products.topSelling.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.products.topSelling.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl bg-white overflow-hidden border border-slate-200">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-amber-500' :
                      index === 1 ? 'bg-slate-400' :
                      index === 2 ? 'bg-amber-700' :
                      'bg-slate-300'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate group-hover:text-emerald-600">
                      {product.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {product.quantity} units sold
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No sales data yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            {[
              {
                href: '/admin/products/new',
                icon: Package,
                title: 'Add Product',
                desc: 'Create new listing',
                color: 'emerald',
              },
              {
                href: '/admin/orders?status=pending',
                icon: Clock,
                title: 'Pending Orders',
                desc: 'Process orders',
                color: 'amber',
              },
              {
                href: '/admin/reviews',
                icon: Star,
                title: 'Moderate Reviews',
                desc: 'Approve or reject',
                color: 'yellow',
              },
              {
                href: '/admin/deals',
                icon: Zap,
                title: 'Flash Deals',
                desc: 'Manage promotions',
                color: 'purple',
              },
              {
                href: '/admin/coupons',
                icon: Tag,
                title: 'Coupons',
                desc: 'Discount codes',
                color: 'blue',
              },
              {
                href: '/',
                icon: Eye,
                title: 'View Store',
                desc: 'See live site',
                color: 'slate',
                external: true,
              },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                target={action.external ? '_blank' : undefined}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group hover:scale-[1.02] ${
                  action.color === 'emerald' ? 'bg-emerald-50 hover:bg-emerald-100' :
                  action.color === 'amber' ? 'bg-amber-50 hover:bg-amber-100' :
                  action.color === 'yellow' ? 'bg-yellow-50 hover:bg-yellow-100' :
                  action.color === 'purple' ? 'bg-purple-50 hover:bg-purple-100' :
                  action.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100' :
                  'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${
                  action.color === 'emerald' ? 'bg-emerald-600' :
                  action.color === 'amber' ? 'bg-amber-600' :
                  action.color === 'yellow' ? 'bg-yellow-500' :
                  action.color === 'purple' ? 'bg-purple-600' :
                  action.color === 'blue' ? 'bg-blue-600' :
                  'bg-slate-600'
                }`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{action.title}</p>
                  <p className="text-sm text-slate-500">{action.desc}</p>
                </div>
                {action.external && <ExternalLink className="w-4 h-4 text-slate-400" />}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
