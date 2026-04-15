'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/layout'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  Search,
  Loader2,
  Package,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'

interface StockAlert {
  id: string
  email: string
  status: string
  created_at: string
  notified_at: string | null
  product: {
    id: string
    name: string
    slug: string
    image_url: string | null
    stock_quantity: number
  }
  user: { id: string; full_name: string; email: string } | null
}

interface Stats {
  total_alerts: number
  pending_alerts: number
  notified_alerts: number
  unique_products: number
}

export default function AdminStockAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAlerts()
  }, [statusFilter])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/stock-alerts?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stock alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAlerts = alerts.filter(alert =>
    alert.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-(--brand-amber-soft) text-(--brand-amber)'
      case 'notified': return 'bg-(--brand-primary-light) text-(--brand-primary)'
      case 'purchased': return 'bg-(--color-info-bg) text-(--color-info)'
      case 'cancelled': return 'bg-(--color-elevated) text-foreground'
      default: return 'bg-(--color-elevated) text-foreground'
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="h-7 w-7 text-(--brand-primary)" />
              Stock Alerts
            </h1>
            <p className="text-(--color-text-muted) mt-1">
              Manage back-in-stock notification subscriptions
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-(--brand-primary)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Total Alerts</p>
                  <p className="text-xl font-bold text-foreground">{stats.total_alerts}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--brand-amber-soft) rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-(--brand-amber)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Pending</p>
                  <p className="text-xl font-bold text-foreground">{stats.pending_alerts}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-(--color-info)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Notified</p>
                  <p className="text-xl font-bold text-foreground">{stats.notified_alerts}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-(--color-info)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Unique Products</p>
                  <p className="text-xl font-bold text-foreground">{stats.unique_products}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex bg-(--color-elevated) rounded-lg p-1">
            {['all', 'active', 'notified', 'purchased'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-(--color-surface) shadow text-foreground'
                    : 'text-(--color-text-secondary) hover:text-foreground'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product or email..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
            />
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-background rounded-xl">
            <Bell className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
            <p className="text-(--color-text-muted)">No stock alerts found</p>
          </div>
        ) : (
          <div className="bg-(--color-surface) rounded-xl shadow-sm border border-(--color-border) overflow-hidden">
            <table className="w-full">
              <thead className="bg-background border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Product
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Customer
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Stock
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Subscribed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-background">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-(--color-elevated) rounded-lg overflow-hidden">
                          {alert.product.image_url ? (
                            <Image
                              src={alert.product.image_url}
                              alt={alert.product.name}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-(--color-text-disabled)" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground line-clamp-2">
                          {alert.product.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">
                        {alert.user?.full_name || 'Guest'}
                      </p>
                      <p className="text-xs text-(--color-text-muted)">{alert.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        alert.product.stock_quantity > 0
                          ? 'bg-(--brand-primary-light) text-(--brand-primary)'
                          : 'bg-(--color-error-bg) text-(--color-error)'
                      }`}>
                        {alert.product.stock_quantity > 0
                          ? `${alert.product.stock_quantity} in stock`
                          : 'Out of stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-(--color-text-secondary)">
                        {formatDistanceToNow(new Date(alert.created_at))} ago
                      </span>
                      {alert.notified_at && (
                        <p className="text-xs text-(--color-text-muted)">
                          Notified {formatDistanceToNow(new Date(alert.notified_at))} ago
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
