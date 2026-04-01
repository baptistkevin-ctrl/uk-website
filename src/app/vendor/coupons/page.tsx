'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Ticket,
  X,
  Copy,
  Check,
  Percent,
  PoundSterling,
  Truck,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  starts_at: string
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export default function VendorCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount' | 'free_shipping',
    discount_value: '',
    min_order_pounds: '',
    max_discount_pounds: '',
    usage_limit: '',
    per_user_limit: '1',
    starts_at: new Date().toISOString().slice(0, 16),
    expires_at: '',
  })

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/coupons')
      const data = await res.json()
      setCoupons(data.coupons || [])
    } catch (error) {
      console.error('Fetch coupons error:', error)
    }
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_pounds: '',
      max_discount_pounds: '',
      usage_limit: '',
      per_user_limit: '1',
      starts_at: new Date().toISOString().slice(0, 16),
      expires_at: '',
    })
    setEditingCoupon(null)
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    setFormData(prev => ({ ...prev, code }))
  }

  const handleSave = async () => {
    if (!formData.code || !formData.discount_value) return

    setSaving(true)
    try {
      const payload = {
        ...(editingCoupon ? { id: editingCoupon.id } : {}),
        code: formData.code,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: formData.discount_type === 'free_shipping' ? 0 : parseFloat(formData.discount_value),
        min_order_pence: formData.min_order_pounds ? Math.round(parseFloat(formData.min_order_pounds) * 100) : 0,
        max_discount_pence: formData.max_discount_pounds ? Math.round(parseFloat(formData.max_discount_pounds) * 100) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        per_user_limit: parseInt(formData.per_user_limit) || 1,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : new Date().toISOString(),
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      }

      const res = await fetch('/api/vendor/coupons', {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        fetchCoupons()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save coupon')
      }
    } catch (error) {
      alert('Failed to save coupon')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return

    try {
      const res = await fetch(`/api/vendor/coupons?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchCoupons()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const toggleActive = async (coupon: Coupon) => {
    try {
      await fetch('/api/vendor/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
      })
      fetchCoupons()
    } catch (error) {
      console.error('Toggle error:', error)
    }
  }

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_pounds: coupon.min_order_pence ? (coupon.min_order_pence / 100).toString() : '',
      max_discount_pounds: coupon.max_discount_pence ? (coupon.max_discount_pence / 100).toString() : '',
      usage_limit: coupon.usage_limit?.toString() || '',
      per_user_limit: coupon.per_user_limit.toString(),
      starts_at: coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : '',
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
    })
    setShowModal(true)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const discountIcon = (type: string) => {
    if (type === 'percentage') return <Percent className="h-4 w-4" />
    if (type === 'fixed_amount') return <PoundSterling className="h-4 w-4" />
    return <Truck className="h-4 w-4" />
  }

  const discountLabel = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') return `${coupon.discount_value}% off`
    if (coupon.discount_type === 'fixed_amount') return `${formatPrice(coupon.discount_value * 100)} off`
    return 'Free shipping'
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-600">Create discount codes for your store</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Ticket className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons yet</h3>
          <p className="text-gray-500 mb-4">Create your first coupon to attract more customers</p>
          <Button onClick={() => { resetForm(); setShowModal(true) }} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> Create Coupon
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons.map(coupon => {
            const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
            return (
              <div key={coupon.id} className={`bg-white rounded-xl shadow-sm p-5 border ${
                !coupon.is_active || isExpired ? 'border-gray-200 opacity-60' : 'border-gray-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      coupon.discount_type === 'percentage' ? 'bg-blue-100 text-blue-600' :
                      coupon.discount_type === 'fixed_amount' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {discountIcon(coupon.discount_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="font-mono font-bold text-lg text-gray-900 hover:text-emerald-600 flex items-center gap-1"
                        >
                          {coupon.code}
                          {copiedCode === coupon.code ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-gray-400" />
                          )}
                        </button>
                        {!coupon.is_active && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Inactive</span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">Expired</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{discountLabel(coupon)}</p>
                      {coupon.description && <p className="text-xs text-gray-400 mt-0.5">{coupon.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <p className="text-gray-500">Used {coupon.usage_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''} times</p>
                      {coupon.min_order_pence > 0 && (
                        <p className="text-xs text-gray-400">Min order: {formatPrice(coupon.min_order_pence)}</p>
                      )}
                    </div>
                    <button onClick={() => toggleActive(coupon)} className="p-2 hover:bg-gray-100 rounded-lg" title={coupon.is_active ? 'Deactivate' : 'Activate'}>
                      {coupon.is_active ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                    </button>
                    <button onClick={() => openEdit(coupon)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(coupon.id)} className="p-2 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4 text-red-500" />
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
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="SAVE20"
                    className="font-mono"
                  />
                  <Button variant="outline" onClick={generateCode} type="button">Generate</Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="20% off all products"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['percentage', 'fixed_amount', 'free_shipping'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData(prev => ({ ...prev, discount_type: type }))}
                      className={`p-3 rounded-xl border text-sm font-medium text-center transition-colors ${
                        formData.discount_type === type
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {type === 'percentage' ? '% Off' : type === 'fixed_amount' ? '£ Off' : 'Free Ship'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Value */}
              {formData.discount_type !== 'free_shipping' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(£)'}
                  </label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={e => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                    placeholder={formData.discount_type === 'percentage' ? '20' : '5.00'}
                  />
                </div>
              )}

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (£)</label>
                  <Input
                    type="number"
                    value={formData.min_order_pounds}
                    onChange={e => setFormData(prev => ({ ...prev, min_order_pounds: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (£)</label>
                  <Input
                    type="number"
                    value={formData.max_discount_pounds}
                    onChange={e => setFormData(prev => ({ ...prev, max_discount_pounds: e.target.value }))}
                    placeholder="No limit"
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                  <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={e => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
                  <Input
                    type="number"
                    value={formData.per_user_limit}
                    onChange={e => setFormData(prev => ({ ...prev, per_user_limit: e.target.value }))}
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starts At</label>
                  <Input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={e => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                  <Input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={e => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); resetForm() }}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSave}
                disabled={saving || !formData.code}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
