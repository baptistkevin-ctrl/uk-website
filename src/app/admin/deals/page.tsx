'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  X,
  Save,
  Calendar,
  Clock,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  TrendingDown,
  Star,
  Timer,
  AlertCircle,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface Product {
  id: string
  name: string
  slug: string
  image_url: string | null
  price_pence: number
}

interface Deal {
  id: string
  title: string
  slug: string
  description: string | null
  product_id: string
  deal_price_pence: number
  original_price_pence: number
  starts_at: string
  ends_at: string
  max_quantity: number | null
  claimed_quantity: number
  is_active: boolean
  is_featured: boolean
  banner_image_url: string | null
  created_at: string
  products: Product | null
}

type DealStatus = 'all' | 'active' | 'upcoming' | 'expired'

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<DealStatus>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    product_id: '',
    deal_price_pounds: '',
    starts_at: '',
    ends_at: '',
    max_quantity: '',
    is_featured: false,
  })

  const fetchDeals = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '20',
      })
      const res = await fetch(`/api/admin/deals?${params}`)
      const data = await res.json()
      if (data.deals) {
        setDeals(data.deals)
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching deals:', error)
    }
    setLoading(false)
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?includeInactive=true&limit=500')
      const data = await res.json()
      if (Array.isArray(data)) {
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  useEffect(() => {
    fetchDeals()
    fetchProducts()
  }, [statusFilter, page])

  const openAddModal = () => {
    setEditingDeal(null)
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    setFormData({
      title: '',
      description: '',
      product_id: '',
      deal_price_pounds: '',
      starts_at: now.toISOString().slice(0, 16),
      ends_at: tomorrow.toISOString().slice(0, 16),
      max_quantity: '',
      is_featured: false,
    })
    setShowModal(true)
  }

  const openEditModal = (deal: Deal) => {
    setEditingDeal(deal)
    setFormData({
      title: deal.title,
      description: deal.description || '',
      product_id: deal.product_id,
      deal_price_pounds: (deal.deal_price_pence / 100).toFixed(2),
      starts_at: new Date(deal.starts_at).toISOString().slice(0, 16),
      ends_at: new Date(deal.ends_at).toISOString().slice(0, 16),
      max_quantity: deal.max_quantity?.toString() || '',
      is_featured: deal.is_featured,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a deal title')
      return
    }
    if (!formData.product_id) {
      alert('Please select a product')
      return
    }
    if (!formData.deal_price_pounds) {
      alert('Please enter a deal price')
      return
    }
    if (!formData.starts_at || !formData.ends_at) {
      alert('Please set start and end dates')
      return
    }

    setSaving(true)
    try {
      const body = {
        ...(editingDeal && { id: editingDeal.id }),
        title: formData.title,
        description: formData.description || null,
        product_id: formData.product_id,
        deal_price_pence: Math.round(parseFloat(formData.deal_price_pounds) * 100),
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
        max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : null,
        is_featured: formData.is_featured,
      }

      const res = await fetch('/api/admin/deals', {
        method: editingDeal ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowModal(false)
        fetchDeals()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save deal')
      }
    } catch (error) {
      console.error('Error saving deal:', error)
      alert('Failed to save deal')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return

    try {
      const res = await fetch(`/api/admin/deals?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeals(deals.filter(d => d.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete deal')
      }
    } catch (error) {
      console.error('Error deleting deal:', error)
    }
  }

  const toggleActive = async (deal: Deal) => {
    try {
      const res = await fetch('/api/admin/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deal.id, is_active: !deal.is_active }),
      })
      if (res.ok) {
        setDeals(deals.map(d =>
          d.id === deal.id ? { ...d, is_active: !d.is_active } : d
        ))
      }
    } catch (error) {
      console.error('Error toggling deal:', error)
    }
  }

  const getDealStatus = (deal: Deal): { label: string; color: string; icon: typeof Clock } => {
    const now = new Date()
    const starts = new Date(deal.starts_at)
    const ends = new Date(deal.ends_at)

    if (now < starts) {
      return { label: 'Upcoming', color: 'bg-(--color-info-bg) text-(--color-info)', icon: Clock }
    }
    if (now > ends) {
      return { label: 'Expired', color: 'bg-(--color-elevated) text-(--color-text-secondary)', icon: AlertCircle }
    }
    if (!deal.is_active) {
      return { label: 'Paused', color: 'bg-(--brand-amber-soft) text-(--brand-amber)', icon: EyeOff }
    }
    return { label: 'Active', color: 'bg-(--brand-primary-light) text-(--brand-primary)', icon: Zap }
  }

  const calculateDiscount = (deal: Deal) => {
    if (!deal.original_price_pence || deal.original_price_pence === 0) return 0
    return Math.round((1 - deal.deal_price_pence / deal.original_price_pence) * 100)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredDeals = deals.filter(deal => {
    if (!searchQuery) return true
    return deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.products?.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getSelectedProduct = () => {
    return products.find(p => p.id === formData.product_id)
  }

  if (loading && deals.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Flash Deals</h1>
          <p className="text-(--color-text-muted) mt-1">Create and manage limited-time deals</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/25"
        >
          <Plus className="w-5 h-5" />
          Create Deal
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--color-text-disabled)" />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'upcoming', 'expired'] as DealStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1) }}
              className={`px-4 py-2.5 rounded-xl font-medium capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-(--color-warning-bg) text-(--brand-amber)'
                  : 'bg-(--color-elevated) text-(--color-text-secondary) hover:bg-(--color-border)'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Deals Grid */}
      {filteredDeals.length === 0 ? (
        <div className="bg-(--color-surface) rounded-2xl p-12 text-center border border-(--color-border)">
          <Zap className="w-16 h-16 text-(--color-text-disabled) mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No deals found</h3>
          <p className="text-(--color-text-muted) mb-6">Create your first flash deal to attract customers</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-(--brand-amber) text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create First Deal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => {
            const status = getDealStatus(deal)
            const StatusIcon = status.icon
            const discount = calculateDiscount(deal)

            return (
              <div
                key={deal.id}
                className="bg-(--color-surface) rounded-2xl overflow-hidden border border-(--color-border) shadow-sm hover:shadow-lg transition-all"
              >
                {/* Product Image */}
                <div className="relative aspect-16/9 bg-(--color-elevated)">
                  {deal.products?.image_url ? (
                    <Image
                      src={deal.products.image_url}
                      alt={deal.products.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-12 h-12 text-(--color-text-disabled)" />
                    </div>
                  )}
                  {/* Discount Badge */}
                  {discount > 0 && (
                    <div className="absolute top-3 left-3 bg-(--color-error) text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{discount}%
                    </div>
                  )}
                  {/* Featured Badge */}
                  {deal.is_featured && (
                    <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      Featured
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-foreground line-clamp-1">{deal.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  <Link
                    href={`/products/${deal.products?.slug}`}
                    target="_blank"
                    className="text-sm text-(--color-text-muted) hover:text-(--brand-primary) flex items-center gap-1 mb-3"
                  >
                    {deal.products?.name}
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-bold text-(--color-error)">
                      {formatPrice(deal.deal_price_pence)}
                    </span>
                    <span className="text-sm text-(--color-text-disabled) line-through">
                      {formatPrice(deal.original_price_pence)}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm text-(--color-text-muted) mb-3">
                    <Timer className="w-4 h-4" />
                    <span>
                      {formatDateTime(deal.starts_at)} - {formatDateTime(deal.ends_at)}
                    </span>
                  </div>

                  {/* Quantity Progress */}
                  {deal.max_quantity && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-(--color-text-muted)">Claimed</span>
                        <span className="font-medium text-foreground">
                          {deal.claimed_quantity || 0} / {deal.max_quantity}
                        </span>
                      </div>
                      <div className="h-2 bg-(--color-elevated) rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-orange-500 to-red-500 rounded-full"
                          style={{
                            width: `${Math.min(((deal.claimed_quantity || 0) / deal.max_quantity) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-(--color-border)">
                    <button
                      onClick={() => toggleActive(deal)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        deal.is_active
                          ? 'bg-(--brand-amber-soft) text-(--brand-amber) hover:bg-amber-100'
                          : 'bg-(--brand-primary-light) text-(--brand-primary) hover:bg-(--brand-primary-light)'
                      }`}
                    >
                      {deal.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {deal.is_active ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => openEditModal(deal)}
                      className="p-2 text-(--color-text-muted) hover:text-(--color-info) hover:bg-(--color-info-bg) rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(deal.id)}
                      className="p-2 text-(--color-text-muted) hover:text-(--color-error) hover:bg-(--color-error-bg) rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-(--color-text-muted)">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-(--color-text-secondary) bg-(--color-surface) border border-(--color-border) rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-(--color-text-secondary) bg-(--color-surface) border border-(--color-border) rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-(--color-surface) rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-(--color-border)">
              <h2 className="text-xl font-bold text-foreground">
                {editingDeal ? 'Edit Deal' : 'Create Flash Deal'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-(--color-text-disabled) hover:text-(--color-text-secondary) rounded-lg hover:bg-(--color-elevated)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Flash Sale: 50% off Premium Coffee"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Short description for the deal..."
                />
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Product *
                </label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatPrice(product.price_pence)}
                    </option>
                  ))}
                </select>
                {getSelectedProduct() && (
                  <div className="mt-2 p-3 bg-background rounded-lg flex items-center gap-3">
                    {getSelectedProduct()?.image_url && (
                      <Image
                        src={getSelectedProduct()!.image_url!}
                        alt={getSelectedProduct()!.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{getSelectedProduct()?.name}</p>
                      <p className="text-sm text-(--color-text-muted)">
                        Original price: {formatPrice(getSelectedProduct()!.price_pence)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Deal Price */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Deal Price *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-text-muted) font-medium">£</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.deal_price_pounds}
                    onChange={(e) => setFormData({ ...formData, deal_price_pounds: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="9.99"
                  />
                </div>
                {getSelectedProduct() && formData.deal_price_pounds && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <TrendingDown className="w-4 h-4 text-(--brand-primary)" />
                    <span className="text-(--brand-primary) font-medium">
                      {Math.round((1 - (parseFloat(formData.deal_price_pounds) * 100) / getSelectedProduct()!.price_pence) * 100)}% off
                    </span>
                    <span className="text-(--color-text-disabled)">
                      (Save {formatPrice(getSelectedProduct()!.price_pence - parseFloat(formData.deal_price_pounds) * 100)})
                    </span>
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Max Quantity */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Maximum Quantity (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_quantity}
                  onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Leave empty for unlimited"
                />
                <p className="text-xs text-(--color-text-muted) mt-1">Limit how many units can be sold at deal price</p>
              </div>

              {/* Featured Toggle */}
              <label className="flex items-center gap-3 p-4 bg-(--brand-amber-soft) rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 text-(--brand-amber) border-(--color-border) rounded focus:ring-amber-500"
                />
                <div>
                  <span className="font-medium text-amber-800 flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Featured Deal
                  </span>
                  <p className="text-xs text-(--brand-amber)">Show prominently on the homepage</p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-(--color-border) bg-background rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-(--color-border) rounded-xl text-foreground font-medium hover:bg-(--color-elevated) transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingDeal ? 'Update Deal' : 'Create Deal'}
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
