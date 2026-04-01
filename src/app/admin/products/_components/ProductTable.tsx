'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Pencil,
  Trash2,
  Loader2,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Eye,
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
  is_active: boolean
  is_featured: boolean
  vendors: { id: string; store_name: string } | null
}

interface ProductTableProps {
  products: Product[]
  selectedProducts: Set<string>
  isAllPageSelected: boolean
  deleting: string | null
  onToggleSelection: (id: string) => void
  onToggleSelectAll: () => void
  onDelete: (id: string) => void
}

export default function ProductTable({
  products,
  selectedProducts,
  isAllPageSelected,
  deleting,
  onToggleSelection,
  onToggleSelectAll,
  onDelete,
}: ProductTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="w-12 px-4 py-4">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={onToggleSelectAll}
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
            {products.map((product) => (
              <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${selectedProducts.has(product.id) ? 'bg-emerald-50' : ''}`}>
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => onToggleSelection(product.id)}
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
                  <span className="text-slate-600 font-mono text-sm">{product.sku || '\u2014'}</span>
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
                      onClick={() => onDelete(product.id)}
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
  )
}
