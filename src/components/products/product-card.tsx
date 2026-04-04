'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'
import { WishlistButton } from '@/components/wishlist'
import { WatchlistButton } from '@/components/watchlist'
import { useQuickViewStore } from '@/stores/quick-view-store'
import { useState } from 'react'

// Custom SVG Icons
const StarIcon = ({ filled = false, half = false }: { filled?: boolean; half?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {half ? (
      <>
        <defs>
          <linearGradient id="halfStar">
            <stop offset="50%" stopColor="#FFB800" />
            <stop offset="50%" stopColor="#E5E7EB" />
          </linearGradient>
        </defs>
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#halfStar)" />
      </>
    ) : (
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={filled ? "#FFB800" : "#E5E7EB"} />
    )}
  </svg>
)

const ShoppingBagIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"/>
    <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"/>
  </svg>
)

const LeafIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="#22C55E" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z"/>
  </svg>
)

const TruckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3H16V16H1V3Z"/><path d="M16 8H20L23 11V16H16V8Z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)

// Simplified product type
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
  sold_count?: number
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

// Generate pseudo-random data based on product id
function generateFromId(productId: string, max: number, min: number = 0): number {
  let hash = 0
  for (let i = 0; i < productId.length; i++) {
    const char = productId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash % (max - min)) + min
}

export function ProductCard({ product, isLoggedIn = false }: ProductCardProps) {
  const { addItem, items, updateQuantity, removeItem } = useCart()
  const { openQuickView } = useQuickViewStore()
  const [isAdding, setIsAdding] = useState(false)

  // Find if product is already in cart and its quantity
  const cartItem = items.find(item => item.product.id === product.id)
  const quantityInCart = cartItem?.quantity || 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canAddMore) return
    setIsAdding(true)
    addItem(product)
    setTimeout(() => setIsAdding(false), 300)
  }

  const maxStock = product.track_inventory && product.stock_quantity !== undefined && product.stock_quantity !== null && !product.allow_backorder
    ? product.stock_quantity : Infinity
  const canAddMore = quantityInCart < maxStock

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canAddMore) addItem(product)
  }

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (quantityInCart <= 1) {
      removeItem(product.id)
    } else {
      updateQuantity(product.id, quantityInCart - 1)
    }
  }

  const hasDiscount = product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price_pence / product.compare_at_price_pence!) * 100)
    : 0

  const isOutOfStock = product.track_inventory && product.stock_quantity === 0 && !product.allow_backorder
  const isLowStock = product.track_inventory && product.stock_quantity !== undefined && product.stock_quantity !== null
    && product.stock_quantity > 0 && product.stock_quantity <= (product.low_stock_threshold ?? 5)

  const rating = product.avg_rating ?? (3.8 + (generateFromId(product.id, 12) / 10))
  const hasFreeShipping = product.price_pence >= 1500

  // Render stars
  const renderStars = () => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIcon key={i} filled />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarIcon key={i} half />)
      } else {
        stars.push(<StarIcon key={i} />)
      }
    }
    return stars
  }

  return (
    <Card className="group relative overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white rounded-lg">
      <Link
        href={`/products/${product.slug}`}
        className="block"
        onClick={(e) => {
          // Allow Ctrl+click / Cmd+click / middle-click to open in new tab
          if (e.metaKey || e.ctrlKey || e.button === 1) return
          e.preventDefault()
          openQuickView(product)
        }}
      >
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-102 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBagIcon />
            </div>
          )}

          {/* Top Left Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                -{discountPercentage}%
              </span>
            )}
            {product.has_offer && product.offer_badge && (
              <span className="bg-orange-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-sm">
                {product.offer_badge}
              </span>
            )}
          </div>

          {/* Organic/Vegan Badge */}
          {(product.is_organic || product.is_vegan) && (
            <div className="absolute top-2 right-8 flex gap-1">
              {product.is_organic && (
                <span className="bg-green-100 p-1 rounded-full" title="Organic">
                  <LeafIcon />
                </span>
              )}
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
              <span className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded">
                Out of Stock
              </span>
            </div>
          )}

          {/* Low Stock Badge */}
          {isLowStock && !isOutOfStock && (
            <div className="absolute bottom-2 left-2 right-2">
              <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-sm">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Only {product.stock_quantity} left
              </span>
            </div>
          )}

          {/* Wishlist & Watchlist Buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <WishlistButton productId={product.id} isLoggedIn={isLoggedIn} size="sm" />
            <WatchlistButton productId={product.id} size="sm" />
          </div>
        </div>

        {/* Content */}
        <div className="p-2 lg:p-2.5">
          {/* Product Name */}
          <h3 className="text-gray-800 text-xs lg:text-[13px] font-normal leading-tight line-clamp-2 mb-1 lg:mb-1.5 min-h-[28px] lg:min-h-[32px] group-hover:text-green-600 transition-colors">
            {product.name}
          </h3>

          {/* Vendor Name */}
          {product.vendor && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] lg:text-[11px] text-blue-600 font-medium truncate">
                {product.vendor.business_name}
              </span>
              {product.vendor.is_verified && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#2563EB" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#2563EB" strokeWidth="2" fill="none"/>
                </svg>
              )}
            </div>
          )}

          {/* Rating Row */}
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex items-center gap-[1px]">
              {renderStars()}
            </div>
            <span className="text-[11px] text-gray-500">{rating.toFixed(1)}</span>
          </div>

          {/* Price + Add to Cart Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-green-600 text-lg font-bold">
                {formatPrice(product.price_pence)}
              </span>
              {hasDiscount && (
                <span className="text-gray-400 text-[11px] line-through">
                  {formatPrice(product.compare_at_price_pence!)}
                </span>
              )}
            </div>

            {/* Add to Cart / Quantity Controls - Always Visible */}
            {!isOutOfStock && (
              <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                {quantityInCart > 0 ? (
                  // Quantity controls when item is in cart
                  <div className="flex items-center gap-0 border border-green-500 rounded-full overflow-hidden">
                    <button
                      onClick={handleDecrement}
                      aria-label="Decrease quantity"
                      className="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <span className="w-7 h-7 flex items-center justify-center text-sm font-bold text-green-600 bg-green-50">
                      {quantityInCart}
                    </span>
                    <button
                      onClick={handleIncrement}
                      disabled={!canAddMore}
                      aria-label="Increase quantity"
                      className={`w-7 h-7 flex items-center justify-center transition-colors ${canAddMore ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 cursor-not-allowed'}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  // Add button when not in cart
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full bg-green-500 hover:bg-green-600 shadow-sm transition-all"
                    onClick={handleAddToCart}
                    disabled={isAdding}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Shipping info */}
          {hasFreeShipping && (
            <div className="mt-1.5">
              <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                <TruckIcon />
                Free delivery
              </span>
            </div>
          )}
        </div>
      </Link>
    </Card>
  )
}
