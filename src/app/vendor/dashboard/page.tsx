'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  AlertCircle,
  ArrowRight,
  CreditCard,
  ExternalLink,
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils/format'

interface VendorStats {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  pendingPayout: number
}

interface RecentOrder {
  id: string
  order_number: string
  created_at: string
  status: string
  total_amount: number
  customer_name: string
}

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<any>(null)
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [stripeLoading, setStripeLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get vendor data
        const vendorRes = await fetch('/api/vendor/register')
        const vendorData = await vendorRes.json()
        setVendor(vendorData.vendor)

        // Get vendor stats
        const statsRes = await fetch('/api/vendor/stats')
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        // Get recent orders
        const ordersRes = await fetch('/api/vendor/orders?limit=5')
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setRecentOrders(ordersData.orders || [])
        }
      } catch (error) {
        console.error('Dashboard data error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleStripeOnboarding = async () => {
    setStripeLoading(true)
    try {
      const res = await fetch('/api/vendor/stripe/onboarding', {
        method: 'POST'
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start onboarding')
      }
    } catch (error) {
      alert('Failed to connect to Stripe')
    } finally {
      setStripeLoading(false)
    }
  }

  const handleStripeDashboard = async () => {
    setStripeLoading(true)
    try {
      const res = await fetch('/api/vendor/stripe/dashboard', {
        method: 'POST'
      })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      } else {
        alert(data.error || 'Failed to open dashboard')
      }
    } catch (error) {
      alert('Failed to open Stripe dashboard')
    } finally {
      setStripeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const needsStripeSetup = !vendor?.stripe_onboarding_complete

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {vendor?.business_name}</p>
      </div>

      {/* Stripe Setup Alert */}
      {needsStripeSetup && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-1">Complete Your Stripe Setup</h3>
              <p className="text-yellow-700 text-sm mb-4">
                To receive payments for your sales, you need to complete your Stripe account setup.
                This only takes a few minutes.
              </p>
              <Button
                onClick={handleStripeOnboarding}
                disabled={stripeLoading}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {stripeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Complete Stripe Setup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Connected */}
      {vendor?.stripe_onboarding_complete && (
        <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-800">Stripe Connected</h3>
                <p className="text-emerald-700 text-sm">
                  {vendor.stripe_payouts_enabled
                    ? 'Your account is ready to receive payouts'
                    : 'Payouts pending - complete any remaining requirements in Stripe'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleStripeDashboard}
              disabled={stripeLoading}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            >
              {stripeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Stripe Dashboard
                  <ExternalLink className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <Link href="/vendor/products" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-xs text-gray-500 mt-1">{stats?.activeProducts || 0} active</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-emerald-600" />
            </div>
            <Link href="/vendor/orders" className="text-sm text-emerald-600 hover:underline">
              View all
            </Link>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-xs text-gray-500 mt-1">{stats?.pendingOrders || 0} pending</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(stats?.totalRevenue || 0)}</p>
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <Link href="/vendor/payouts" className="text-sm text-orange-600 hover:underline">
              View all
            </Link>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(stats?.pendingPayout || 0)}</p>
          <p className="text-sm text-gray-600">Pending Payout</p>
          <p className="text-xs text-gray-500 mt-1">After {vendor?.commission_rate || 15}% commission</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/vendor/products/new"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-600" />
                <span className="text-gray-900">Add New Product</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
            <Link
              href="/vendor/orders?status=pending"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-600" />
                <span className="text-gray-900">View Pending Orders</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
            <Link
              href="/vendor/settings"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <span className="text-gray-900">Manage Store Settings</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/vendor/orders" className="text-sm text-emerald-600 hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">#{order.order_number}</p>
                    <p className="text-sm text-gray-500">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatPrice(order.total_amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No orders yet</p>
              <p className="text-sm">Orders will appear here once customers purchase your products</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
        <h2 className="font-semibold mb-2">Tips to Increase Sales</h2>
        <ul className="space-y-2 text-emerald-100 text-sm">
          <li>• Add high-quality images to your products</li>
          <li>• Keep your inventory up to date</li>
          <li>• Respond to orders quickly for better ratings</li>
          <li>• Offer competitive pricing within your category</li>
        </ul>
      </div>
    </div>
  )
}
