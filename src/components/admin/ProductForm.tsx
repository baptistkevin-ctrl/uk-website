'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import ImageUploader from './ImageUploader'

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id?: string
  name: string
  slug: string
  description: string
  short_description: string
  sku: string
  barcode: string
  price_pence: number
  compare_at_price_pence: number | null
  cost_price_pence: number | null
  stock_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  allow_backorder: boolean
  unit: string
  unit_value: number | null
  brand: string
  is_vegan: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  is_organic: boolean
  image_url: string
  images: string[]
  is_active: boolean
  is_featured: boolean
  meta_title: string
  meta_description: string
}

interface ProductFormProps {
  product?: Product
  isEditing?: boolean
}

const UNITS = ['each', 'pack', 'bag', 'bunch', 'bottle', 'box', 'kg', 'g', 'l', 'ml']

export default function ProductForm({ product, isEditing = false }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])

  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    short_description: product?.short_description || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    price_pence: product?.price_pence || 0,
    compare_at_price_pence: product?.compare_at_price_pence || null,
    cost_price_pence: product?.cost_price_pence || null,
    stock_quantity: product?.stock_quantity || 0,
    low_stock_threshold: product?.low_stock_threshold || 10,
    track_inventory: product?.track_inventory ?? true,
    allow_backorder: product?.allow_backorder ?? false,
    unit: product?.unit || 'each',
    unit_value: product?.unit_value || null,
    brand: product?.brand || '',
    is_vegan: product?.is_vegan ?? false,
    is_vegetarian: product?.is_vegetarian ?? false,
    is_gluten_free: product?.is_gluten_free ?? false,
    is_organic: product?.is_organic ?? false,
    image_url: product?.image_url || '',
    images: product?.images || [],
    is_active: product?.is_active ?? true,
    is_featured: product?.is_featured ?? false,
    meta_title: product?.meta_title || '',
    meta_description: product?.meta_description || '',
  })

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data)
        }
      })
      .catch(() => {})
  }, [])

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEditing && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [formData.name, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = isEditing ? `/api/products/${product?.id}` : '/api/products'
      const method = isEditing ? 'PUT' : 'POST'

      // Set image_url from first image if not set
      const dataToSend = {
        ...formData,
        image_url: formData.image_url || formData.images[0] || '',
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save product')
      }

      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? value === '' ? null : parseFloat(value)
          : type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }))
  }

  const handleImagesChange = (images: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
      image_url: images[0] || prev.image_url,
    }))
  }

  // Convert pence to pounds for display
  const penceToPounds = (pence: number | null) => {
    if (pence === null || pence === undefined) return ''
    return (pence / 100).toFixed(2)
  }

  // Convert pounds to pence for storage
  const poundsToPence = (pounds: string) => {
    const num = parseFloat(pounds)
    return isNaN(num) ? 0 : Math.round(num * 100)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Organic Bananas"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="organic-bananas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Fresh Farm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <input
              type="text"
              name="short_description"
              value={formData.short_description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Brief product description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Detailed product description..."
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (GBP) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">£</span>
              <input
                type="number"
                value={penceToPounds(formData.price_pence)}
                onChange={(e) => setFormData(prev => ({ ...prev, price_pence: poundsToPence(e.target.value) }))}
                required
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compare at Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">£</span>
              <input
                type="number"
                value={penceToPounds(formData.compare_at_price_pence)}
                onChange={(e) => setFormData(prev => ({ ...prev, compare_at_price_pence: e.target.value ? poundsToPence(e.target.value) : null }))}
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">£</span>
              <input
                type="number"
                value={penceToPounds(formData.cost_price_pence)}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price_pence: e.target.value ? poundsToPence(e.target.value) : null }))}
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., ORG-BAN-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 5012345678901"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity
            </label>
            <input
              type="number"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Threshold
            </label>
            <input
              type="number"
              name="low_stock_threshold"
              value={formData.low_stock_threshold}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="track_inventory"
              checked={formData.track_inventory}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Track inventory</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="allow_backorder"
              checked={formData.allow_backorder}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Allow backorders</span>
          </label>
        </div>
      </div>

      {/* Dietary Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dietary Information</h2>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_vegan"
              checked={formData.is_vegan}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Vegan</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_vegetarian"
              checked={formData.is_vegetarian}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Vegetarian</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_gluten_free"
              checked={formData.is_gluten_free}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Gluten Free</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_organic"
              checked={formData.is_organic}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Organic</span>
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
        <ImageUploader
          images={formData.images}
          onChange={handleImagesChange}
          maxImages={5}
        />
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Active (visible on website)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Featured product</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {isEditing ? 'Update Product' : 'Add Product'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
