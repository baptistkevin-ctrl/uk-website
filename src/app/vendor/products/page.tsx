'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Download,
  Upload,
  FileSpreadsheet,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils/format'

interface Product {
  id: string
  name: string
  slug: string
  price_pence: number
  compare_at_price_pence: number | null
  stock_quantity: number
  is_active: boolean
  image_url: string | null
  product_categories?: Array<{ categories: { id: string; name: string } | null }> | null
  created_at: string
}

export default function VendorProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())

      if (lines.length < 2) {
        toast.warning('CSV file is empty or has no data rows')
        setImporting(false)
        return
      }

      // Parse CSV headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
      const nameIdx = headers.findIndex(h => h === 'name' || h === 'product name')
      const priceIdx = headers.findIndex(h => h.includes('price') && !h.includes('compare'))
      const compareIdx = headers.findIndex(h => h.includes('compare'))
      const stockIdx = headers.findIndex(h => h.includes('stock'))
      const skuIdx = headers.findIndex(h => h === 'sku')
      const brandIdx = headers.findIndex(h => h === 'brand')
      const descIdx = headers.findIndex(h => h.includes('description') && !h.includes('short'))
      const shortDescIdx = headers.findIndex(h => h.includes('short'))
      const unitIdx = headers.findIndex(h => h === 'unit')
      const organicIdx = headers.findIndex(h => h.includes('organic'))
      const veganIdx = headers.findIndex(h => h.includes('vegan'))

      if (nameIdx === -1) {
        toast.error('CSV must have a "Name" column')
        setImporting(false)
        return
      }

      // Parse rows
      const products = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        const name = cols[nameIdx]
        if (!name) continue

        products.push({
          name,
          price: priceIdx >= 0 ? cols[priceIdx]?.replace('£', '') : '0',
          compare_at_price: compareIdx >= 0 ? cols[compareIdx]?.replace('£', '') : '',
          stock_quantity: stockIdx >= 0 ? cols[stockIdx] : '0',
          sku: skuIdx >= 0 ? cols[skuIdx] : '',
          brand: brandIdx >= 0 ? cols[brandIdx] : '',
          description: descIdx >= 0 ? cols[descIdx] : '',
          short_description: shortDescIdx >= 0 ? cols[shortDescIdx] : '',
          unit: unitIdx >= 0 ? cols[unitIdx] : 'each',
          is_organic: organicIdx >= 0 ? cols[organicIdx] : 'No',
          is_vegan: veganIdx >= 0 ? cols[veganIdx] : 'No',
        })
      }

      if (products.length === 0) {
        toast.warning('No valid products found in CSV')
        setImporting(false)
        return
      }

      const res = await fetch('/api/vendor/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      })

      const result = await res.json()
      if (res.ok) {
        toast.success(`Imported ${result.imported} products${result.errors > 0 ? `, ${result.errors} failed` : ''}`)
        fetchProducts()
      } else {
        toast.error(result.error || 'Import failed')
      }
    } catch (err) {
      toast.error('Failed to process CSV file')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [filter])

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)

      const res = await fetch(`/api/vendor/products?${params}`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Products fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    setActionLoading(productId)
    try {
      const res = await fetch('/api/vendor/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          is_active: !currentStatus
        })
      })

      if (res.ok) {
        setProducts(prev =>
          prev.map(p =>
            p.id === productId ? { ...p, is_active: !currentStatus } : p
          )
        )
      }
    } catch (error) {
      console.error('Toggle error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    setActionLoading(productId)
    try {
      const res = await fetch(`/api/vendor/products?id=${productId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId))
      }
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const bulkToggleActive = async (activate: boolean) => {
    setBulkLoading(true)
    let count = 0
    for (const id of selectedIds) {
      const res = await fetch('/api/vendor/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: activate }),
      })
      if (res.ok) count++
    }
    setProducts(prev =>
      prev.map(p => selectedIds.has(p.id) ? { ...p, is_active: activate } : p)
    )
    setSelectedIds(new Set())
    setBulkLoading(false)
    toast.success(`${count} products ${activate ? 'enabled' : 'disabled'}`)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-(--color-text-secondary)">{products.length} total products</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-(--color-border) bg-(--color-surface) text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={importing} />
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import CSV
          </label>
          <Button
            variant="outline"
            onClick={() => window.open('/api/vendor/products/export', '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Link href="/vendor/products/new">
            <Button className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-(--color-surface) rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-disabled)" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-(--color-border) rounded-lg focus:ring-2 focus:ring-(--brand-primary)"
          >
            <option value="all">All Products</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="low_stock">Low Stock</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-(--brand-primary-light) border border-(--brand-primary)/20 rounded-xl p-4 mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">{selectedIds.size} product{selectedIds.size > 1 ? 's' : ''} selected</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkToggleActive(true)} disabled={bulkLoading}>
              <Eye className="h-4 w-4 mr-1.5" /> Enable
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkToggleActive(false)} disabled={bulkLoading}>
              <EyeOff className="h-4 w-4 mr-1.5" /> Disable
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Products Table */}
      {filteredProducts.length > 0 ? (
        <div className="bg-(--color-surface) rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-background border-b">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase tracking-wider hidden md:table-cell">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase tracking-wider hidden sm:table-cell">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-(--color-text-muted) uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-background">
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 text-(--brand-primary) border-(--color-border) rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-(--color-elevated) rounded-lg overflow-hidden shrink-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-(--color-text-disabled)" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <span className="text-sm text-(--color-text-secondary)">
                      {product.product_categories?.[0]?.categories?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {product.compare_at_price_pence ? (
                        <>
                          <span className="font-medium text-(--brand-primary)">
                            {formatPrice(product.price_pence)}
                          </span>
                          <span className="text-sm text-(--color-text-disabled) line-through ml-2">
                            {formatPrice(product.compare_at_price_pence)}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-foreground">
                          {formatPrice(product.price_pence)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className={`text-sm ${
                      product.stock_quantity === 0 ? 'text-(--color-error) font-medium' :
                      product.stock_quantity < 10 ? 'text-(--color-warning)' :
                      'text-(--color-text-secondary)'
                    }`}>
                      {product.stock_quantity}
                      {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                        <AlertCircle className="h-3 w-3 inline ml-1" />
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleProductStatus(product.id, product.is_active)}
                      disabled={actionLoading === product.id}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_active
                          ? 'bg-(--brand-primary-light) text-(--brand-primary)'
                          : 'bg-(--color-elevated) text-(--color-text-secondary)'
                      }`}
                    >
                      {actionLoading === product.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : product.is_active ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      {product.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/vendor/products/${product.id}/edit`}
                        className="p-2 text-(--color-text-secondary) hover:text-(--brand-primary) hover:bg-(--brand-primary-light) rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        disabled={actionLoading === product.id}
                        className="p-2 text-(--color-text-secondary) hover:text-(--color-error) hover:bg-(--color-error-bg) rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-(--color-surface) rounded-xl shadow-sm p-12 text-center">
          <Package className="h-16 w-16 mx-auto text-(--color-text-disabled) mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Products Yet</h3>
          <p className="text-(--color-text-secondary) mb-6">
            Start adding products to your store to reach customers.
          </p>
          <Link href="/vendor/products/new">
            <Button className="bg-(--brand-primary) hover:bg-(--brand-primary-hover) transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
