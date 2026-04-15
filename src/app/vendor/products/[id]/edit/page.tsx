'use client'

import { useState, useEffect, use } from 'react'
import { toast } from '@/hooks/use-toast'
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
  Trash2,
  Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarcodeGenerator } from '@/components/barcode/BarcodeGenerator'
import { BarcodeScanner } from '@/components/barcode/BarcodeScanner'

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
  const [scannerOpen, setScannerOpen] = useState(false)
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
        // Get category from product_categories join
        const categoryId = product.product_categories?.[0]?.categories?.id || ''
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: (product.price_pence / 100).toFixed(2),
          compare_at_price: product.compare_at_price_pence ? (product.compare_at_price_pence / 100).toFixed(2) : '',
          category_id: categoryId,
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
          price_pence: Math.round(parseFloat(formData.price) * 100),
          compare_at_price_pence: formData.compare_at_price ? Math.round(parseFloat(formData.compare_at_price) * 100) : null,
          sku: formData.sku?.trim() || null,
          barcode: formData.barcode?.trim() || null,
          stock_quantity: parseInt(formData.stock_quantity),
          low_stock_threshold: parseInt(formData.low_stock_threshold),
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
        toast.success('Product updated successfully!')
        router.push('/vendor/products')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update product')
      }
    } catch (error) {
      toast.error('Failed to update product')
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
        toast.error('Failed to delete product')
      }
    } catch (error) {
      toast.error('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (res.ok) {
        const { url } = await res.json()
        setImages(prev => [...prev, url])
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to upload image')
      }
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-(--brand-primary)" />
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
            <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
            <p className="text-(--color-text-secondary)">Update your product details</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleting}
          className="text-(--color-error) border-(--color-border) hover:bg-(--color-error-bg)"
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
            <div className="bg-(--color-surface) rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-(--brand-primary-light) rounded-lg">
                  <Package className="h-5 w-5 text-(--brand-primary)" />
                </div>
                <h2 className="font-semibold text-foreground">Basic Information</h2>
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
                    className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => updateField('category_id', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
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
            <div className="bg-(--color-surface) rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-(--color-info-bg) rounded-lg">
                  <ImageIcon className="h-5 w-5 text-(--color-info)" />
                </div>
                <h2 className="font-semibold text-foreground">Images</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square bg-(--color-elevated) rounded-lg overflow-hidden group">
                    <img src={url} alt={formData.name || "Product image"} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-(--color-error) text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 px-2 py-1 bg-(--brand-primary) text-white text-xs rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
                <label
                  className={`aspect-square border-2 border-dashed border-(--color-border) rounded-lg flex flex-col items-center justify-center gap-2 hover:border-(--brand-primary) hover:bg-(--brand-primary-light) transition-colors cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-(--brand-primary) animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 text-(--color-text-disabled)" />
                  )}
                  <span className="text-sm text-(--color-text-muted)">{uploading ? 'Uploading...' : 'Upload Image'}</span>
                </label>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-(--color-surface) rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-(--color-info-bg) rounded-lg">
                  <DollarSign className="h-5 w-5 text-(--color-info)" />
                </div>
                <h2 className="font-semibold text-foreground">Pricing</h2>
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
                    className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
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
            <div className="bg-(--color-surface) rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-(--color-warning-bg) rounded-lg">
                  <Tag className="h-5 w-5 text-(--brand-amber)" />
                </div>
                <h2 className="font-semibold text-foreground">Inventory</h2>
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
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={(e) => updateField('barcode', e.target.value)}
                      className="flex-1"
                      placeholder="UPC, EAN, etc."
                    />
                    <button
                      type="button"
                      onClick={() => setScannerOpen(true)}
                      className="shrink-0 h-10 px-3 rounded-lg border border-(--color-border) bg-(--color-surface) text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors text-xs font-medium"
                    >
                      📷 Scan
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/barcode/generate?productId=${resolvedParams.id}`)
                          const data = await res.json()
                          if (data.barcode) updateField('barcode', data.barcode)
                        } catch {}
                      }}
                      className="shrink-0 h-10 px-3 rounded-lg border border-(--color-border) bg-(--color-surface) text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors text-xs font-medium"
                    >
                      Generate
                    </button>
                  </div>
                  {formData.barcode && (
                    <div className="mt-2">
                      <BarcodeGenerator value={formData.barcode} format="CODE128" height={50} showValue />
                    </div>
                  )}
                  {scannerOpen && (
                    <BarcodeScanner
                      onScan={(code) => { updateField('barcode', code); setScannerOpen(false) }}
                      onClose={() => setScannerOpen(false)}
                    />
                  )}
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
            <div className="bg-(--color-surface) rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-foreground mb-4">Status</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                  className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary)"
                />
                <span className="text-foreground">Product is active</span>
              </label>
            </div>

            {/* Dietary Info */}
            <div className="bg-(--color-surface) rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-(--brand-primary-light) rounded-lg">
                  <Info className="h-5 w-5 text-(--brand-primary)" />
                </div>
                <h2 className="font-semibold text-foreground">Dietary Info</h2>
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
                      className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded focus:ring-(--brand-primary)"
                    />
                    <span className="text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-(--color-surface) rounded-xl shadow-sm p-6">
              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
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
