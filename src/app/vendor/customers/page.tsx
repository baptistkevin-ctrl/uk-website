'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Repeat,
  ShoppingBag,
  TrendingUp,
  Loader2,
  Crown,
  UserPlus,
  Mail,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface CustomerInsights {
  totalCustomers: number
  repeatCustomers: number
  repeatRate: number
  averageBasket: number
  topCustomers: {
    name: string
    email: string
    orders: number
    totalSpent: number
    lastOrder: string
  }[]
  recentCustomers: {
    name: string
    email: string
    firstOrder: string
    totalSpent: number
  }[]
}

export default function VendorCustomersPage() {
  const [data, setData] = useState<CustomerInsights | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/vendor/customers')
        if (res.ok) {
          setData(await res.json())
        }
      } catch (error) {
        console.error('Customer insights error:', error)
      } finally {
        setLoading(false)
      }
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Customer Insights</h1>
        <p className="text-(--color-text-secondary)">Understand your customer base and buying patterns</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--brand-primary-light) flex items-center justify-center">
              <Users className="h-5 w-5 text-(--brand-primary)" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{data?.totalCustomers || 0}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Total Customers</p>
        </div>

        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--color-info-bg) flex items-center justify-center">
              <Repeat className="h-5 w-5 text-(--color-info)" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{data?.repeatRate || 0}%</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Repeat Rate</p>
          <p className="text-xs text-(--color-text-disabled) mt-0.5">{data?.repeatCustomers || 0} repeat buyers</p>
        </div>

        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--color-success-bg) flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-(--color-success)" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{formatPrice(data?.averageBasket || 0)}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Avg. Order Value</p>
        </div>

        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-(--brand-amber-soft) flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-(--brand-amber)" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{data?.repeatCustomers || 0}</p>
          <p className="text-sm text-(--color-text-muted) mt-0.5">Loyal Customers</p>
          <p className="text-xs text-(--color-text-disabled) mt-0.5">2+ orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) overflow-hidden">
          <div className="p-5 border-b border-(--color-border) flex items-center gap-2">
            <Crown className="h-5 w-5 text-(--brand-amber)" />
            <h2 className="font-semibold text-foreground">Top Customers</h2>
          </div>
          {data?.topCustomers && data.topCustomers.length > 0 ? (
            <div className="divide-y divide-(--color-border)">
              {data.topCustomers.map((customer, i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-(--color-elevated) flex items-center justify-center text-sm font-bold text-(--color-text-muted)">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{customer.name}</p>
                      <p className="text-xs text-(--color-text-muted) flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {customer.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground text-sm font-mono">{formatPrice(customer.totalSpent)}</p>
                    <p className="text-xs text-(--color-text-muted)">{customer.orders} order{customer.orders > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <Users className="h-10 w-10 mx-auto text-(--color-text-disabled) mb-3" />
              <p className="text-sm text-(--color-text-muted)">No customer data yet</p>
            </div>
          )}
        </div>

        {/* Recent New Customers */}
        <div className="bg-(--color-surface) rounded-xl border border-(--color-border) overflow-hidden">
          <div className="p-5 border-b border-(--color-border) flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-(--brand-primary)" />
            <h2 className="font-semibold text-foreground">Recent New Customers</h2>
          </div>
          {data?.recentCustomers && data.recentCustomers.length > 0 ? (
            <div className="divide-y divide-(--color-border)">
              {data.recentCustomers.map((customer, i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{customer.name}</p>
                    <p className="text-xs text-(--color-text-muted)">{customer.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground text-sm font-mono">{formatPrice(customer.totalSpent)}</p>
                    <p className="text-xs text-(--color-text-muted)">
                      Joined {new Date(customer.firstOrder).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <UserPlus className="h-10 w-10 mx-auto text-(--color-text-disabled) mb-3" />
              <p className="text-sm text-(--color-text-muted)">No new customers yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
