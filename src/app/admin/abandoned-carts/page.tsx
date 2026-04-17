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
      case 'abandoned': return 'bg-(--brand-amber-soft) text-(--brand-amber)'
      case 'recovered': return 'bg-(--brand-primary-light) text-(--brand-primary)'
      case 'expired': return 'bg-(--color-elevated) text-foreground'
      default: return 'bg-(--color-elevated) text-foreground'
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-7 w-7 text-(--brand-primary)" />
              Abandoned Carts
            </h1>
            <p className="text-(--color-text-muted) mt-1">
              Track and recover abandoned shopping carts
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--brand-amber-soft) rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-(--brand-amber)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Total Abandoned</p>
                  <p className="text-xl font-bold text-foreground">{stats.total_abandoned}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--color-error-bg) rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-(--color-error)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Lost Value</p>
                  <p className="text-xl font-bold text-foreground">{formatPrice(stats.total_value_pence)}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-(--brand-primary)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Recovered</p>
                  <p className="text-xl font-bold text-foreground">{stats.recovered_count}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-(--color-info)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Recovered Value</p>
                  <p className="text-xl font-bold text-foreground">{formatPrice(stats.recovered_value_pence)}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-(--color-info)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Recovery Rate</p>
                  <p className="text-xl font-bold text-foreground">{recoveryRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex bg-(--color-elevated) rounded-lg p-1">
            {['all', 'abandoned', 'recovered', 'expired'].map((status) => (
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
              placeholder="Search by email or name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
            />
          </div>
        </div>

        {/* Carts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
          </div>
        ) : filteredCarts.length === 0 ? (
          <div className="text-center py-12 bg-background rounded-xl">
            <ShoppingCart className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
            <p className="text-(--color-text-muted)">No abandoned carts found</p>
          </div>
        ) : (
          <div className="bg-(--color-surface) rounded-xl shadow-sm border border-(--color-border) overflow-hidden">
            <table className="w-full">
              <thead className="bg-background border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Customer
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Items
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Value
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Emails Sent
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Abandoned
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {filteredCarts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-background">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">
                        {cart.user?.full_name || 'Guest'}
                      </p>
                      <p className="text-xs text-(--color-text-muted)">{cart.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-foreground">
                        {cart.cart_items?.length || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-foreground">
                        {formatPrice(cart.cart_total_pence)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Mail className="h-4 w-4 text-(--color-text-disabled)" />
                        <span className="text-sm text-foreground">
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
                      <div className="flex items-center gap-1 text-sm text-(--color-text-secondary)">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(cart.created_at))} ago
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCart(cart)}
                          className="p-1.5 text-(--color-text-secondary) hover:bg-(--color-elevated) rounded"
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
            <div className="bg-(--color-surface) rounded-xl max-w-lg w-full max-h-[80vh] overflow-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Cart Details</h3>
                  <button
                    onClick={() => setSelectedCart(null)}
                    className="text-(--color-text-disabled) hover:text-(--color-text-secondary)"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-(--color-text-muted)">Customer</p>
                  <p className="font-medium">{selectedCart.user?.full_name || 'Guest'}</p>
                  <p className="text-sm text-(--color-text-secondary)">{selectedCart.email}</p>
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted) mb-2">Items</p>
                  <div className="space-y-2">
                    {(Array.isArray(selectedCart.cart_items) ? selectedCart.cart_items : []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item?.name || 'Unknown item'} x{item?.quantity || 0}</span>
                        <span className="font-medium">{formatPrice((item?.price_pence || 0) * (item?.quantity || 0))}</span>
                      </div>
                    ))}
                    {!Array.isArray(selectedCart.cart_items) && (
                      <p className="text-sm text-(--color-text-muted)">Cart items unavailable</p>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-(--brand-primary)">{formatPrice(selectedCart.cart_total_pence)}</span>
                </div>
                {selectedCart.recovery_emails?.length > 0 && (
                  <div>
                    <p className="text-sm text-(--color-text-muted) mb-2">Recovery Emails</p>
                    <div className="space-y-2">
                      {selectedCart.recovery_emails.map((email) => (
                        <div key={email.id} className="text-sm p-2 bg-background rounded-lg">
                          <p className="font-medium">Email #{email.email_number}</p>
                          <p className="text-(--color-text-secondary)">
                            Sent: {formatDistanceToNow(new Date(email.sent_at))} ago
                          </p>
                          {email.opened_at && (
                            <p className="text-(--brand-primary)">Opened</p>
                          )}
                          {email.clicked_at && (
                            <p className="text-(--color-info)">Clicked</p>
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
