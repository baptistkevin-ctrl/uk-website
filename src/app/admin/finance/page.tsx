'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PoundSterling, TrendingUp, TrendingDown, Store, CreditCard,
  Loader2, ArrowUpRight, ArrowDownRight, CheckCircle, Clock,
  AlertTriangle, Wallet, BarChart3, Users,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface FinanceData {
  overview: {
    totalRevenue: number
    thisMonthRevenue: number
    revenueChange: number
    todayOrders: number
    averageOrderValue: number
  }
  finance: {
    todayRevenue: number
    todayCommission: number
    thisMonthRevenue: number
    thisMonthCommission: number
    totalCommissionEarned: number
    totalVendorPayouts: number
    pendingPayouts: number
    transferredPayouts: number
    platformProfit: number
  }
  vendors: {
    total: number
    stripeConnected: number
    stripePending: number
    payoutsEnabled: number
  }
  charts: {
    salesByDay: { date: string; day: string; orders: number; revenue: number }[]
    salesByMonth: { month: string; orders: number; revenue: number }[]
  }
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (res.ok) setData(await res.json())
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-8 text-center text-(--color-text-muted)">Failed to load finance data</div>
  }

  const f = data.finance

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PoundSterling className="h-6 w-6 text-(--brand-primary)" />
          Platform Finance
        </h1>
        <p className="text-(--color-text-muted) mt-1">Revenue, commissions, payouts, and vendor Stripe health</p>
      </div>

      {/* Today's P&L Banner */}
      <div className="bg-linear-to-r from-(--brand-dark) to-(--brand-dark)/90 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-(--brand-amber)" />
          <h2 className="font-semibold text-lg">Today's Performance</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-bold font-mono">{formatPrice(f.todayRevenue)}</p>
            <p className="text-white/60 text-sm mt-1">Revenue Today</p>
          </div>
          <div>
            <p className="text-3xl font-bold font-mono">{formatPrice(f.todayCommission)}</p>
            <p className="text-white/60 text-sm mt-1">Commission Earned</p>
          </div>
          <div>
            <p className="text-3xl font-bold font-mono">{data.overview.todayOrders}</p>
            <p className="text-white/60 text-sm mt-1">Orders Today</p>
          </div>
          <div>
            <p className="text-3xl font-bold font-mono">{formatPrice(data.overview.averageOrderValue)}</p>
            <p className="text-white/60 text-sm mt-1">Avg. Order Value</p>
          </div>
        </div>
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--color-success-bg) flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-(--color-success)" />
            </div>
            <span className={`text-sm font-semibold flex items-center gap-1 ${data.overview.revenueChange >= 0 ? 'text-(--color-success)' : 'text-(--color-error)'}`}>
              {data.overview.revenueChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(data.overview.revenueChange)}%
            </span>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{formatPrice(f.thisMonthRevenue)}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">This Month Revenue</p>
        </div>

        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--brand-amber)/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-(--brand-amber)" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{formatPrice(f.thisMonthCommission)}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Commission This Month</p>
        </div>

        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--brand-primary-light) flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-(--brand-primary)" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-(--brand-primary)">{formatPrice(f.platformProfit)}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Platform Profit (All Time)</p>
        </div>

        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--color-warning-bg) flex items-center justify-center">
              <Clock className="h-5 w-5 text-(--color-warning)" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{formatPrice(f.pendingPayouts)}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Pending Vendor Payouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart (Last 7 Days) */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <h2 className="font-semibold text-foreground mb-4">Revenue (Last 7 Days)</h2>
          <div className="flex items-end gap-2" style={{ height: 200 }}>
            {data.charts.salesByDay.map((day, i) => {
              const maxRev = Math.max(...data.charts.salesByDay.map(d => d.revenue), 1)
              const height = (day.revenue / maxRev) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-[10px] text-(--color-text-muted) font-mono">{formatPrice(day.revenue)}</p>
                  <div className="w-full flex items-end" style={{ height: '160px' }}>
                    <div
                      className="w-full bg-(--brand-primary) rounded-t-md transition-all hover:bg-(--brand-primary-hover)"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                  </div>
                  <p className="text-xs text-(--color-text-muted)">{day.day}</p>
                  <p className="text-[10px] text-(--color-text-disabled)">{day.orders} orders</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Vendor Stripe Health */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Store className="h-5 w-5 text-(--color-text-muted)" />
            Vendor Stripe Health
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-(--color-success)" />
                <div>
                  <p className="font-medium text-foreground text-sm">Connected & Active</p>
                  <p className="text-xs text-(--color-text-muted)">Stripe onboarding complete</p>
                </div>
              </div>
              <span className="text-xl font-bold font-mono text-foreground">{data.vendors.stripeConnected}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-(--brand-primary)" />
                <div>
                  <p className="font-medium text-foreground text-sm">Payouts Enabled</p>
                  <p className="text-xs text-(--color-text-muted)">Can receive transfers</p>
                </div>
              </div>
              <span className="text-xl font-bold font-mono text-foreground">{data.vendors.payoutsEnabled}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-(--color-warning)" />
                <div>
                  <p className="font-medium text-foreground text-sm">Pending Setup</p>
                  <p className="text-xs text-(--color-text-muted)">Approved but not connected</p>
                </div>
              </div>
              <span className="text-xl font-bold font-mono text-(--color-warning)">{data.vendors.stripePending}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-(--color-text-muted)" />
                <div>
                  <p className="font-medium text-foreground text-sm">Total Vendors</p>
                  <p className="text-xs text-(--color-text-muted)">All registered vendors</p>
                </div>
              </div>
              <span className="text-xl font-bold font-mono text-foreground">{data.vendors.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Summary */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <h2 className="font-semibold text-foreground mb-4">Payout Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-(--color-success)/5 border border-(--color-success)/20 rounded-lg text-center">
            <p className="text-2xl font-bold font-mono text-(--color-success)">{formatPrice(f.transferredPayouts)}</p>
            <p className="text-sm text-(--color-text-muted) mt-1">Successfully Transferred</p>
          </div>
          <div className="p-4 bg-(--color-warning)/5 border border-(--color-warning)/20 rounded-lg text-center">
            <p className="text-2xl font-bold font-mono text-(--color-warning)">{formatPrice(f.pendingPayouts)}</p>
            <p className="text-sm text-(--color-text-muted) mt-1">Pending Transfer</p>
          </div>
          <div className="p-4 bg-(--brand-primary)/5 border border-(--brand-primary)/20 rounded-lg text-center">
            <p className="text-2xl font-bold font-mono text-(--brand-primary)">{formatPrice(f.totalCommissionEarned)}</p>
            <p className="text-sm text-(--color-text-muted) mt-1">Total Commission Earned</p>
          </div>
        </div>
      </div>
    </div>
  )
}
