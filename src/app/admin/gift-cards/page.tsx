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
      case 'active': return 'bg-emerald-100 text-emerald-700'
      case 'pending': return 'bg-amber-100 text-amber-700'
      case 'used': return 'bg-gray-100 text-gray-700'
      case 'expired': return 'bg-red-100 text-red-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Gift className="h-7 w-7 text-emerald-600" />
              Gift Cards
            </h1>
            <p className="text-gray-500 mt-1">
              Manage gift cards and view redemptions
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Cards</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total_cards}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-xl font-bold text-gray-900">{formatPrice(stats.total_value_pence)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Redeemed</p>
                  <p className="text-xl font-bold text-gray-900">{formatPrice(stats.total_redeemed_pence)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Cards</p>
                  <p className="text-xl font-bold text-gray-900">{stats.active_cards}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['all', 'active', 'pending', 'used', 'expired'].map((status) => (
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
              placeholder="Search by code, email, or name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Gift Cards List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Gift className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No gift cards found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Recipient
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Value
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Balance
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Expires
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-medium text-gray-900">{card.code}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(card.created_at))} ago
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{card.recipient_name || '-'}</p>
                      <p className="text-xs text-gray-500">{card.recipient_email}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-gray-900">
                        {formatPrice(card.initial_value_pence)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${
                        card.current_balance_pence === 0 ? 'text-gray-400' : 'text-emerald-600'
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
                      <span className="text-sm text-gray-600">
                        {format(new Date(card.expires_at), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {card.status === 'active' && (
                          <button
                            onClick={() => updateGiftCard(card.id, { status: 'cancelled' })}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Cancel"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        {card.status === 'cancelled' && (
                          <button
                            onClick={() => updateGiftCard(card.id, { status: 'active' })}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
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
