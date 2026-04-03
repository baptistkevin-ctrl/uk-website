'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  BellRing,
  Search,
  Loader2,
  Package,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import Image from 'next/image'

interface StockAlert {
  id: string
  email: string
  status: string
  product_id: string
  created_at: string
  notified_at: string | null
  product: {
    id: string
    name: string
    slug: string
    image_url: string | null
    stock_quantity: number
    price_pence: number
  }
  user: { id: string; full_name: string; email: string } | null
}

interface Stats {
  total_alerts: number
  pending_alerts: number
  notified_alerts: number
  unique_products: number
}

export default function VendorStockAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vendor/stock-alerts?status=${statusFilter}`)
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
  }, [statusFilter])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleUpdateStatus = async (alertId: string, newStatus: string) => {
    setUpdatingId(alertId)
    try {
      const res = await fetch('/api/vendor/stock-alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, status: newStatus }),
      })

      if (res.ok) {
        await fetchAlerts()
      }
    } catch (error) {
      console.error('Failed to update alert:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredAlerts = alerts.filter(alert =>
    alert.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alert.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-amber-100 text-amber-700'
      case 'notified': return 'bg-emerald-100 text-emerald-700'
      case 'purchased': return 'bg-blue-100 text-blue-700'
      case 'cancelled': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return { label: 'Out of stock', className: 'bg-red-100 text-red-700', icon: XCircle }
    }
    if (quantity <= 5) {
      return { label: `${quantity} left`, className: 'bg-amber-100 text-amber-700', icon: AlertTriangle }
    }
    return { label: `${quantity} in stock`, className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BellRing className="h-7 w-7 text-emerald-600" />
          Stock Alerts
        </h1>
        <p className="text-gray-500 mt-1">
          Monitor back-in-stock requests and low stock notifications for your products
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <BellRing className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Alerts</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_alerts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending_alerts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Notified</p>
                <p className="text-xl font-bold text-gray-900">{stats.notified_alerts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Unique Products</p>
                <p className="text-xl font-bold text-gray-900">{stats.unique_products}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['all', 'active', 'notified', 'purchased'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product or email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Alerts Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BellRing className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No stock alerts found</p>
          <p className="text-gray-400 text-sm mt-1">
            Alerts will appear here when customers subscribe to back-in-stock notifications for your products
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Stock Level
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Subscribed
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAlerts.map((alert) => {
                  const stockBadge = getStockBadge(alert.product.stock_quantity)
                  const StockIcon = stockBadge.icon

                  return (
                    <tr key={alert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                                <Package className="h-6 w-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {alert.product.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {alert.user?.full_name || 'Guest'}
                        </p>
                        <p className="text-xs text-gray-500">{alert.email}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${stockBadge.className}`}>
                          <StockIcon className="h-3 w-3" />
                          {stockBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(alert.created_at))} ago
                        </span>
                        {alert.notified_at && (
                          <p className="text-xs text-gray-500">
                            Notified {formatDistanceToNow(new Date(alert.notified_at))} ago
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {alert.status === 'active' && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus(alert.id, 'notified')}
                              disabled={updatingId === alert.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Mark as notified"
                            >
                              {updatingId === alert.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              Notified
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(alert.id, 'cancelled')}
                              disabled={updatingId === alert.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Cancel alert"
                            >
                              <XCircle className="h-3 w-3" />
                              Cancel
                            </button>
                          </div>
                        )}
                        {alert.status !== 'active' && (
                          <span className="text-xs text-gray-400">--</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
