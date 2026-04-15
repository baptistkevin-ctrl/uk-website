'use client'

import { useState, useEffect } from 'react'
import {
  Users, Crown, Heart, ShoppingBag, UserPlus, AlertTriangle,
  XCircle, Clock, Loader2, TrendingUp, PoundSterling,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface Segment {
  key: string
  label: string
  description: string
  count: number
  color: string
}

interface Customer {
  id: string
  name: string
  email: string
  joinedAt: string
  orderCount: number
  totalSpent: number
  lastOrder: string | null
  segment: string
}

const SEGMENT_ICONS: Record<string, typeof Crown> = {
  vip: Crown,
  loyal: Heart,
  returning: ShoppingBag,
  first_purchase: UserPlus,
  new: UserPlus,
  at_risk: AlertTriangle,
  churned: XCircle,
  inactive: Clock,
}

export default function CustomerSegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [topCustomers, setTopCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState({ totalCustomers: 0, totalRevenue: 0, avgLifetimeValue: 0 })
  const [loading, setLoading] = useState(true)
  const [activeSegment, setActiveSegment] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/customers/segments')
        if (res.ok) {
          const data = await res.json()
          setSegments(data.segments || [])
          setTopCustomers(data.topCustomers || [])
          setStats({
            totalCustomers: data.totalCustomers || 0,
            totalRevenue: data.totalRevenue || 0,
            avgLifetimeValue: data.avgLifetimeValue || 0,
          })
        }
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

  const filteredCustomers = activeSegment
    ? topCustomers.filter(c => c.segment === activeSegment)
    : topCustomers

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-(--brand-primary)" />
          Customer Segments
        </h1>
        <p className="text-(--color-text-muted) mt-1">Understand your customer base and target retention</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <div className="h-10 w-10 rounded-lg bg-(--brand-primary-light) flex items-center justify-center mb-3">
            <Users className="h-5 w-5 text-(--brand-primary)" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{stats.totalCustomers.toLocaleString()}</p>
          <p className="text-sm text-(--color-text-muted)">Total Customers</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <div className="h-10 w-10 rounded-lg bg-(--color-success-bg) flex items-center justify-center mb-3">
            <PoundSterling className="h-5 w-5 text-(--color-success)" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-sm text-(--color-text-muted)">Total Customer Revenue</p>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
          <div className="h-10 w-10 rounded-lg bg-(--brand-amber)/10 flex items-center justify-center mb-3">
            <TrendingUp className="h-5 w-5 text-(--brand-amber)" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{formatPrice(stats.avgLifetimeValue)}</p>
          <p className="text-sm text-(--color-text-muted)">Avg. Lifetime Value</p>
        </div>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {segments.map((segment) => {
          const Icon = SEGMENT_ICONS[segment.key] || Users
          const isActive = activeSegment === segment.key
          return (
            <button
              key={segment.key}
              onClick={() => setActiveSegment(isActive ? null : segment.key)}
              className={`rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? 'border-2 shadow-md'
                  : 'border-(--color-border) hover:border-(--color-border) hover:shadow-sm'
              }`}
              style={isActive ? { borderColor: segment.color } : undefined}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${segment.color}15` }}>
                  <Icon className="h-4 w-4" style={{ color: segment.color }} />
                </div>
                <span className="text-2xl font-bold font-mono text-foreground">{segment.count}</span>
              </div>
              <p className="font-medium text-foreground text-sm">{segment.label}</p>
              <p className="text-[11px] text-(--color-text-muted) mt-0.5">{segment.description}</p>
            </button>
          )
        })}
      </div>

      {/* Top Customers Table */}
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
        <div className="px-6 py-4 border-b border-(--color-border) flex items-center justify-between">
          <h2 className="font-semibold text-foreground">
            {activeSegment ? `${segments.find(s => s.key === activeSegment)?.label} Customers` : 'Top Customers by Revenue'}
          </h2>
          {activeSegment && (
            <button onClick={() => setActiveSegment(null)} className="text-xs text-(--brand-primary) hover:underline">
              Show all
            </button>
          )}
        </div>
        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Segment</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-(--color-text-muted) uppercase">Orders</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-(--color-text-muted) uppercase">Total Spent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-(--color-text-muted) uppercase">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {filteredCustomers.map((customer, i) => {
                  const seg = segments.find(s => s.key === customer.segment)
                  return (
                    <tr key={customer.id} className="hover:bg-background transition-colors">
                      <td className="px-6 py-3 text-sm text-(--color-text-muted)">{i + 1}</td>
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-foreground">{customer.name}</p>
                        <p className="text-xs text-(--color-text-muted)">{customer.email}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className="px-2.5 py-1 text-xs font-medium rounded-full"
                          style={{ backgroundColor: `${seg?.color || '#6B7280'}15`, color: seg?.color || '#6B7280' }}
                        >
                          {seg?.label || customer.segment}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-mono text-foreground">{customer.orderCount}</td>
                      <td className="px-6 py-3 text-right text-sm font-mono font-semibold text-foreground">{formatPrice(customer.totalSpent)}</td>
                      <td className="px-6 py-3 text-right text-xs text-(--color-text-muted)">
                        {customer.lastOrder
                          ? new Date(customer.lastOrder).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Never'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <Users className="h-10 w-10 mx-auto text-(--color-text-disabled) mb-3" />
            <p className="text-sm text-(--color-text-muted)">No customers in this segment</p>
          </div>
        )}
      </div>
    </div>
  )
}
