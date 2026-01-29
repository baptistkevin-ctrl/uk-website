'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  X,
  Plus,
  Package,
  Star,
  Check,
  Minus,
  ShoppingCart,
  ArrowLeft,
  Scale,
  Leaf,
  Wheat,
} from 'lucide-react'
import { useCompareStore } from '@/stores/compare-store'
import { useCartStore } from '@/stores/cart-store'
import { formatPrice } from '@/lib/utils/format'

export default function ComparePage() {
  const router = useRouter()
  const { products, removeProduct, clearAll, maxProducts } = useCompareStore()
  const addToCart = useCartStore((state) => state.addItem)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    )
  }

  const handleAddToCart = (product: (typeof products)[0]) => {
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price_pence: product.price_pence,
      image_url: product.image_url,
      quantity: 1,
      unit: product.unit,
      unit_value: product.unit_value || 1,
      stock_quantity: product.stock_quantity,
      vendor_id: null,
    })
  }

  const getLowestPrice = () => {
    if (products.length === 0) return null
    return Math.min(...products.map((p) => p.price_pence))
  }

  const getHighestRating = () => {
    if (products.length === 0) return null
    return Math.max(...products.map((p) => p.avg_rating || 0))
  }

  const emptySlots = maxProducts - products.length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-6 h-6 text-emerald-600" />
                  Compare Products
                </h1>
                <p className="text-slate-500 mt-1">
                  {products.length} of {maxProducts} products selected
                </p>
              </div>
            </div>
            {products.length > 0 && (
              <button
                onClick={clearAll}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Scale className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No products to compare</h2>
            <p className="text-slate-500 mb-6">
              Add products to compare their features, prices, and specifications
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Product Headers */}
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="p-4 text-left text-sm font-semibold text-slate-500 w-40 sticky left-0 bg-white">
                      Product
                    </th>
                    {products.map((product) => (
                      <th key={product.id} className="p-4 min-w-[200px]">
                        <div className="relative">
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <Link href={`/products/${product.slug}`}>
                            <div className="w-32 h-32 mx-auto rounded-xl bg-slate-100 overflow-hidden relative mb-3">
                              {product.image_url ? (
                                <Image
                                  src={product.image_url}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Package className="w-8 h-8 text-slate-300" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-semibold text-slate-900 text-sm hover:text-emerald-600 transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                          </Link>
                        </div>
                      </th>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <th key={`empty-${i}`} className="p-4 min-w-[200px]">
                        <Link
                          href="/"
                          className="w-32 h-32 mx-auto rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-300 hover:text-emerald-500 transition-colors"
                        >
                          <Plus className="w-8 h-8 mb-2" />
                          <span className="text-sm">Add Product</span>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {/* Price */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                      Price
                    </td>
                    {products.map((product) => {
                      const isLowest = product.price_pence === getLowestPrice()
                      return (
                        <td key={product.id} className="p-4 text-center">
                          <div className={`text-lg font-bold ${isLowest ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {formatPrice(product.price_pence)}
                            {isLowest && products.length > 1 && (
                              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                Lowest
                              </span>
                            )}
                          </div>
                          {product.compare_at_price_pence && (
                            <div className="text-sm text-slate-400 line-through">
                              {formatPrice(product.compare_at_price_pence)}
                            </div>
                          )}
                        </td>
                      )
                    })}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Rating */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                      Rating
                    </td>
                    {products.map((product) => {
                      const isHighest = (product.avg_rating || 0) === getHighestRating() && getHighestRating()! > 0
                      return (
                        <td key={product.id} className="p-4 text-center">
                          <div className={`flex items-center justify-center gap-1 ${isHighest ? 'text-amber-500' : 'text-slate-600'}`}>
                            <Star className={`w-5 h-5 ${product.avg_rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                            <span className="font-semibold">{product.avg_rating?.toFixed(1) || 'N/A'}</span>
                            <span className="text-sm text-slate-400">({product.review_count})</span>
                          </div>
                          {isHighest && products.length > 1 && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              Top Rated
                            </span>
                          )}
                        </td>
                      )
                    })}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Brand */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                      Brand
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center text-slate-600">
                        {product.brand || '-'}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Unit */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                      Size/Unit
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center text-slate-600">
                        {product.unit_value} {product.unit}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Dietary - Organic */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-emerald-600" />
                        Organic
                      </div>
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.is_organic ? (
                          <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-slate-300 mx-auto" />
                        )}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Dietary - Vegan */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600">V</span>
                        Vegan
                      </div>
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.is_vegan ? (
                          <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-slate-300 mx-auto" />
                        )}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Dietary - Vegetarian */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                      Vegetarian
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.is_vegetarian ? (
                          <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-slate-300 mx-auto" />
                        )}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Dietary - Gluten Free */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                      <div className="flex items-center gap-2">
                        <Wheat className="w-4 h-4 text-amber-600" />
                        Gluten Free
                      </div>
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.is_gluten_free ? (
                          <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-slate-300 mx-auto" />
                        )}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Stock */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                      Availability
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.stock_quantity > 0 ? (
                          <span className="text-emerald-600 font-medium">In Stock</span>
                        ) : (
                          <span className="text-red-600 font-medium">Out of Stock</span>
                        )}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Vendor */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-slate-700 sticky left-0 bg-white">
                      Sold By
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center text-slate-600">
                        {product.vendor ? (
                          <Link
                            href={`/store/${product.vendor.slug}`}
                            className="text-emerald-600 hover:underline"
                          >
                            {product.vendor.business_name}
                          </Link>
                        ) : (
                          'UK Grocery Store'
                        )}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Add to Cart */}
                  <tr className="bg-slate-50">
                    <td className="p-4 sticky left-0 bg-slate-50" />
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock_quantity <= 0}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </button>
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
