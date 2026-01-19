'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  TrendingUp,
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
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  totalOrders: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products?includeInactive=true')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStats((prev) => ({
            ...prev,
            totalProducts: data.length,
            activeProducts: data.filter((p: any) => p.is_active).length,
            lowStockProducts: data.filter((p: any) => p.stock_quantity <= p.low_stock_threshold).length,
          }))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      change: '+12%',
      trend: 'up',
      icon: Package,
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
      href: '/admin/products',
    },
    {
      title: 'Active Products',
      value: stats.activeProducts,
      change: '+8%',
      trend: 'up',
      icon: CheckCircle2,
      gradient: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50',
      href: '/admin/products?filter=active',
    },
    {
      title: 'Low Stock',
      value: stats.lowStockProducts,
      change: stats.lowStockProducts > 0 ? 'Alert' : 'OK',
      trend: stats.lowStockProducts > 0 ? 'down' : 'up',
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50',
      href: '/admin/products?filter=low-stock',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      change: '+24%',
      trend: 'up',
      icon: ShoppingCart,
      gradient: 'from-purple-500 to-pink-600',
      bgLight: 'bg-purple-50',
      href: '/admin/orders',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            href={stat.href}
            className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 overflow-hidden"
          >
            {/* Animated background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

            {/* Decorative circle */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700`} />

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
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
              <h3 className="text-4xl font-bold text-slate-900 mb-1 tracking-tight">
                {loading ? (
                  <span className="inline-block w-16 h-10 bg-slate-200 rounded-lg animate-pulse" />
                ) : (
                  stat.value.toLocaleString()
                )}
              </h3>
              <p className="text-slate-500 font-medium">{stat.title}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart area */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Sales Overview</h2>
              <p className="text-slate-500 text-sm mt-0.5">Weekly performance</p>
            </div>
            <select className="px-4 py-2.5 bg-slate-100 rounded-xl text-sm font-medium text-slate-600 border-none outline-none cursor-pointer hover:bg-slate-200 transition-colors">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
            </select>
          </div>

          {/* Bar chart */}
          <div className="h-72 flex items-end gap-4 px-2">
            {[
              { day: 'Mon', value: 45, orders: 12 },
              { day: 'Tue', value: 72, orders: 18 },
              { day: 'Wed', value: 58, orders: 15 },
              { day: 'Thu', value: 85, orders: 22 },
              { day: 'Fri', value: 92, orders: 28 },
              { day: 'Sat', value: 78, orders: 20 },
              { day: 'Sun', value: 65, orders: 16 },
            ].map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="relative w-full">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-xl transition-all duration-500 group-hover:from-emerald-600 group-hover:to-emerald-500 relative"
                    style={{ height: `${item.value * 2.5}px` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.orders} orders
                    </div>
                  </div>
                </div>
                <span className="text-sm text-slate-500 font-medium group-hover:text-emerald-600 transition-colors">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
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
                href: '/admin/orders',
                icon: ShoppingCart,
                title: 'View Orders',
                desc: 'Manage orders',
                color: 'blue',
              },
              {
                href: '/admin/delivery',
                icon: Truck,
                title: 'Delivery Slots',
                desc: 'Manage schedule',
                color: 'purple',
              },
              {
                href: '/',
                icon: Eye,
                title: 'View Store',
                desc: 'See live site',
                color: 'amber',
                external: true,
              },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                target={action.external ? '_blank' : undefined}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group hover:scale-[1.02] ${
                  action.color === 'emerald' ? 'bg-emerald-50 hover:bg-emerald-100' :
                  action.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100' :
                  action.color === 'purple' ? 'bg-purple-50 hover:bg-purple-100' :
                  'bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${
                  action.color === 'emerald' ? 'bg-emerald-600' :
                  action.color === 'blue' ? 'bg-blue-600' :
                  action.color === 'purple' ? 'bg-purple-600' :
                  'bg-amber-600'
                }`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{action.title}</p>
                  <p className="text-sm text-slate-500">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <p className="text-slate-500 text-sm mt-0.5">Latest updates from your store</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { action: 'New product added', item: 'Organic Bananas', time: '2 min ago', icon: Package, color: 'emerald' },
            { action: 'Order received', item: 'Order #FM-1234', time: '15 min ago', icon: ShoppingCart, color: 'blue' },
            { action: 'Low stock alert', item: 'Fresh Milk 2L', time: '1 hour ago', icon: AlertTriangle, color: 'amber' },
            { action: 'Order delivered', item: 'Order #FM-1230', time: '2 hours ago', icon: CheckCircle2, color: 'purple' },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className={`p-3 rounded-xl ${
                activity.color === 'emerald' ? 'bg-emerald-100' :
                activity.color === 'blue' ? 'bg-blue-100' :
                activity.color === 'amber' ? 'bg-amber-100' :
                'bg-purple-100'
              }`}>
                <activity.icon className={`w-5 h-5 ${
                  activity.color === 'emerald' ? 'text-emerald-600' :
                  activity.color === 'blue' ? 'text-blue-600' :
                  activity.color === 'amber' ? 'text-amber-600' :
                  'text-purple-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{activity.action}</p>
                <p className="text-sm text-slate-500 truncate">{activity.item}</p>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs whitespace-nowrap">
                <Clock className="w-3.5 h-3.5" />
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
