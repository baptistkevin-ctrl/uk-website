'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Pencil,
  Trash2,
  Loader2,
  ShoppingBag,
  Star,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

interface Product {
  id: string
  name: string
  slug: string
  sku: string | null
  brand: string | null
  price_pence: number
  stock_quantity: number
  low_stock_threshold: number
  image_url: string | null
  is_active: boolean
  is_featured: boolean
}

interface ProductGridProps {
  products: Product[]
  selectedProducts: Set<string>
  deleting: string | null
  onToggleSelection: (id: string) => void
  onDelete: (id: string) => void
}

export default function ProductGrid({
  products,
  selectedProducts,
  deleting,
  onToggleSelection,
  onDelete,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
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
                onChange={() => onToggleSelection(product.id)}
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
                onClick={() => onDelete(product.id)}
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
  )
}
