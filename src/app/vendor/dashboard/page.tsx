'use client'

import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'
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
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/Spinner'
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

function getOrderBadgeVariant(status: string) {
  switch (status) {
    case 'delivered':
    case 'transferred':
      return 'success' as const
    case 'pending':
      return 'warning' as const
    case 'pending_payout':
      return 'warning' as const
    case 'cancelled':
      return 'destructive' as const
    default:
      return 'info' as const
  }
}

function getOrderStatusLabel(status: string) {
  switch (status) {
    case 'transferred':
      return 'Paid'
    case 'pending_payout':
      return 'Pending Payout'
    default:
      return status
  }
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
      if (data.url && (data.url.startsWith('https://connect.stripe.com') || data.url.startsWith('https://dashboard.stripe.com'))) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to start onboarding')
      }
    } catch (error) {
      toast.error('Failed to connect to Stripe')
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
      if (data.url && (data.url.startsWith('https://connect.stripe.com') || data.url.startsWith('https://dashboard.stripe.com'))) {
        window.open(data.url, '_blank')
      } else {
        toast.error(data.error || 'Failed to open dashboard')
      }
    } catch (error) {
      toast.error('Failed to open Stripe dashboard')
    } finally {
      setStripeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  const needsStripeSetup = !vendor?.stripe_onboarding_complete

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-(--color-text-secondary) mt-1">Welcome back, {vendor?.business_name}</p>
      </div>

      {/* Stripe Setup Alert */}
      {needsStripeSetup && (
        <div className="mb-8 bg-(--color-warning-bg) border border-(--color-warning)/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-(--color-warning)/15 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-(--color-warning)" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Complete Your Stripe Setup</h3>
              <p className="text-(--color-text-secondary) text-sm mb-4">
                To receive payments for your sales, you need to complete your Stripe account setup.
                This only takes a few minutes.
              </p>
              <Button
                onClick={handleStripeOnboarding}
                disabled={stripeLoading}
                className="bg-(--brand-amber) hover:bg-(--brand-amber-hover) text-white"
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
        <div className="mb-8 bg-(--color-success-bg) border border-(--color-success)/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-(--color-success)/15 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-(--color-success)" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Stripe Connected</h3>
                <p className="text-(--color-text-secondary) text-sm">
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
              className="border-(--color-success)/30 text-(--color-success) hover:bg-(--color-success)/10"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Total Products */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-(--brand-primary-light) text-(--brand-primary) flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <Link href="/vendor/products" className="text-xs text-(--brand-primary) hover:underline font-medium">
              View all
            </Link>
          </div>
          <p className="text-2xl font-semibold font-mono text-foreground">{stats?.totalProducts || 0}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Total Products</p>
          <p className="text-xs text-(--color-text-muted) mt-1">{stats?.activeProducts || 0} active</p>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-(--color-info-bg) text-(--color-info) flex items-center justify-center">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <Link href="/vendor/orders" className="text-xs text-(--color-info) hover:underline font-medium">
              View all
            </Link>
          </div>
          <p className="text-2xl font-semibold font-mono text-foreground">{stats?.totalOrders || 0}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Total Orders</p>
          <p className="text-xs text-(--color-text-muted) mt-1">{stats?.pendingOrders || 0} pending</p>
        </div>

        {/* Total Revenue */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-(--color-success-bg) text-(--color-success) flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-semibold font-mono text-foreground">{formatPrice(stats?.totalRevenue || 0)}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Total Revenue</p>
          <p className="text-xs text-(--color-text-muted) mt-1">All time</p>
        </div>

        {/* Pending Orders */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-(--color-warning-bg) text-(--color-warning) flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <Link href="/vendor/orders?status=pending" className="text-xs text-(--color-warning) hover:underline font-medium">
              View
            </Link>
          </div>
          <p className="text-2xl font-semibold font-mono text-foreground">{stats?.pendingOrders || 0}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Pending Orders</p>
        </div>

        {/* Pending Payout */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-lg bg-(--brand-amber-soft) text-(--brand-amber) flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <Link href="/vendor/payouts" className="text-xs text-(--brand-amber) hover:underline font-medium">
              View all
            </Link>
          </div>
          <p className="text-2xl font-semibold font-mono text-foreground">{formatPrice(stats?.pendingPayout || 0)}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Pending Payout</p>
          <p className="text-xs text-(--color-text-muted) mt-1">After {vendor?.commission_rate || 12.5}% commission</p>
        </div>
      </div>

      {/* Quick Actions + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Quick Actions */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/vendor/products/new"
              className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-(--color-elevated) transition-colors duration-(--duration-fast)"
            >
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-(--color-text-muted)" />
                <span className="text-sm font-medium text-foreground">Add New Product</span>
              </div>
              <ArrowRight className="h-4 w-4 text-(--color-text-muted)" />
            </Link>
            <Link
              href="/vendor/orders?status=pending"
              className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-(--color-elevated) transition-colors duration-(--duration-fast)"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-(--color-text-muted)" />
                <span className="text-sm font-medium text-foreground">View Pending Orders</span>
              </div>
              <ArrowRight className="h-4 w-4 text-(--color-text-muted)" />
            </Link>
            <Link
              href="/vendor/settings"
              className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-(--color-elevated) transition-colors duration-(--duration-fast)"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-(--color-text-muted)" />
                <span className="text-sm font-medium text-foreground">Manage Store Settings</span>
              </div>
              <ArrowRight className="h-4 w-4 text-(--color-text-muted)" />
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border)">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Orders</h2>
            <Link href="/vendor/orders" className="text-xs text-(--brand-primary) hover:underline font-medium">
              View all
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div>
              {recentOrders.map((order, index) => (
                <div
                  key={order.id}
                  className={`flex items-center justify-between px-5 py-4 ${
                    index < recentOrders.length - 1 ? 'border-b border-(--color-border)' : ''
                  }`}
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-foreground">#{order.order_number}</p>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">{order.customer_name}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <p className="font-mono font-semibold text-sm text-foreground">{formatPrice(order.total_amount)}</p>
                    <Badge variant={getOrderBadgeVariant(order.status)}>
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-5">
              <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-(--color-border-strong)" />
              <p className="text-sm font-medium text-(--color-text-secondary)">No orders yet</p>
              <p className="text-xs text-(--color-text-muted) mt-1">Orders will appear here once customers purchase your products</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-(--brand-dark) rounded-xl p-6">
        <h2 className="font-display font-semibold text-white mb-3">Tips to Increase Sales</h2>
        <ul className="space-y-2 text-white/70 text-sm">
          <li>Add high-quality images to your products</li>
          <li>Keep your inventory up to date</li>
          <li>Respond to orders quickly for better ratings</li>
          <li>Offer competitive pricing within your category</li>
        </ul>
      </div>
    </div>
  )
}
