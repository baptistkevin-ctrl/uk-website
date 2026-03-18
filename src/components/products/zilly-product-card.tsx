'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Eye, EyeOff, ShoppingBag } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'
import { useWishlistStore } from '@/hooks/use-wishlist'
import { useWatchlistStore } from '@/hooks/use-watchlist'
import { useState } from 'react'

interface Product {
  id: string
  name: string
  slug: string
  price_pence: number
  compare_at_price_pence?: number | null
  image_url: string | null
  is_organic?: boolean
  is_vegan?: boolean
  is_vegetarian?: boolean
  short_description?: string | null
  category_id?: string | null
  unit?: string | null
  unit_value?: number | null
}

interface ZillyProductCardProps {
  product: Product
  categoryName?: string
}

export function ZillyProductCard({ product, categoryName }: ZillyProductCardProps) {
  const { addItem, openCart } = useCart()
  const { productIds, addToWishlist, removeFromWishlist } = useWishlistStore()
  const { items: watchlistItems, toggleWatchlist } = useWatchlistStore()
  const isInWishlist = productIds.has(product.id)
  const isInWatchlist = watchlistItems.has(product.id)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAdding(true)
    addItem(product)
    setTimeout(() => {
      setIsAdding(false)
      openCart()
    }, 300)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isInWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product.id)
    }
  }

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWatchlist(product.id)
  }

  const hasDiscount = product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price_pence / product.compare_at_price_pence!) * 100)
    : 0

  // Get category name from slug for display
  const displayCategory = categoryName || getCategoryFromId(product.category_id)

  return (
    <div className="group bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300">
      <Link href={`/products/${product.slug}`} className="block">
        {/* Top Section - Category & Actions */}
        <div className="flex items-center justify-between px-3 pt-3">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            {displayCategory}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleWatchlistToggle}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                isInWatchlist
                  ? 'text-blue-500 bg-blue-50'
                  : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
              }`}
              title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              {isInWatchlist ? (
                <EyeOff className="h-4 w-4 fill-current" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                isInWishlist
                  ? 'text-red-500 bg-red-50'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={isInWishlist ? 'Remove from liked' : 'Like this product'}
            >
              <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Image Section */}
        <div className="relative aspect-square p-4">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
              <ShoppingBag className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Weight/Size Options */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
              {product.unit_value || 100}{product.unit || 'gm'}
            </span>
            <span className="px-2 py-0.5 bg-gray-50 rounded text-gray-400">
              500gm
            </span>
          </div>
        </div>

        {/* Price Section */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(product.price_pence)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.compare_at_price_pence!)}
                </span>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                  -{discountPercentage}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Product Name */}
        <div className="px-3 pb-3">
          <h3 className="text-xs text-gray-600 line-clamp-2 leading-relaxed group-hover:text-green-500 transition-colors">
            {product.name}
          </h3>
        </div>
      </Link>
    </div>
  )
}

// Helper function to get category name from ID
function getCategoryFromId(categoryId: string | null | undefined): string {
  if (!categoryId) return 'Products'

  // This is a simple mapping - ideally would come from context or props
  const categoryMap: Record<string, string> = {
    'vegetables': 'Vegetables',
    'fruits': 'Fruits',
    'fresh-fruits': 'Fresh Fruits',
    'desserts': 'Desserts',
    'bakery': 'Bakery',
    'beverages': 'Beverage',
    'beverage': 'Beverage',
    'drinks': 'Drinks',
    'dairy': 'Dairy',
    'meat': 'Meat',
    'fish': 'Fish',
    'snacks': 'Snacks',
  }

  return categoryMap[categoryId.toLowerCase()] || 'Products'
}
