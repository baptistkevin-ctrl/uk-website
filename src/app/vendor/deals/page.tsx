'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Zap,
  X,
  Calendar,
  Package,
  Timer,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  description: string | null
  product_id: string
  deal_price_pence: number
  original_price_pence: number
  starts_at: string
  ends_at: string
  max_quantity: number | null
  claimed_quantity: number
  is_active: boolean
  created_at: string
  products: Product | null
}

export default function VendorDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
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
  })

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/deals')
      if (!res.ok) {
        toast.error('Failed to load deals')
        return
      }
      const data = await res.json()
      setDeals(data.deals || [])
      setProducts(data.products || [])
    } catch {
      toast.error('Failed to load deals')
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      product_id: '',
      deal_price_pounds: '',
      starts_at: new Date().toISOString().slice(0, 16),
      ends_at: '',
      max_quantity: '',
    })
    setEditingDeal(null)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.product_id || !formData.deal_price_pounds || !formData.starts_at || !formData.ends_at) {
      toast.warning('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...(editingDeal ? { id: editingDeal.id } : {}),
        title: formData.title,
        description: formData.description,
        product_id: formData.product_id,
        deal_price_pence: Math.round(parseFloat(formData.deal_price_pounds) * 100),
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
        max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : null,
      }

      const res = await fetch('/api/vendor/deals', {
        method: editingDeal ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        fetchDeals()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save deal')
      }
    } catch (error) {
      toast.error('Failed to save deal')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this deal?')) return
    try {
      await fetch(`/api/vendor/deals?id=${id}`, { method: 'DELETE' })
      fetchDeals()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const toggleActive = async (deal: Deal) => {
    try {
      await fetch('/api/vendor/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deal.id, is_active: !deal.is_active }),
      })
      fetchDeals()
    } catch (error) {
      console.error('Toggle error:', error)
    }
  }

  const openEdit = (deal: Deal) => {
    setEditingDeal(deal)
    setFormData({
      title: deal.title,
      description: deal.description || '',
      product_id: deal.product_id,
      deal_price_pounds: (deal.deal_price_pence / 100).toFixed(2),
      starts_at: new Date(deal.starts_at).toISOString().slice(0, 16),
      ends_at: new Date(deal.ends_at).toISOString().slice(0, 16),
      max_quantity: deal.max_quantity?.toString() || '',
    })
    setShowModal(true)
  }

  const getDealStatus = (deal: Deal) => {
    const now = new Date()
    const start = new Date(deal.starts_at)
    const end = new Date(deal.ends_at)
    if (!deal.is_active) return { label: 'Inactive', color: 'bg-(--color-elevated) text-(--color-text-secondary)' }
    if (now < start) return { label: 'Upcoming', color: 'bg-(--color-info-bg) text-(--color-info)' }
    if (now > end) return { label: 'Ended', color: 'bg-(--color-error-bg) text-(--color-error)' }
    return { label: 'Active', color: 'bg-(--brand-primary-light) text-(--brand-primary)' }
  }

  const selectedProduct = products.find(p => p.id === formData.product_id)
  const savings = selectedProduct && formData.deal_price_pounds
    ? selectedProduct.price_pence - Math.round(parseFloat(formData.deal_price_pounds) * 100)
    : 0

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flash Deals</h1>
          <p className="text-(--color-text-secondary)">Create time-limited deals on your products</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
          disabled={products.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Deal
        </Button>
      </div>

      {/* Deals List */}
      {deals.length === 0 ? (
        <div className="bg-(--color-surface) rounded-xl shadow-sm p-12 text-center border border-(--color-border)">
          <Zap className="h-12 w-12 mx-auto text-(--color-text-disabled) mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No deals yet</h3>
          <p className="text-(--color-text-muted) mb-4">
            {products.length === 0
              ? 'Add products first to create deals'
              : 'Create flash deals to boost your sales'}
          </p>
          {products.length > 0 && (
            <Button onClick={() => { resetForm(); setShowModal(true) }} className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors">
              <Plus className="h-4 w-4 mr-2" /> Create Deal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {deals.map(deal => {
            const status = getDealStatus(deal)
            const discount = deal.original_price_pence > 0
              ? Math.round((1 - deal.deal_price_pence / deal.original_price_pence) * 100)
              : 0

            return (
              <div key={deal.id} className="bg-(--color-surface) rounded-xl shadow-sm p-5 border border-(--color-border)">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {deal.products?.image_url ? (
                      <Image
                        src={deal.products.image_url}
                        alt={deal.products.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-(--color-elevated) rounded-xl flex items-center justify-center">
                        <Package className="h-6 w-6 text-(--color-text-disabled)" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{deal.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        {discount > 0 && (
                          <span className="px-2 py-0.5 bg-(--color-error-bg) text-(--color-error) text-xs rounded-full font-bold">
                            -{discount}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-(--color-text-muted)">{deal.products?.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="font-bold text-(--brand-primary)">{formatPrice(deal.deal_price_pence)}</span>
                        <span className="line-through text-(--color-text-disabled)">{formatPrice(deal.original_price_pence)}</span>
                        <span className="text-(--color-text-disabled) flex items-center gap-1">
                          <Timer className="h-3.5 w-3.5" />
                          {new Date(deal.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' - '}
                          {new Date(deal.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                        {deal.max_quantity && (
                          <span className="text-(--color-text-disabled)">
                            {deal.claimed_quantity}/{deal.max_quantity} claimed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(deal)} className="p-2 hover:bg-(--color-elevated) rounded-lg">
                      {deal.is_active ? <Eye className="h-4 w-4 text-(--brand-primary)" /> : <EyeOff className="h-4 w-4 text-(--color-text-disabled)" />}
                    </button>
                    <button onClick={() => openEdit(deal)} className="p-2 hover:bg-(--color-elevated) rounded-lg">
                      <Pencil className="h-4 w-4 text-(--color-text-muted)" />
                    </button>
                    <button onClick={() => handleDelete(deal.id)} className="p-2 hover:bg-(--color-error-bg) rounded-lg">
                      <Trash2 className="h-4 w-4 text-(--color-error)" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-(--color-surface) rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {editingDeal ? 'Edit Deal' : 'Create Flash Deal'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="p-2 hover:bg-(--color-elevated) rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Deal Title *</label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Weekend Special - 30% off"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Limited time offer on selected products"
                />
              </div>

              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Product *</label>
                <select
                  value={formData.product_id}
                  onChange={e => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
                >
                  <option value="">Select a product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatPrice(p.price_pence)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deal Price */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Deal Price (£) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.deal_price_pounds}
                  onChange={e => setFormData(prev => ({ ...prev, deal_price_pounds: e.target.value }))}
                  placeholder="9.99"
                />
                {selectedProduct && formData.deal_price_pounds && savings > 0 && (
                  <p className="text-sm text-(--brand-primary) mt-1">
                    Customers save {formatPrice(savings)} ({Math.round((savings / selectedProduct.price_pence) * 100)}% off)
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Starts *</label>
                  <Input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={e => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Ends *</label>
                  <Input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={e => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                  />
                </div>
              </div>

              {/* Max Quantity */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Max Quantity (optional)</label>
                <Input
                  type="number"
                  value={formData.max_quantity}
                  onChange={e => setFormData(prev => ({ ...prev, max_quantity: e.target.value }))}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); resetForm() }}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingDeal ? 'Update Deal' : 'Create Deal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
