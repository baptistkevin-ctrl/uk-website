'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Ticket,
  X,
  Save,
  Copy,
  Check,
  Search,
  Filter,
  Percent,
  PoundSterling,
  Truck,
  Calendar,
  Users,
  ShoppingCart,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface Coupon {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping'
  discount_value: number
  min_order_pence: number
  max_discount_pence: number | null
  usage_limit: number | null
  usage_count: number
  per_user_limit: number
  applies_to: 'all' | 'products' | 'categories' | 'vendors'
  applicable_ids: string[] | null
  exclude_sale_items: boolean
  first_order_only: boolean
  starts_at: string
  expires_at: string | null
  is_active: boolean
  created_at: string
}

const discountTypeIcons = {
  percentage: Percent,
  fixed_amount: PoundSterling,
  free_shipping: Truck,
}

const discountTypeLabels = {
  percentage: 'Percentage',
  fixed_amount: 'Fixed Amount',
  free_shipping: 'Free Shipping',
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount' | 'free_shipping',
    discount_value: '',
    min_order_pounds: '',
    max_discount_pounds: '',
    usage_limit: '',
    per_user_limit: '1',
    applies_to: 'all' as 'all' | 'products' | 'categories' | 'vendors',
    exclude_sale_items: false,
    first_order_only: false,
    starts_at: '',
    expires_at: '',
    is_active: true,
  })

  const fetchCoupons = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      const res = await fetch(`/api/admin/coupons?${params}`)
      const data = await res.json()
      if (data.coupons) {
        setCoupons(data.coupons)
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCoupons()
  }, [page, statusFilter])

  const openAddModal = () => {
    setEditingCoupon(null)
    const now = new Date()
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_pounds: '',
      max_discount_pounds: '',
      usage_limit: '',
      per_user_limit: '1',
      applies_to: 'all',
      exclude_sale_items: false,
      first_order_only: false,
      starts_at: now.toISOString().slice(0, 16),
      expires_at: '',
      is_active: true,
    })
    setShowModal(true)
  }

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_pounds: coupon.min_order_pence ? (coupon.min_order_pence / 100).toFixed(2) : '',
      max_discount_pounds: coupon.max_discount_pence ? (coupon.max_discount_pence / 100).toFixed(2) : '',
      usage_limit: coupon.usage_limit?.toString() || '',
      per_user_limit: coupon.per_user_limit.toString(),
      applies_to: coupon.applies_to,
      exclude_sale_items: coupon.exclude_sale_items,
      first_order_only: coupon.first_order_only,
      starts_at: coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : '',
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
      is_active: coupon.is_active,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.code.trim()) {
      alert('Please enter a coupon code')
      return
    }
    if (!formData.discount_value && formData.discount_type !== 'free_shipping') {
      alert('Please enter a discount value')
      return
    }

    setSaving(true)
    try {
      const body = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        min_order_pence: formData.min_order_pounds ? Math.round(parseFloat(formData.min_order_pounds) * 100) : 0,
        max_discount_pence: formData.max_discount_pounds ? Math.round(parseFloat(formData.max_discount_pounds) * 100) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        per_user_limit: parseInt(formData.per_user_limit) || 1,
        applies_to: formData.applies_to,
        exclude_sale_items: formData.exclude_sale_items,
        first_order_only: formData.first_order_only,
        starts_at: formData.starts_at || new Date().toISOString(),
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
      }

      let res
      if (editingCoupon) {
        res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (res.ok) {
        setShowModal(false)
        fetchCoupons()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save coupon')
      }
    } catch (error) {
      console.error('Error saving coupon:', error)
      alert('Failed to save coupon')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        if (data.deactivated) {
          alert(data.message)
        }
        fetchCoupons()
      } else {
        alert(data.error || 'Failed to delete coupon')
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
    }
  }

  const toggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      })
      if (res.ok) {
        setCoupons(
          coupons.map((c) =>
            c.id === coupon.id ? { ...c, is_active: !c.is_active } : c
          )
        )
      }
    } catch (error) {
      console.error('Error toggling coupon:', error)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }

  const formatDiscountValue = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`
    } else if (coupon.discount_type === 'fixed_amount') {
      return formatPrice(coupon.discount_value * 100)
    }
    return 'Free Shipping'
  }

  const isExpired = (coupon: Coupon) => {
    if (!coupon.expires_at) return false
    return new Date(coupon.expires_at) < new Date()
  }

  const filteredCoupons = coupons.filter((coupon) => {
    if (searchQuery) {
      return coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.description?.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  if (loading) {
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
          <h1 className="text-3xl font-bold text-foreground">Coupons</h1>
          <p className="text-(--color-text-muted) mt-1">Create and manage discount codes</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary-hover) transition-all shadow-lg shadow-(--shadow-green)"
        >
          <Plus className="w-5 h-5" />
          Create Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--color-text-disabled)" />
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-(--color-text-disabled)" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'expired')}
            className="px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
          >
            <option value="all">All Coupons</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Coupons List */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-(--color-surface) rounded-2xl p-12 text-center border border-(--color-border)">
          <Ticket className="w-16 h-16 text-(--color-text-disabled) mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No coupons found</h3>
          <p className="text-(--color-text-muted) mb-6">Create your first coupon to offer discounts to customers</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary-hover) transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="bg-(--color-surface) rounded-2xl border border-(--color-border) overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-(--color-border)">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Code</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Discount</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Usage</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Validity</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {filteredCoupons.map((coupon) => {
                  const TypeIcon = discountTypeIcons[coupon.discount_type]
                  const expired = isExpired(coupon)
                  return (
                    <tr key={coupon.id} className="hover:bg-background transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            coupon.discount_type === 'percentage' ? 'bg-(--color-info-bg) text-(--color-info)' :
                            coupon.discount_type === 'fixed_amount' ? 'bg-(--brand-primary-light) text-(--brand-primary)' :
                            'bg-(--color-info-bg) text-(--color-info)'
                          }`}>
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-foreground">{coupon.code}</span>
                              <button
                                onClick={() => copyCode(coupon.code)}
                                className="p-1 text-(--color-text-disabled) hover:text-(--color-text-secondary) rounded"
                                title="Copy code"
                              >
                                {copiedCode === coupon.code ? (
                                  <Check className="w-4 h-4 text-(--brand-primary)" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            {coupon.description && (
                              <p className="text-sm text-(--color-text-muted) truncate max-w-50">{coupon.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-foreground">{formatDiscountValue(coupon)}</span>
                        {coupon.min_order_pence > 0 && (
                          <p className="text-xs text-(--color-text-muted)">Min. {formatPrice(coupon.min_order_pence)}</p>
                        )}
                        {coupon.max_discount_pence && (
                          <p className="text-xs text-(--color-text-muted)">Max. {formatPrice(coupon.max_discount_pence)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-(--color-text-secondary)">
                          <Users className="w-4 h-4" />
                          <span>{coupon.usage_count}</span>
                          {coupon.usage_limit && (
                            <span className="text-(--color-text-disabled)">/ {coupon.usage_limit}</span>
                          )}
                        </div>
                        {coupon.first_order_only && (
                          <p className="text-xs text-(--brand-amber) flex items-center gap-1 mt-1">
                            <ShoppingCart className="w-3 h-3" />
                            First order only
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-(--color-text-secondary)">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(coupon.starts_at).toLocaleDateString()}
                            {coupon.expires_at && (
                              <span> - {new Date(coupon.expires_at).toLocaleDateString()}</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {expired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-(--color-error-bg) text-(--color-error)">
                            Expired
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            coupon.is_active
                              ? 'bg-(--brand-primary-light) text-(--brand-primary)'
                              : 'bg-(--color-elevated) text-(--color-text-secondary)'
                          }`}>
                            {coupon.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {coupon.is_active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleActive(coupon)}
                            className={`p-2 rounded-lg transition-colors ${
                              coupon.is_active
                                ? 'text-(--brand-amber) hover:bg-(--brand-amber-soft)'
                                : 'text-(--brand-primary) hover:bg-(--brand-primary-light)'
                            }`}
                            title={coupon.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {coupon.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-2 text-(--color-text-muted) hover:text-(--color-info) hover:bg-(--color-info-bg) rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="p-2 text-(--color-text-muted) hover:text-(--color-error) hover:bg-(--color-error-bg) rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-(--color-border)">
              <p className="text-sm text-(--color-text-muted)">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2.5 text-sm font-medium text-(--color-text-secondary) bg-(--color-elevated) rounded-lg hover:bg-(--color-border) disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2.5 text-sm font-medium text-(--color-text-secondary) bg-(--color-elevated) rounded-lg hover:bg-(--color-border) disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-(--color-surface) rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-(--color-border)">
              <h2 className="text-xl font-bold text-foreground">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-(--color-text-disabled) hover:text-(--color-text-secondary) rounded-lg hover:bg-(--color-elevated)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Coupon Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary) font-mono uppercase"
                    placeholder="e.g., SAVE20"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-4 py-2.5 bg-(--color-elevated) text-(--color-text-secondary) rounded-xl hover:bg-(--color-border) transition-colors font-medium"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  placeholder="e.g., Summer sale 20% off"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Discount Type *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['percentage', 'fixed_amount', 'free_shipping'] as const).map((type) => {
                    const Icon = discountTypeIcons[type]
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, discount_type: type })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          formData.discount_type === type
                            ? 'border-(--brand-primary) bg-(--brand-primary-light) text-(--brand-primary)'
                            : 'border-(--color-border) hover:border-(--color-border) text-(--color-text-secondary)'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{discountTypeLabels[type]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Discount Value */}
              {formData.discount_type !== 'free_shipping' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-text-muted) font-medium">
                      {formData.discount_type === 'percentage' ? '%' : '£'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                      placeholder={formData.discount_type === 'percentage' ? '20' : '5.00'}
                    />
                  </div>
                  {formData.discount_type === 'percentage' && (
                    <p className="text-xs text-(--color-text-muted) mt-1">Enter a value between 1 and 100</p>
                  )}
                </div>
              )}

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Minimum Order (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-text-muted) font-medium">£</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.min_order_pounds}
                      onChange={(e) => setFormData({ ...formData, min_order_pounds: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {formData.discount_type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Maximum Discount (£)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-text-muted) font-medium">£</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.max_discount_pounds}
                        onChange={(e) => setFormData({ ...formData, max_discount_pounds: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                        placeholder="No limit"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.per_user_limit}
                    onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Validity Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-4 py-2.5 border border-(--color-border) rounded-xl focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  />
                  <p className="text-xs text-(--color-text-muted) mt-1">Leave empty for no expiration</p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">Options</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-background rounded-xl cursor-pointer hover:bg-(--color-elevated) transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.first_order_only}
                      onChange={(e) => setFormData({ ...formData, first_order_only: e.target.checked })}
                      className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary)"
                    />
                    <div>
                      <span className="font-medium text-foreground">First order only</span>
                      <p className="text-xs text-(--color-text-muted)">Only valid for customers making their first purchase</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-background rounded-xl cursor-pointer hover:bg-(--color-elevated) transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.exclude_sale_items}
                      onChange={(e) => setFormData({ ...formData, exclude_sale_items: e.target.checked })}
                      className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary)"
                    />
                    <div>
                      <span className="font-medium text-foreground">Exclude sale items</span>
                      <p className="text-xs text-(--color-text-muted)">Coupon won't apply to products already on sale</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-background rounded-xl cursor-pointer hover:bg-(--color-elevated) transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary)"
                    />
                    <div>
                      <span className="font-medium text-foreground">Active</span>
                      <p className="text-xs text-(--color-text-muted)">Coupon can be used by customers</p>
                    </div>
                  </label>
                </div>
              </div>
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
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary-hover) transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
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
