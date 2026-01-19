'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Loader2,
  ShoppingBag,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface Product {
  id: string
  name: string
  slug: string
  sku: string | null
  brand: string | null
  price_pence: number
  compare_at_price_pence: number | null
  stock_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  image_url: string | null
  images: string[] | null
  is_active: boolean
  is_featured: boolean
  categories?: { name: string } | null
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)

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
    }
    setDeleting(null)
  }

  const filteredProducts =
    filter === 'all'
      ? products
      : filter === 'active'
      ? products.filter((p) => p.is_active)
      : filter === 'inactive'
      ? products.filter((p) => !p.is_active)
      : filter === 'low-stock'
      ? products.filter((p) => p.stock_quantity <= p.low_stock_threshold)
      : filter === 'featured'
      ? products.filter((p) => p.is_featured)
      : products

  const stats = {
    total: products.length,
    active: products.filter((p) => p.is_active).length,
    inactive: products.filter((p) => !p.is_active).length,
    lowStock: products.filter((p) => p.stock_quantity <= p.low_stock_threshold).length,
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">{products.length} total products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <Package className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gray-100 rounded-lg">
              <Package className="text-gray-600" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Inactive</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-orange-100 rounded-lg">
              <Package className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Low Stock</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'inactive', label: 'Inactive' },
          { key: 'low-stock', label: 'Low Stock' },
          { key: 'featured', label: 'Featured' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === item.key
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-green-600" />
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="lg:hidden space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No products found.</p>
                <Link
                  href="/admin/products/new"
                  className="text-green-600 hover:underline mt-2 inline-block"
                >
                  Add your first product
                </Link>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex gap-3">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag size={24} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      {product.brand && <p className="text-sm text-gray-500">{product.brand}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-green-600">
                          {formatPrice(product.price_pence)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deleting === product.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No products found.</p>
                <Link
                  href="/admin/products/new"
                  className="text-green-600 hover:underline mt-2 inline-block"
                >
                  Add your first product
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                      Product
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">SKU</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Price</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Stock</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ShoppingBag size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.brand && (
                              <p className="text-sm text-gray-500">{product.brand}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-500">{product.sku || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{formatPrice(product.price_pence)}</span>
                        {product.compare_at_price_pence &&
                          product.compare_at_price_pence > product.price_pence && (
                            <span className="text-sm text-gray-400 line-through ml-2">
                              {formatPrice(product.compare_at_price_pence)}
                            </span>
                          )}
                      </td>
                      <td className="px-6 py-4">
                        {product.track_inventory ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.stock_quantity === 0
                                ? 'bg-red-100 text-red-800'
                                : product.stock_quantity <= product.low_stock_threshold
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {product.stock_quantity} in stock
                          </span>
                        ) : (
                          <span className="text-gray-400">Not tracked</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Pencil size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting === product.id}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deleting === product.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
