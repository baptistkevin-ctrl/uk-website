'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Tag,
  X,
  Save,
  Package,
  Percent,
  Calendar,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface Product {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
}

interface Category {
  id: string
  name: string
  slug: string
}

interface MultibuyOffer {
  id: string
  product_id: string | null
  category_id: string | null
  quantity: number
  offer_price_pence: number
  is_active: boolean
  start_date: string | null
  end_date: string | null
  badge_text: string | null
  created_at: string
  product: Product | null
  category: Category | null
}

export default function OffersPage() {
  const [offers, setOffers] = useState<MultibuyOffer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingOffer, setEditingOffer] = useState<MultibuyOffer | null>(null)
  const [saving, setSaving] = useState(false)
  const [offerType, setOfferType] = useState<'product' | 'category'>('product')
  const [formData, setFormData] = useState({
    product_id: '',
    category_id: '',
    quantity: 2,
    offer_price_pounds: '', // Store as string for decimal input (e.g., "5.00")
    badge_text: '',
    is_active: true,
    start_date: '',
    end_date: '',
  })

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/admin/offers')
      const data = await res.json()
      if (Array.isArray(data)) {
        setOffers(data)
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
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

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (Array.isArray(data)) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchOffers()
    fetchProducts()
    fetchCategories()
  }, [])

  const openAddModal = () => {
    setEditingOffer(null)
    setOfferType('product')
    setFormData({
      product_id: '',
      category_id: '',
      quantity: 2,
      offer_price_pounds: '',
      badge_text: '',
      is_active: true,
      start_date: '',
      end_date: '',
    })
    setShowModal(true)
  }

  const openEditModal = (offer: MultibuyOffer) => {
    setEditingOffer(offer)
    setOfferType(offer.product_id ? 'product' : 'category')
    setFormData({
      product_id: offer.product_id || '',
      category_id: offer.category_id || '',
      quantity: offer.quantity,
      offer_price_pounds: (offer.offer_price_pence / 100).toFixed(2), // Convert pence to pounds
      badge_text: offer.badge_text || '',
      is_active: offer.is_active,
      start_date: offer.start_date ? offer.start_date.split('T')[0] : '',
      end_date: offer.end_date ? offer.end_date.split('T')[0] : '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (offerType === 'product' && !formData.product_id) {
      alert('Please select a product')
      return
    }
    if (offerType === 'category' && !formData.category_id) {
      alert('Please select a category')
      return
    }
    if (formData.quantity < 2) {
      alert('Quantity must be at least 2')
      return
    }

    // Convert pounds to pence for validation and saving
    const pricePounds = parseFloat(formData.offer_price_pounds) || 0
    const pricePence = Math.round(pricePounds * 100)

    if (pricePence <= 0) {
      alert('Offer price must be greater than £0.00')
      return
    }

    setSaving(true)
    try {
      const method = editingOffer ? 'PUT' : 'POST'
      const body = {
        ...(editingOffer && { id: editingOffer.id }),
        product_id: offerType === 'product' ? formData.product_id : null,
        category_id: offerType === 'category' ? formData.category_id : null,
        quantity: formData.quantity,
        offer_price_pence: pricePence, // Convert pounds to pence
        badge_text: formData.badge_text || null,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      }

      const res = await fetch('/api/admin/offers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowModal(false)
        fetchOffers()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save offer')
      }
    } catch (error) {
      console.error('Error saving offer:', error)
      alert('Failed to save offer')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return

    try {
      const res = await fetch(`/api/admin/offers?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setOffers(offers.filter((o) => o.id !== id))
      }
    } catch (error) {
      console.error('Error deleting offer:', error)
    }
  }

  const toggleActive = async (offer: MultibuyOffer) => {
    try {
      const res = await fetch('/api/admin/offers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: offer.id,
          is_active: !offer.is_active,
          product_id: offer.product_id,
          quantity: offer.quantity,
          offer_price_pence: offer.offer_price_pence,
        }),
      })
      if (res.ok) {
        setOffers(
          offers.map((o) =>
            o.id === offer.id ? { ...o, is_active: !o.is_active } : o
          )
        )
      }
    } catch (error) {
      console.error('Error toggling offer:', error)
    }
  }

  const generateBadgePreview = () => {
    if (formData.badge_text) return formData.badge_text
    const pricePounds = parseFloat(formData.offer_price_pounds) || 0
    if (formData.quantity && pricePounds > 0) {
      return `${formData.quantity} for £${pricePounds.toFixed(2)}`
    }
    return '2 for £X.XX'
  }

  const calculateSavings = (offer: MultibuyOffer) => {
    if (!offer.product) return null
    const normalPrice = offer.product.price_pence * offer.quantity
    const savings = normalPrice - offer.offer_price_pence
    const savingsPercent = Math.round((savings / normalPrice) * 100)
    return { savings, savingsPercent }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Multi-Buy Offers</h1>
          <p className="text-slate-500 mt-1">Manage "2 for £X" and bundle deals</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25"
        >
          <Plus className="w-5 h-5" />
          Add Offer
        </button>
      </div>

      {/* Offers Grid */}
      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No offers yet</h3>
          <p className="text-slate-500 mb-6">Create your first multi-buy offer to attract customers</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add First Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const savings = calculateSavings(offer)
            return (
              <div
                key={offer.id}
                className={`bg-white rounded-2xl overflow-hidden border ${
                  offer.is_active ? 'border-emerald-200' : 'border-slate-200'
                } shadow-sm hover:shadow-lg transition-all`}
              >
                {/* Product/Category Info */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {offer.product?.image_url ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <Image
                          src={offer.product.image_url}
                          alt={offer.product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {offer.product?.name || offer.category?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {offer.product ? 'Product offer' : 'Category offer'}
                      </p>
                      {offer.product && (
                        <p className="text-sm text-slate-500">
                          Normal: {formatPrice(offer.product.price_pence)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Offer Badge */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white font-bold shadow-lg">
                      <Tag className="w-4 h-4" />
                      {offer.badge_text || `${offer.quantity} for ${formatPrice(offer.offer_price_pence)}`}
                    </div>
                    {savings && savings.savingsPercent > 0 && (
                      <div className="flex items-center gap-1 text-emerald-600 font-medium">
                        <Percent className="w-4 h-4" />
                        Save {savings.savingsPercent}%
                      </div>
                    )}
                  </div>
                  {savings && (
                    <p className="text-sm text-slate-600 mt-2">
                      Customers save {formatPrice(savings.savings)} per {offer.quantity} items
                    </p>
                  )}
                </div>

                {/* Status & Dates */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      offer.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {offer.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {(offer.start_date || offer.end_date) && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {offer.start_date && new Date(offer.start_date).toLocaleDateString()}
                        {offer.start_date && offer.end_date && ' - '}
                        {offer.end_date && new Date(offer.end_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => toggleActive(offer)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        offer.is_active
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {offer.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {offer.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => openEditModal(offer)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(offer.id)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingOffer ? 'Edit Offer' : 'Add New Offer'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Badge Preview */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-500 mb-2">Preview</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white font-bold shadow-lg">
                  <Tag className="w-4 h-4" />
                  {generateBadgePreview()}
                </div>
              </div>

              {/* Offer Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Offer Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOfferType('product')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      offerType === 'product'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Single Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferType('category')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      offerType === 'category'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Category
                  </button>
                </div>
              </div>

              {/* Product/Category Select */}
              {offerType === 'product' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Product *
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatPrice(product.price_pence)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 2 })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., 2"
                  />
                  <p className="text-xs text-slate-500 mt-1">e.g., "2" for £X</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Offer Price (£) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">£</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.offer_price_pounds}
                      onChange={(e) => setFormData({ ...formData, offer_price_pounds: e.target.value })}
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="5.00"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    e.g., 5.00 for £5.00
                  </p>
                </div>
              </div>

              {/* Custom Badge Text */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Custom Badge Text (optional)
                </label>
                <input
                  type="text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Buy 2 Save 20%"
                />
                <p className="text-xs text-slate-500 mt-1">Leave empty to auto-generate</p>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Date (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="text-sm text-slate-700">
                  Offer is active
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingOffer ? 'Update Offer' : 'Create Offer'}
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
