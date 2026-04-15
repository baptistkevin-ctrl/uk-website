'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { formatDistanceToNow, format } from 'date-fns'
import { formatPrice } from '@/lib/utils/format'
import {
  Gift,
  Search,
  Ban,
  RefreshCw,
  Loader2,
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  X,
  Save,
  Copy,
  Check,
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
  gift_message: string | null
  created_at: string
  expires_at: string
}

interface Stats {
  total_cards: number
  total_value_pence: number
  total_redeemed_pence: number
  active_cards: number
}

export default function VendorGiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    value_pounds: '',
    recipient_email: '',
    recipient_name: '',
    gift_message: '',
  })

  useEffect(() => {
    fetchGiftCards()
  }, [])

  const fetchGiftCards = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/gift-cards')
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

  const handleCreate = async () => {
    const value = parseFloat(formData.value_pounds)
    if (!value || value < 1) {
      toast.warning('Minimum gift card value is £1.00')
      return
    }
    if (value > 500) {
      toast.warning('Maximum gift card value is £500.00')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/vendor/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setShowModal(false)
        setFormData({ value_pounds: '', recipient_email: '', recipient_name: '', gift_message: '' })
        fetchGiftCards()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create gift card')
      }
    } catch (error) {
      console.error('Error creating gift card:', error)
      toast.error('Failed to create gift card')
    }
    setSaving(false)
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/vendor/gift-cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) fetchGiftCards()
    } catch (error) {
      console.error('Failed to update gift card:', error)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredCards = giftCards.filter(card => {
    const matchesSearch =
      card.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || card.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="h-7 w-7 text-(--brand-primary)" />
            Gift Cards
          </h1>
          <p className="text-(--color-text-muted) mt-1">Create and manage gift cards for your customers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-(--brand-primary) text-white rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Gift Card
        </button>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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

        <div className="flex-1 relative max-w-md w-full">
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
        <div className="text-center py-12 bg-(--color-surface) rounded-xl border border-(--color-border)">
          <Gift className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No gift cards yet</h3>
          <p className="text-(--color-text-muted) mb-6">Create your first gift card to offer to customers</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-(--brand-primary) text-white rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create First Gift Card
          </button>
        </div>
      ) : (
        <div className="bg-(--color-surface) rounded-xl shadow-sm border border-(--color-border) overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">Code</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">Recipient</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">Value</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">Balance</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">Expires</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-(--color-text-muted) uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-background">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-medium text-foreground">{card.code}</p>
                        <button
                          onClick={() => copyCode(card.code)}
                          className="p-1 text-(--color-text-disabled) hover:text-(--color-text-secondary) rounded"
                          title="Copy code"
                        >
                          {copiedCode === card.code ? (
                            <Check className="h-3.5 w-3.5 text-(--brand-primary)" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-(--color-text-muted)">
                        {formatDistanceToNow(new Date(card.created_at))} ago
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-foreground">{card.recipient_name || '—'}</p>
                      <p className="text-xs text-(--color-text-muted)">{card.recipient_email || '—'}</p>
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
                        {card.expires_at ? format(new Date(card.expires_at), 'dd MMM yyyy') : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {card.status === 'active' && (
                          <button
                            onClick={() => updateStatus(card.id, 'cancelled')}
                            className="p-1.5 text-(--color-error) hover:bg-(--color-error-bg) rounded"
                            title="Cancel"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        {card.status === 'cancelled' && (
                          <button
                            onClick={() => updateStatus(card.id, 'active')}
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
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-(--color-surface) rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Gift className="h-5 w-5 text-(--brand-primary)" />
                Create Gift Card
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-(--color-text-disabled) hover:text-(--color-text-secondary) rounded-lg hover:bg-(--color-elevated)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Value (£) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-text-muted) font-medium">£</span>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="0.01"
                    value={formData.value_pounds}
                    onChange={(e) => setFormData({ ...formData, value_pounds: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                    placeholder="25.00"
                  />
                </div>
                <p className="text-xs text-(--color-text-muted) mt-1">Min £1.00 — Max £500.00</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={formData.recipient_email}
                  onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Gift Message</label>
                <textarea
                  value={formData.gift_message}
                  onChange={(e) => setFormData({ ...formData, gift_message: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  rows={3}
                  placeholder="Enjoy your shopping!"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t bg-background rounded-b-xl">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-(--color-border) rounded-lg text-foreground font-medium hover:bg-(--color-elevated) transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Gift Card
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
