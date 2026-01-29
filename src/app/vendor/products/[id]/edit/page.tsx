'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  Plus,
  ImageIcon,
  Package,
  DollarSign,
  Tag,
  Info,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  compare_at_price: number | null
  category_id: string | null
  sku: string | null
  barcode: string | null
  stock_quantity: number
  low_stock_threshold: number
  weight: number | null
  unit: string
  image_url: string | null
  images: string[]
  is_active: boolean
  is_organic: boolean
  is_gluten_free: boolean
  is_vegan: boolean
  is_vegetarian: boolean
}

export default function EditVendorProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    sku: '',
    barcode: '',
    stock_quantity: '0',
    low_stock_threshold: '10',
    weight: '',
    unit: 'each',
    is_active: true,
    is_organic: false,
    is_gluten_free: false,
    is_vegan: false,
    is_vegetarian: false,
  })

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id])

  const fetchData = async () => {
    try {
      // Fetch categories
      const catRes = await fetch('/api/categories')
      const catData = await catRes.json()
      if (Array.isArray(catData)) {
        setCategories(catData)
      }

      // Fetch product
      const prodRes = await fetch(`/api/vendor/products`)
      const prodData = await prodRes.json()
      const product = prodData.products?.find((p: Product) => p.id === resolvedParams.id)

      if (product) {
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: (product.price / 100).toFixed(2),
          compare_at_price: product.compare_at_price ? (product.compare_at_price / 100).toFixed(2) : '',
          category_id: product.category_id || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          stock_quantity: String(product.stock_quantity || 0),
          low_stock_threshold: String(product.low_stock_threshold || 10),
          weight: product.weight ? String(product.weight) : '',
          unit: product.unit || 'each',
          is_active: product.is_active ?? true,
          is_organic: product.is_organic || false,
          is_gluten_free: product.is_gluten_free || false,
          is_vegan: product.is_vegan || false,
          is_vegetarian: product.is_vegetarian || false,
        })
        setImages(product.images || (product.image_url ? [product.image_url] : []))
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/vendor/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resolvedParams.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          category_id: formData.category_id || null,
          sku: formData.sku || null,
          barcode: formData.barcode || null,
          stock_quantity: parseInt(formData.stock_quantity),
          low_stock_threshold: parseInt(formData.low_stock_threshold),
          weight: formData.weight ? parseFloat(formData.weight) : null,
          unit: formData.unit,
          image_url: images[0] || null,
          images,
          is_active: formData.is_active,
          is_organic: formData.is_organic,
          is_gluten_free: formData.is_gluten_free,
          is_vegan: formData.is_vegan,
          is_vegetarian: formData.is_vegetarian,
        })
      })

      if (res.ok) {
        router.push('/vendor/products')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update product')
      }
    } catch (error) {
      alert('Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/vendor/products?id=${resolvedParams.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        router.push('/vendor/products')
      } else {
        alert('Failed to delete product')
      }
    } catch (error) {
      alert('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addImageUrl = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      setImages(prev => [...prev, url])
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/vendor/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-600">Update your product details</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Basic Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={4}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => updateField('category_id', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Images</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 px-2 py-1 bg-emerald-600 text-white text-xs rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                >
                  <Plus className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-500">Add Image</span>
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Pricing</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (£) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="compare_at_price">Compare at Price (£)</Label>
                  <Input
                    id="compare_at_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.compare_at_price}
                    onChange={(e) => updateField('compare_at_price', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => updateField('unit', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="each">Each</option>
                    <option value="kg">Per kg</option>
                    <option value="100g">Per 100g</option>
                    <option value="litre">Per litre</option>
                    <option value="pack">Per pack</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="weight">Weight (g)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Tag className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Inventory</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => updateField('barcode', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => updateField('stock_quantity', e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => updateField('low_stock_threshold', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Status</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-gray-700">Product is active</span>
              </label>
            </div>

            {/* Dietary Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Info className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Dietary Info</h2>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'is_organic', label: 'Organic' },
                  { key: 'is_gluten_free', label: 'Gluten Free' },
                  { key: 'is_vegan', label: 'Vegan' },
                  { key: 'is_vegetarian', label: 'Vegetarian' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[key as keyof typeof formData] as boolean}
                      onChange={(e) => updateField(key, e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Link href="/vendor/products">
                <Button type="button" variant="outline" className="w-full mt-3">
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
