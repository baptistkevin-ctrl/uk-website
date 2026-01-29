'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Plus, ShoppingBag, Leaf, Heart, Star, Check, AlertTriangle, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'
import { WishlistButton } from '@/components/wishlist'
import { StarRatingCompact } from '@/components/reviews'
import { useState } from 'react'

// Simplified product type that accepts partial data from various sources
export interface ProductCardData {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
  compare_at_price_pence?: number | null
  short_description?: string | null
  unit?: string | null
  unit_value?: number | null
  is_organic?: boolean
  is_vegan?: boolean
  is_vegetarian?: boolean
  is_gluten_free?: boolean
  is_featured?: boolean
  has_offer?: boolean
  offer_badge?: string | null
  avg_rating?: number
  review_count?: number
  stock_quantity?: number
  track_inventory?: boolean
  allow_backorder?: boolean
  low_stock_threshold?: number
  brand?: string | null
  vendor?: {
    id?: string
    business_name: string
    slug: string
    is_verified?: boolean
  } | null
}

interface ProductCardProps {
  product: ProductCardData
  isLoggedIn?: boolean
  variant?: 'default' | 'horizontal'
}

export function ProductCard({ product, isLoggedIn = false }: ProductCardProps) {
  const { addItem, openCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsAdding(true)
    addItem(product)

    setTimeout(() => {
      setIsAdding(false)
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1500)
    }, 300)

    openCart()
  }

  const hasDiscount = product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price_pence / product.compare_at_price_pence!) * 100)
    : 0

  const stockQty = product.stock_quantity ?? 999
  const lowStockThreshold = product.low_stock_threshold ?? 5
  const isOutOfStock = product.track_inventory && stockQty === 0 && !product.allow_backorder
  const isLowStock = product.track_inventory && stockQty <= lowStockThreshold && stockQty > 0

  return (
    <Card className="group overflow-hidden border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 bg-white">
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-10 w-10 text-slate-400" />
              </div>
            </div>
          )}

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.has_offer && product.offer_badge && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg text-xs font-bold px-2">
                <Tag className="h-3 w-3 mr-1" />
                {product.offer_badge}
              </Badge>
            )}
            {hasDiscount && !product.has_offer && (
              <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-lg text-xs font-bold px-2">
                -{discountPercentage}% OFF
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg text-xs font-bold px-2">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
          </div>

          {/* Dietary Badges - Bottom Left */}
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {product.is_organic && (
              <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg" title="Organic">
                <Leaf className="h-4 w-4 text-white" />
              </div>
            )}
            {product.is_vegan && (
              <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg" title="Vegan">
                <Heart className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Low Stock Warning */}
          {isLowStock && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="warning" className="bg-amber-100 text-amber-700 border-amber-200 shadow-md text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Low Stock
              </Badge>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="secondary" className="text-base px-4 py-2 bg-slate-900 text-white">
                Out of Stock
              </Badge>
            </div>
          )}

          {/* Wishlist & Quick Add Buttons - Top Right */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {/* Wishlist Button - Always visible */}
            <WishlistButton
              productId={product.id}
              isLoggedIn={isLoggedIn}
              size="sm"
            />

            {/* Quick Add Button - Appears on Hover */}
            {!isOutOfStock && (
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <Button
                  size="icon"
                  className={`h-8 w-8 rounded-full shadow-lg transition-all duration-300 ${
                    justAdded
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-white hover:bg-emerald-500 text-emerald-600 hover:text-white'
                  }`}
                  onClick={handleAddToCart}
                  disabled={isAdding}
                >
                  {justAdded ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-tight">
            {product.name}
          </h3>

          {/* Star Rating */}
          {product.avg_rating && product.avg_rating > 0 && (
            <StarRatingCompact
              rating={product.avg_rating}
              reviewCount={product.review_count ?? 0}
              className="mb-1"
            />
          )}

          {/* Short Description */}
          {product.short_description && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-1">
              {product.short_description}
            </p>
          )}

          {/* Unit Info */}
          {product.unit && product.unit !== 'each' && (
            <p className="text-xs text-gray-400 mb-3">
              {product.unit_value}{product.unit}
            </p>
          )}

          {/* Price and Add Button */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(product.price_pence)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.compare_at_price_pence!)}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <p className="text-xs text-red-500 font-medium">
                  Save {formatPrice(product.compare_at_price_pence! - product.price_pence)}
                </p>
              )}
            </div>

            {/* Mobile Add Button (always visible on small screens) */}
            <Button
              size="icon"
              className={`h-10 w-10 rounded-full shrink-0 lg:hidden transition-all duration-300 ${
                justAdded
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
            >
              {justAdded ? (
                <Check className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </Button>

            {/* Desktop Add Button */}
            <Button
              size="sm"
              className={`hidden lg:flex rounded-full transition-all duration-300 ${
                justAdded
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
            >
              {justAdded ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  )
}
