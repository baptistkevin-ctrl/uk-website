'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  Plus,
  ImageIcon,
  Package,
  DollarSign,
  Tag,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarcodeGenerator } from '@/components/barcode/BarcodeGenerator'
import { BarcodeScanner } from '@/components/barcode/BarcodeScanner'
import { Label } from '@/components/ui/label'

interface Category {
  id: string
  name: string
  slug: string
}

export default function NewVendorProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<string[]>([])
  const [scannerOpen, setScannerOpen] = useState(false)
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
    is_organic: false,
    is_gluten_free: false,
    is_vegan: false,
    is_vegetarian: false,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (Array.isArray(data)) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const productData = {
        ...formData,
        price_pence: Math.round(parseFloat(formData.price) * 100),
        compare_at_price_pence: formData.compare_at_price
          ? Math.round(parseFloat(formData.compare_at_price) * 100)
          : null,
        stock_quantity: parseInt(formData.stock_quantity),
        low_stock_threshold: parseInt(formData.low_stock_threshold),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images,
        image_url: images[0] || null,
      }

      const res = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      if (res.ok) {
        toast.success('Product created successfully!')
        router.push('/vendor/products')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create product')
      }
    } catch (error) {
      toast.error('Failed to create product')
    } finally {
      setLoading(false)
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

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/vendor/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Product</h1>
          <p className="text-(--color-text-secondary)">Create a new product listing</p>
        </div>
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
                    placeholder="e.g., Organic Bananas"
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
                    placeholder="Describe your product..."
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => updateField('category_id', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary) focus:border-(--brand-primary)"
                    required
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
                    <img src={url} alt="" className="w-full h-full object-cover" />
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
              <p className="mt-3 text-sm text-(--color-text-muted)">
                First image will be used as the main product image
              </p>
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
                    placeholder="0.00"
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
                    placeholder="Original price for sale items"
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
                    placeholder="Product weight"
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
                    placeholder="Stock keeping unit"
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
                          const res = await fetch(`/api/barcode/generate?productId=${Date.now()}`)
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
                </div>

                {/* Barcode Scanner Modal */}
                {scannerOpen && (
                  <BarcodeScanner
                    onScan={(code) => {
                      updateField('barcode', code)
                      setScannerOpen(false)
                    }}
                    onClose={() => setScannerOpen(false)}
                  />
                )}
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
                disabled={loading}
                className="w-full bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Product
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
