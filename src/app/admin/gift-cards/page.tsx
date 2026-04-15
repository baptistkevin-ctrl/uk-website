'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/layout'
import { formatDistanceToNow, format } from 'date-fns'
import { formatPrice } from '@/lib/utils/format'
import {
  Gift,
  Search,
  Eye,
  Ban,
  RefreshCw,
  Loader2,
  CreditCard,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'

interface GiftCard {
  id: string
  code: string
  initial_value_pence: number
  current_balance_pence: number
  status: string
  recipient_email: string | null
  recipient_name: string | null
  purchased_by_email: string | null
  created_at: string
  expires_at: string
  design_template: string
}

interface Stats {
  total_cards: number
  total_value_pence: number
  total_redeemed_pence: number
  active_cards: number
}

export default function AdminGiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchGiftCards()
  }, [statusFilter])

  const fetchGiftCards = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/gift-cards?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setGiftCards(data.giftCards || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch gift cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateGiftCard = async (id: string, updates: Partial<GiftCard>) => {
    try {
      const res = await fetch(`/api/admin/gift-cards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (res.ok) {
        fetchGiftCards()
      }
    } catch (error) {
      console.error('Failed to update gift card:', error)
    }
  }

  const filteredCards = giftCards.filter(card =>
    card.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-(--brand-primary-light) text-(--brand-primary)'
      case 'pending': return 'bg-(--brand-amber-soft) text-(--brand-amber)'
      case 'used': return 'bg-(--color-elevated) text-foreground'
      case 'expired': return 'bg-(--color-error-bg) text-(--color-error)'
      case 'cancelled': return 'bg-(--color-error-bg) text-(--color-error)'
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
              <Gift className="h-7 w-7 text-(--brand-primary)" />
              Gift Cards
            </h1>
            <p className="text-(--color-text-muted) mt-1">
              Manage gift cards and view redemptions
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--brand-primary-light) rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-(--brand-primary)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Total Cards</p>
                  <p className="text-xl font-bold text-foreground">{stats.total_cards}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-(--color-info)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Total Value</p>
                  <p className="text-xl font-bold text-foreground">{formatPrice(stats.total_value_pence)}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--color-info-bg) rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-(--color-info)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Redeemed</p>
                  <p className="text-xl font-bold text-foreground">{formatPrice(stats.total_redeemed_pence)}</p>
                </div>
              </div>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-4 border border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-(--brand-amber-soft) rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-(--brand-amber)" />
                </div>
                <div>
                  <p className="text-sm text-(--color-text-muted)">Active Cards</p>
                  <p className="text-xl font-bold text-foreground">{stats.active_cards}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex bg-(--color-elevated) rounded-lg p-1">
            {['all', 'active', 'pending', 'used', 'expired'].map((status) => (
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
              placeholder="Search by code, email, or name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
            />
          </div>
        </div>

        {/* Gift Cards List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12 bg-background rounded-xl">
            <Gift className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
            <p className="text-(--color-text-muted)">No gift cards found</p>
          </div>
        ) : (
          <div className="bg-(--color-surface) rounded-xl shadow-sm border border-(--color-border) overflow-hidden">
            <table className="w-full">
              <thead className="bg-background border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Code
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Recipient
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Value
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Balance
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Expires
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-background">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-medium text-foreground">{card.code}</p>
                      <p className="text-xs text-(--color-text-muted)">
                        {formatDistanceToNow(new Date(card.created_at))} ago
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{card.recipient_name || '-'}</p>
                      <p className="text-xs text-(--color-text-muted)">{card.recipient_email}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-foreground">
                        {formatPrice(card.initial_value_pence)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${
                        card.current_balance_pence === 0 ? 'text-(--color-text-disabled)' : 'text-(--brand-primary)'
                      }`}>
                        {formatPrice(card.current_balance_pence)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(card.status)}`}>
                        {card.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-(--color-text-secondary)">
                        {format(new Date(card.expires_at), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {card.status === 'active' && (
                          <button
                            onClick={() => updateGiftCard(card.id, { status: 'cancelled' })}
                            className="p-1.5 text-(--color-error) hover:bg-(--color-error-bg) rounded"
                            title="Cancel"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        {card.status === 'cancelled' && (
                          <button
                            onClick={() => updateGiftCard(card.id, { status: 'active' })}
                            className="p-1.5 text-(--brand-primary) hover:bg-(--brand-primary-light) rounded"
                            title="Reactivate"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
