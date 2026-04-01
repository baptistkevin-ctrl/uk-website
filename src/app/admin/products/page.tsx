'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Plus,
  Package,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Download,
  Upload,
  FileSpreadsheet,
  ImagePlus,
} from 'lucide-react'

import ProductStatsCards from './_components/ProductStatsCards'
import ProductToolbar from './_components/ProductToolbar'
import ProductGrid from './_components/ProductGrid'
import ProductTable from './_components/ProductTable'
import ProductPagination from './_components/ProductPagination'
import BulkActionsBar from './_components/BulkActionsBar'
import BulkImageUploadModal from './_components/BulkImageUploadModal'
import {
  exportProducts,
  importProducts,
  downloadTemplate,
  bulkImageUpload,
} from './_components/useProductImportExport'

interface Product {
  id: string
  name: string
  slug: string
  sku: string | null
  brand: string | null
  description: string | null
  price_pence: number
  cost_price_pence: number | null
  compare_at_price_pence: number | null
  stock_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  image_url: string | null
  images: string[] | null
  is_active: boolean
  is_featured: boolean
  category_id: string | null
  vendor_id: string | null
  vendors: { id: string; store_name: string } | null
  unit: string | null
  weight_grams: number | null
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [bulkUploadResults, setBulkUploadResults] = useState<{matched: number, notFound: string[], total: number} | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 50
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/products?includeInactive=true')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const refreshProducts = async () => {
    const res = await fetch('/api/products?includeInactive=true')
    const data = await res.json()
    if (Array.isArray(data)) setProducts(data)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setDeleting(id)
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts(products.filter((p) => p.id !== id))
      setSelectedProducts(prev => { const s = new Set(prev); s.delete(id); return s })
    }
    setDeleting(null)
  }

  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => {
      const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s
    })
  }

  const toggleSelectAll = () => {
    const ids = paginatedProducts.map(p => p.id)
    const allSelected = ids.every(id => selectedProducts.has(id))
    setSelectedProducts(prev => {
      const s = new Set(prev)
      ids.forEach(id => allSelected ? s.delete(id) : s.add(id))
      return s
    })
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)? This action cannot be undone.`)) return
    setBulkDeleting(true)
    let ok = 0, fail = 0
    for (const id of selectedProducts) {
      try { const r = await fetch(`/api/products/${id}`, { method: 'DELETE' }); r.ok ? ok++ : fail++ } catch { fail++ }
    }
    await refreshProducts()
    setSelectedProducts(new Set())
    setBulkDeleting(false)
    alert(`Deleted ${ok} product(s)${fail > 0 ? `, ${fail} failed` : ''}`)
  }

  const handleExport = () => exportProducts(products, setExporting)
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => importProducts(e, setImporting, refreshProducts, fileInputRef)
  const handleDownloadTemplate = () => downloadTemplate()
  const handleBulkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => bulkImageUpload(e, products, setBulkUploading, setBulkUploadResults, refreshProducts, bulkImageInputRef)

  const filteredProducts = products
    .filter((p) => {
      if (filter === 'active') return p.is_active
      if (filter === 'inactive') return !p.is_active
      if (filter === 'low-stock') return p.stock_quantity <= p.low_stock_threshold
      if (filter === 'featured') return p.is_featured
      return true
    })
    .filter((p) =>
      searchQuery
        ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )

  useEffect(() => { setCurrentPage(1) }, [filter, searchQuery])

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
  const isAllPageSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProducts.has(p.id))

  const stats = {
    total: products.length,
    active: products.filter((p) => p.is_active).length,
    inactive: products.filter((p) => !p.is_active).length,
    lowStock: products.filter((p) => p.stock_quantity <= p.low_stock_threshold).length,
  }

  const filterButtons = [
    { key: 'all', label: 'All Products', count: stats.total, icon: Package },
    { key: 'active', label: 'Active', count: stats.active, icon: CheckCircle2 },
    { key: 'inactive', label: 'Inactive', count: stats.inactive, icon: XCircle },
    { key: 'low-stock', label: 'Low Stock', count: stats.lowStock, icon: AlertTriangle },
    { key: 'featured', label: 'Featured', count: products.filter(p => p.is_featured).length, icon: Star },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-slate-500 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleExport} disabled={exporting || products.length === 0} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export Excel
          </button>
          <div className="relative">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" id="import-file" />
            <label htmlFor="import-file" className={`inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import Excel
            </label>
          </div>
          <button onClick={handleDownloadTemplate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all" title="Download import template">
            <FileSpreadsheet className="w-4 h-4" />
            Template
          </button>
          <button onClick={() => setShowBulkUploadModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all" title="Bulk upload images">
            <ImagePlus className="w-4 h-4" />
            Bulk Images
          </button>
          <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40">
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
        </div>
      </div>

      <ProductStatsCards stats={stats} loading={loading} />

      <ProductToolbar
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        filter={filter} onFilterChange={setFilter}
        filterButtons={filterButtons}
        viewMode={viewMode} onViewModeChange={setViewMode}
      />

      <BulkActionsBar
        selectedCount={selectedProducts.size} bulkDeleting={bulkDeleting}
        onClearSelection={() => setSelectedProducts(new Set())} onBulkDelete={handleBulkDelete}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <p className="text-slate-500">Loading products...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No products found</h3>
          <p className="text-slate-500 mb-6">
            {searchQuery ? 'Try a different search term' : 'Get started by adding your first product'}
          </p>
          <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <ProductGrid products={paginatedProducts} selectedProducts={selectedProducts}
          deleting={deleting} onToggleSelection={toggleProductSelection} onDelete={handleDelete} />
      ) : (
        <ProductTable products={paginatedProducts} selectedProducts={selectedProducts}
          isAllPageSelected={isAllPageSelected} deleting={deleting}
          onToggleSelection={toggleProductSelection} onToggleSelectAll={toggleSelectAll} onDelete={handleDelete} />
      )}

      {!loading && filteredProducts.length > 0 && totalPages > 1 && (
        <ProductPagination currentPage={currentPage} totalPages={totalPages}
          startIndex={startIndex} endIndex={endIndex}
          totalItems={filteredProducts.length} onPageChange={setCurrentPage} />
      )}

      <input ref={bulkImageInputRef} type="file" accept="image/*" multiple onChange={handleBulkImageUpload} className="hidden" id="bulk-image-input" />

      <BulkImageUploadModal show={showBulkUploadModal} uploading={bulkUploading} results={bulkUploadResults}
        onClose={() => { setShowBulkUploadModal(false); setBulkUploadResults(null) }}
        onSelectFiles={() => bulkImageInputRef.current?.click()} />
    </div>
  )
}
