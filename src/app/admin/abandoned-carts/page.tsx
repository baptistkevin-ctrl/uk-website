'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/layout'
import { formatDistanceToNow } from 'date-fns'
import { formatPrice } from '@/lib/utils/format'
import {
  ShoppingCart,
  Search,
  Loader2,
  DollarSign,
  TrendingUp,
  Mail,
  RotateCcw,
  Eye,
  Clock
} from 'lucide-react'

interface CartItem {
  product_id: string
  name: string
  quantity: number
  price_pence: number
}

interface RecoveryEmail {
  id: string
  email_number: number
  sent_at: string
  opened_at: string | null
  clicked_at: string | null
}

interface AbandonedCart {
  id: string
  email: string
  status: string
  cart_items: CartItem[]
  cart_total_pence: number
  created_at: string
  recovered_at: string | null
  user: { id: string; full_name: string; email: string } | null
  recovery_emails: RecoveryEmail[]
}

interface Stats {
  total_abandoned: number
  total_value_pence: number
  recovered_count: number
  recovered_value_pence: number
  pending_count: number
}

export default function AdminAbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null)

  useEffect(() => {
    fetchCarts()
  }, [statusFilter])

  const fetchCarts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/abandoned-carts?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setCarts(data.carts || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch abandoned carts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCarts = carts.filter(cart =>
    cart.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cart.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'abandoned': return 'bg-amber-100 text-amber-700'
      case 'recovered': return 'bg-emerald-100 text-emerald-700'
      case 'expired': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const recoveryRate = stats
    ? ((stats.recovered_count / Math.max(stats.total_abandoned, 1)) * 100).toFixed(1)
    : '0'

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-7 w-7 text-emerald-600" />
              Abandoned Carts
            </h1>
            <p className="text-gray-500 mt-1">
              Track and recover abandoned shopping carts
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Abandoned</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total_abandoned}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lost Value</p>
                  <p className="text-xl font-bold text-gray-900">{formatPrice(stats.total_value_pence)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recovered</p>
                  <p className="text-xl font-bold text-gray-900">{stats.recovered_count}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recovered Value</p>
                  <p className="text-xl font-bold text-gray-900">{formatPrice(stats.recovered_value_pence)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recovery Rate</p>
                  <p className="text-xl font-bold text-gray-900">{recoveryRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['all', 'abandoned', 'recovered', 'expired'].map((status) => (
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

          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Carts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredCarts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No abandoned carts found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Items
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Value
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Emails Sent
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Abandoned
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCarts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {cart.user?.full_name || 'Guest'}
                      </p>
                      <p className="text-xs text-gray-500">{cart.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-700">
                        {cart.cart_items?.length || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-gray-900">
                        {formatPrice(cart.cart_total_pence)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {cart.recovery_emails?.length || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cart.status)}`}>
                        {cart.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(cart.created_at))} ago
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCart(cart)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cart Details Modal */}
        {selectedCart && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Cart Details</h3>
                  <button
                    onClick={() => setSelectedCart(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedCart.user?.full_name || 'Guest'}</p>
                  <p className="text-sm text-gray-600">{selectedCart.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedCart.cart_items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.price_pence * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-emerald-600">{formatPrice(selectedCart.cart_total_pence)}</span>
                </div>
                {selectedCart.recovery_emails?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Recovery Emails</p>
                    <div className="space-y-2">
                      {selectedCart.recovery_emails.map((email) => (
                        <div key={email.id} className="text-sm p-2 bg-gray-50 rounded-lg">
                          <p className="font-medium">Email #{email.email_number}</p>
                          <p className="text-gray-600">
                            Sent: {formatDistanceToNow(new Date(email.sent_at))} ago
                          </p>
                          {email.opened_at && (
                            <p className="text-emerald-600">Opened</p>
                          )}
                          {email.clicked_at && (
                            <p className="text-blue-600">Clicked</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
