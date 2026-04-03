'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Loader2,
  ShoppingBag,
  Search,
  Filter,
  Grid3X3,
  List,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  MoreVertical,
  Eye,
  Copy,
  Archive,
  Download,
  Upload,
  FileSpreadsheet,
  ImagePlus,
  X,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import * as XLSX from 'xlsx'

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
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    setDeleting(id)
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts(products.filter((p) => p.id !== id))
      setSelectedProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
    setDeleting(null)
  }

  // Toggle single product selection
  const toggleProductSelection = (id: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Select/deselect all products on current page
  const toggleSelectAll = () => {
    const pageProductIds = paginatedProducts.map(p => p.id)
    const allSelected = pageProductIds.every(id => selectedProducts.has(id))

    if (allSelected) {
      // Deselect all on current page
      setSelectedProducts(prev => {
        const newSet = new Set(prev)
        pageProductIds.forEach(id => newSet.delete(id))
        return newSet
      })
    } else {
      // Select all on current page
      setSelectedProducts(prev => {
        const newSet = new Set(prev)
        pageProductIds.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }

  // Bulk delete selected products
  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)? This action cannot be undone.`)) return

    setBulkDeleting(true)
    let successCount = 0
    let errorCount = 0

    for (const id of selectedProducts) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
        if (res.ok) {
          successCount++
        } else {
          errorCount++
        }
      } catch {
        errorCount++
      }
    }

    // Refresh products list
    const res = await fetch('/api/products?includeInactive=true')
    const data = await res.json()
    if (Array.isArray(data)) {
      setProducts(data)
    }

    setSelectedProducts(new Set())
    setBulkDeleting(false)

    alert(`Deleted ${successCount} product(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`)
  }

  // Export products to Excel
  const handleExport = () => {
    setExporting(true)
    try {
      // Prepare data for export
      const exportData = products.map((product) => ({
        'Name': product.name,
        'SKU': product.sku || '',
        'Brand': product.brand || '',
        'Description': product.description || '',
        'Price (£)': (product.price_pence / 100).toFixed(2),
        'Cost Price (£)': product.cost_price_pence ? (product.cost_price_pence / 100).toFixed(2) : '',
        'Compare At Price (£)': product.compare_at_price_pence ? (product.compare_at_price_pence / 100).toFixed(2) : '',
        'Stock Quantity': product.stock_quantity,
        'Low Stock Threshold': product.low_stock_threshold,
        'Track Inventory': product.track_inventory ? 'Yes' : 'No',
        'Unit': product.unit || '',
        'Weight (g)': product.weight_grams || '',
        'Active': product.is_active ? 'Yes' : 'No',
        'Featured': product.is_featured ? 'Yes' : 'No',
        'Image URL': product.image_url || '',
        'Slug': product.slug,
        'ID': product.id,
      }))

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      ws['!cols'] = [
        { wch: 30 }, // Name
        { wch: 15 }, // SKU
        { wch: 15 }, // Brand
        { wch: 40 }, // Description
        { wch: 12 }, // Price
        { wch: 15 }, // Cost Price
        { wch: 18 }, // Compare At Price
        { wch: 15 }, // Stock
        { wch: 18 }, // Low Stock
        { wch: 15 }, // Track Inventory
        { wch: 10 }, // Unit
        { wch: 12 }, // Weight
        { wch: 10 }, // Active
        { wch: 10 }, // Featured
        { wch: 50 }, // Image URL
        { wch: 25 }, // Slug
        { wch: 40 }, // ID
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Products')

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0]
      const filename = `products_export_${date}.xlsx`

      // Download file
      XLSX.writeFile(wb, filename)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export products')
    }
    setExporting(false)
  }

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100) + '-' + Date.now().toString(36)
  }

  // Import products from Excel
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const data = event.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          if (jsonData.length === 0) {
            alert('No data found in the Excel file')
            setImporting(false)
            return
          }

          // Process each row
          let successCount = 0
          let errorCount = 0
          const errors: string[] = []

          for (const row of jsonData as Record<string, unknown>[]) {
            try {
              const name = row['Name'] as string
              if (!name) {
                errors.push('Row skipped: Missing product name')
                errorCount++
                continue
              }

              // Parse price values (convert from £ to pence)
              const pricePounds = parseFloat(String(row['Price (£)'] || '0').replace('£', ''))
              const costPricePounds = parseFloat(String(row['Cost Price (£)'] || '0').replace('£', ''))
              const compareAtPricePounds = parseFloat(String(row['Compare At Price (£)'] || '0').replace('£', ''))

              // Check if product exists (by ID)
              const existingId = row['ID'] as string
              const existingSlug = row['Slug'] as string

              const productData: Record<string, unknown> = {
                name: name,
                sku: row['SKU'] || null,
                brand: row['Brand'] || null,
                description: row['Description'] || null,
                price_pence: Math.round(pricePounds * 100) || 0,
                cost_price_pence: costPricePounds ? Math.round(costPricePounds * 100) : null,
                compare_at_price_pence: compareAtPricePounds ? Math.round(compareAtPricePounds * 100) : null,
                stock_quantity: parseInt(String(row['Stock Quantity'] || '0')) || 0,
                low_stock_threshold: parseInt(String(row['Low Stock Threshold'] || '5')) || 5,
                track_inventory: String(row['Track Inventory']).toLowerCase() === 'yes',
                unit: row['Unit'] || null,
                weight_grams: row['Weight (g)'] ? parseInt(String(row['Weight (g)'])) : null,
                is_active: String(row['Active']).toLowerCase() !== 'no',
                is_featured: String(row['Featured']).toLowerCase() === 'yes',
                image_url: row['Image URL'] || null,
              }

              // Add slug for new products
              if (!existingId) {
                productData.slug = existingSlug || generateSlug(name)
              }

              if (existingId) {
                // Update existing product
                const response = await fetch(`/api/products/${existingId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(productData),
                })
                if (response.ok) {
                  successCount++
                } else {
                  const errData = await response.json()
                  errors.push(`Update failed "${name}": ${errData.error || 'Unknown error'}`)
                  errorCount++
                }
              } else {
                // Create new product
                const response = await fetch('/api/products', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(productData),
                })
                if (response.ok) {
                  successCount++
                } else {
                  const errData = await response.json()
                  errors.push(`Create failed "${name}": ${errData.error || 'Unknown error'}`)
                  errorCount++
                }
              }
            } catch (err) {
              errorCount++
              errors.push(`Error processing row: ${err}`)
            }
          }

          // Show results
          let message = `Import completed!\n\nSuccessful: ${successCount}\nErrors: ${errorCount}`
          if (errors.length > 0 && errors.length <= 10) {
            message += `\n\nErrors:\n${errors.join('\n')}`
          } else if (errors.length > 10) {
            message += `\n\nFirst 10 errors:\n${errors.slice(0, 10).join('\n')}`
          }
          alert(message)

          // Refresh products list
          const res = await fetch('/api/products?includeInactive=true')
          const refreshedData = await res.json()
          if (Array.isArray(refreshedData)) {
            setProducts(refreshedData)
          }
        } catch (err) {
          console.error('Import processing error:', err)
          alert('Failed to process Excel file: ' + err)
        }
        setImporting(false)
      }

      reader.onerror = () => {
        alert('Failed to read file')
        setImporting(false)
      }

      reader.readAsBinaryString(file)
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import products')
      setImporting(false)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Download template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Name': 'Example Product',
        'SKU': 'SKU-001',
        'Brand': 'Brand Name',
        'Description': 'Product description here',
        'Price (£)': '9.99',
        'Cost Price (£)': '5.00',
        'Compare At Price (£)': '12.99',
        'Stock Quantity': 100,
        'Low Stock Threshold': 10,
        'Track Inventory': 'Yes',
        'Unit': 'each',
        'Weight (g)': 500,
        'Active': 'Yes',
        'Featured': 'No',
        'Image URL': 'https://example.com/image.jpg',
      },
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(templateData)

    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 40 },
      { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
      { wch: 18 }, { wch: 15 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 50 },
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Products Template')
    XLSX.writeFile(wb, 'products_import_template.xlsx')
  }

  // Normalize string for matching (remove special chars, lowercase)
  const normalizeForMatch = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
  }

  // Bulk image upload handler
  const handleBulkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setBulkUploading(true)
    setBulkUploadResults(null)

    const results = {
      matched: 0,
      notFound: [] as string[],
      total: files.length
    }

    try {
      for (const file of Array.from(files)) {
        // Get filename without extension
        const fileName = file.name.replace(/\.[^/.]+$/, '')
        const normalizedFileName = normalizeForMatch(fileName)

        // Find matching product by name
        const matchedProduct = products.find(p => {
          const normalizedProductName = normalizeForMatch(p.name)
          // Check if names match (exact or contains)
          return normalizedProductName === normalizedFileName ||
                 normalizedProductName.includes(normalizedFileName) ||
                 normalizedFileName.includes(normalizedProductName)
        })

        if (matchedProduct) {
          // Upload image
          const formData = new FormData()
          formData.append('file', file)

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (uploadRes.ok) {
            const { url } = await uploadRes.json()

            // Update product with new image
            const updateRes = await fetch(`/api/products/${matchedProduct.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_url: url }),
            })

            if (updateRes.ok) {
              results.matched++
            } else {
              results.notFound.push(`${fileName} (upload failed)`)
            }
          } else {
            results.notFound.push(`${fileName} (upload failed)`)
          }
        } else {
          results.notFound.push(fileName)
        }
      }

      setBulkUploadResults(results)

      // Refresh products list
      const res = await fetch('/api/products?includeInactive=true')
      const refreshedData = await res.json()
      if (Array.isArray(refreshedData)) {
        setProducts(refreshedData)
      }
    } catch (error) {
      console.error('Bulk upload error:', error)
      alert('Bulk upload failed')
    }

    setBulkUploading(false)

    // Reset file input
    if (bulkImageInputRef.current) {
      bulkImageInputRef.current.value = ''
    }
  }

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

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Check if all products on current page are selected
  const isAllPageSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProducts.has(p.id))

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

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
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting || products.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Excel
          </button>

          {/* Import Button */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <label
              htmlFor="import-file"
              className={`inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all cursor-pointer ${
                importing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Import Excel
            </label>
          </div>

          {/* Template Download */}
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
            title="Download import template"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Template
          </button>

          {/* Bulk Image Upload */}
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all"
            title="Bulk upload images"
          >
            <ImagePlus className="w-4 h-4" />
            Bulk Images
          </button>

          {/* Add Product */}
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats.total, icon: Package, color: 'emerald' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'blue' },
          { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'slate' },
          { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'amber' },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                stat.color === 'emerald' ? 'bg-emerald-100' :
                stat.color === 'blue' ? 'bg-blue-100' :
                stat.color === 'slate' ? 'bg-slate-100' :
                'bg-amber-100'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'emerald' ? 'text-emerald-600' :
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'slate' ? 'text-slate-600' :
                  'text-amber-600'
                }`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{loading ? '...' : stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  filter === btn.key
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <btn.icon className="w-4 h-4" />
                {btn.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filter === btn.key ? 'bg-white/20' : 'bg-slate-200'
                }`}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold">
                {selectedProducts.size}
              </div>
              <span className="font-medium">product{selectedProducts.size > 1 ? 's' : ''} selected</span>
            </div>
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {bulkDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </>
              )}
            </button>
          </div>
        </div>
      )}

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
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => (
            <div
              key={product.id}
              className={`group bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-xl transition-all duration-300 ${selectedProducts.has(product.id) ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-100'}`}
            >
              {/* Image */}
              <div className="relative aspect-square bg-slate-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-slate-300" />
                  </div>
                )}
                {/* Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    className="w-5 h-5 text-emerald-600 border-2 border-white rounded focus:ring-emerald-500 cursor-pointer shadow-lg"
                  />
                </div>
                {/* Badges */}
                <div className="absolute top-3 left-10 flex flex-col gap-2">
                  {product.is_featured && (
                    <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" fill="currentColor" /> Featured
                    </span>
                  )}
                  {!product.is_active && (
                    <span className="px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                {/* Quick actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="p-2 bg-white rounded-xl shadow-lg hover:bg-emerald-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-slate-600" />
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                    className="p-2 bg-white rounded-xl shadow-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleting === product.id ? (
                      <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 truncate mb-1">{product.name}</h3>
                {product.brand && <p className="text-sm text-slate-500 mb-2">{product.brand}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-emerald-600">{formatPrice(product.price_pence)}</p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    product.stock_quantity === 0
                      ? 'bg-red-100 text-red-700'
                      : product.stock_quantity <= product.low_stock_threshold
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {product.stock_quantity} in stock
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="w-12 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Product</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Vendor</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">SKU</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Price</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Stock</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${selectedProducts.has(product.id) ? 'bg-emerald-50' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          {product.brand && <p className="text-sm text-slate-500">{product.brand}</p>}
                          {product.is_featured && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium mt-1">
                              <Star className="w-3 h-3" fill="currentColor" /> Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{product.vendors?.store_name || <span className="text-slate-400 italic">Platform</span>}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 font-mono text-sm">{product.sku || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-slate-900">{formatPrice(product.price_pence)}</span>
                        {product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence && (
                          <span className="text-sm text-slate-400 line-through ml-2">
                            {formatPrice(product.compare_at_price_pence)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.track_inventory ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          product.stock_quantity === 0
                            ? 'bg-red-100 text-red-700'
                            : product.stock_quantity <= product.low_stock_threshold
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {product.stock_quantity === 0 && <XCircle className="w-3.5 h-3.5" />}
                          {product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold && <AlertTriangle className="w-3.5 h-3.5" />}
                          {product.stock_quantity} in stock
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">Not tracked</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        product.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {product.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="View product"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Edit product"
                        >
                          <Pencil className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deleting === product.id}
                          className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                          title="Delete product"
                        >
                          {deleting === product.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredProducts.length > 0 && totalPages > 1 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Showing info */}
            <div className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-900">{Math.min(endIndex, filteredProducts.length)}</span> of{' '}
              <span className="font-semibold text-slate-900">{filteredProducts.length}</span> products
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              {/* Previous button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === '...'}
                    className={`min-w-[40px] h-10 px-3 text-sm font-medium rounded-xl transition-colors ${
                      page === currentPage
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                        : page === '...'
                        ? 'bg-transparent text-slate-400 cursor-default'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Mobile page indicator */}
              <div className="sm:hidden text-sm font-medium text-slate-600">
                Page {currentPage} of {totalPages}
              </div>

              {/* Next button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:hover:bg-slate-100"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for bulk image upload */}
      <input
        ref={bulkImageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleBulkImageUpload}
        className="hidden"
        id="bulk-image-input"
      />

      {/* Bulk Image Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <ImagePlus className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Bulk Image Upload</h2>
                  <p className="text-sm text-slate-500">Match images to products by filename</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkUploadModal(false)
                  setBulkUploadResults(null)
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Name your image files to match product names</li>
                  <li>Example: "Organic Bananas.jpg" matches "Organic Bananas"</li>
                  <li>Matching ignores spaces, special characters, and case</li>
                  <li>Select multiple images at once</li>
                </ul>
              </div>

              {/* Upload Button */}
              <div className="text-center">
                <label
                  htmlFor="bulk-image-input"
                  className={`inline-flex items-center gap-3 px-6 py-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all ${
                    bulkUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {bulkUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                      <span className="text-slate-600 font-medium">Uploading images...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400" />
                      <div className="text-left">
                        <span className="text-slate-900 font-semibold block">Click to select images</span>
                        <span className="text-sm text-slate-500">JPG, PNG, GIF, WebP</span>
                      </div>
                    </>
                  )}
                </label>
              </div>

              {/* Results */}
              {bulkUploadResults && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-emerald-700">{bulkUploadResults.matched}</p>
                      <p className="text-sm text-emerald-600">Matched & Uploaded</p>
                    </div>
                    <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-700">{bulkUploadResults.notFound.length}</p>
                      <p className="text-sm text-red-600">Not Matched</p>
                    </div>
                  </div>

                  {/* Not found list */}
                  {bulkUploadResults.notFound.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Files not matched:</h4>
                      <ul className="text-sm text-slate-600 space-y-1 max-h-40 overflow-y-auto">
                        {bulkUploadResults.notFound.map((filename, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            {filename}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowBulkUploadModal(false)
                  setBulkUploadResults(null)
                }}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
