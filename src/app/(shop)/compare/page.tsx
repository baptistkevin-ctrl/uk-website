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
import { useCartStore } from '@/hooks/use-cart'
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-(--color-text-disabled)">Loading...</div>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-(--color-surface) border-b border-(--color-border)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg border border-(--color-border) text-(--color-text-secondary) hover:bg-background transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Scale className="w-6 h-6 text-(--brand-primary)" />
                  Compare Products
                </h1>
                <p className="text-(--color-text-muted) mt-1">
                  {products.length} of {maxProducts} products selected
                </p>
              </div>
            </div>
            {products.length > 0 && (
              <button
                onClick={clearAll}
                className="text-(--color-error) hover:opacity-80 font-medium"
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
          <div className="bg-(--color-surface) rounded-2xl p-12 text-center border border-(--color-border)">
            <Scale className="w-16 h-16 text-(--color-text-disabled) mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No products to compare</h2>
            <p className="text-(--color-text-muted) mb-6">
              Add products to compare their features, prices, and specifications
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary-hover) transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="bg-(--color-surface) rounded-2xl border border-(--color-border) overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Product Headers */}
                <thead>
                  <tr className="border-b border-(--color-border)">
                    <th className="p-3 sm:p-4 text-left text-sm font-semibold text-(--color-text-muted) w-28 sm:w-40 sticky left-0 bg-(--color-surface) z-10">
                      Product
                    </th>
                    {products.map((product) => (
                      <th key={product.id} className="p-4 min-w-50">
                        <div className="relative">
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="absolute -top-2 -right-2 p-1 bg-(--color-error-bg) text-(--color-error) rounded-full hover:opacity-80 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <Link href={`/products/${product.slug}`}>
                            <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto rounded-xl bg-(--color-elevated) overflow-hidden relative mb-3">
                              {product.image_url ? (
                                <Image
                                  src={product.image_url}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Package className="w-8 h-8 text-(--color-text-disabled)" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-semibold text-foreground text-sm hover:text-(--brand-primary) transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                          </Link>
                        </div>
                      </th>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <th key={`empty-${i}`} className="p-4 min-w-50">
                        <Link
                          href="/"
                          className="w-32 h-32 mx-auto rounded-xl border-2 border-dashed border-(--color-border) flex flex-col items-center justify-center text-(--color-text-disabled) hover:border-(--brand-primary) hover:text-(--brand-primary) transition-colors"
                        >
                          <Plus className="w-8 h-8 mb-2" />
                          <span className="text-sm">Add Product</span>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-(--color-border)">
                  {/* Price */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-(--color-text-secondary) sticky left-0 bg-(--color-surface)">
                      Price
                    </td>
                    {products.map((product) => {
                      const isLowest = product.price_pence === getLowestPrice()
                      return (
                        <td key={product.id} className="p-4 text-center">
                          <div className={`text-lg font-bold ${isLowest ? 'text-(--brand-primary)' : 'text-foreground'}`}>
                            {formatPrice(product.price_pence)}
                            {isLowest && products.length > 1 && (
                              <span className="ml-2 text-xs bg-(--brand-primary-light) text-(--brand-primary) px-2 py-0.5 rounded-full">
                                Lowest
                              </span>
                            )}
                          </div>
                          {product.compare_at_price_pence && (
                            <div className="text-sm text-(--color-text-disabled) line-through">
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
                    <td className="p-4 text-sm font-medium text-(--color-text-secondary) sticky left-0 bg-(--color-surface)">
                      Rating
                    </td>
                    {products.map((product) => {
                      const isHighest = (product.avg_rating || 0) === getHighestRating() && getHighestRating()! > 0
                      return (
                        <td key={product.id} className="p-4 text-center">
                          <div className={`flex items-center justify-center gap-1 ${isHighest ? 'text-(--brand-amber)' : 'text-(--color-text-secondary)'}`}>
                            <Star className={`w-5 h-5 ${product.avg_rating ? 'fill-(--brand-amber) text-(--brand-amber)' : 'text-(--color-text-disabled)'}`} />
                            <span className="font-semibold">{product.avg_rating?.toFixed(1) || 'N/A'}</span>
                            <span className="text-sm text-(--color-text-disabled)">({product.review_count})</span>
                          </div>
                          {isHighest && products.length > 1 && (
                            <span className="text-xs bg-(--brand-amber-soft) text-(--brand-amber) px-2 py-0.5 rounded-full">
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
                    <td className="p-4 text-sm font-medium text-(--color-text-secondary) sticky left-0 bg-(--color-surface)">
                      Brand
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center text-(--color-text-secondary)">
                        {product.brand || '-'}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Unit */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-(--color-text-secondary) sticky left-0 bg-(--color-surface)">
                      Size/Unit
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center text-(--color-text-secondary)">
                        {product.unit_value} {product.unit}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Dietary - Organic */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-(--color-text-secondary) sticky left-0 bg-(--color-surface)">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-(--brand-primary)" />
                        Organic
                      </div>
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.is_organic ? (
                          <Check className="w-5 h-5 text-(--brand-primary) mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-(--color-text-disabled) mx-auto" />
                        )}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Dietary - Vegan */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-(--color-text-secondary) sticky left-0 bg-(--color-surface)">
                      <div className="flex items-center gap-2">
                        <span className="text-(--brand-primary)">V</span>
                        Vegan
                      </div>
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.is_vegan ? (
                          <Check className="w-5 h-5 text-(--brand-primary) mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-(--color-text-disabled) mx-auto" />
                        )}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Dietary - Vegetarian */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-(--color-text-secondary) sticky left-0 bg-(--color-surface)">
                      Vegetarian
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.is_vegetarian ? (
                          <Check className="w-5 h-5 text-(--brand-primary) mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-(--color-text-disabled) mx-auto" />
                        )}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Dietary - Gluten Free */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-(--color-text-secondary) sticky left-0 bg-(--color-surface)">
                      <div className="flex items-center gap-2">
                        <Wheat className="w-4 h-4 text-(--brand-amber)" />
                        Gluten Free
                      </div>
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.is_gluten_free ? (
                          <Check className="w-5 h-5 text-(--brand-primary) mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-(--color-text-disabled) mx-auto" />
                        )}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Stock */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-(--color-text-secondary) sticky left-0 bg-(--color-surface)">
                      Availability
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {product.stock_quantity > 0 ? (
                          <span className="text-(--brand-primary) font-medium">In Stock</span>
                        ) : (
                          <span className="text-(--color-error) font-medium">Out of Stock</span>
                        )}
                      </td>
                    ))}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>

                  {/* Vendor */}
                  <tr>
                    <td className="p-4 text-sm font-medium text-(--color-text-secondary) sticky left-0 bg-(--color-surface)">
                      Sold By
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center text-(--color-text-secondary)">
                        {product.vendor ? (
                          <Link
                            href={`/store/${product.vendor.slug}`}
                            className="text-(--brand-primary) hover:underline"
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
                  <tr className="bg-background">
                    <td className="p-4 sticky left-0 bg-background" />
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock_quantity <= 0}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg font-medium hover:bg-(--brand-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
