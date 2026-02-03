'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'
import { WishlistButton } from '@/components/wishlist'
import { useState } from 'react'

// Custom SVG Icons for professional look
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

const FireIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 14.1183 19.1461 12.7849 18.4853 11.55C17.8245 10.3151 16.8835 9.21765 15.728 8.33L15.5 8.15V11.5C15.5 12.0523 15.0523 12.5 14.5 12.5C13.9477 12.5 13.5 12.0523 13.5 11.5V5C13.5 4.44772 13.0523 4 12.5 4H12C11.4477 4 11 4.44772 11 5V7C11 7.55228 10.5523 8 10 8C9.44772 8 9 7.55228 9 7V3C9 2.44772 8.55228 2 8 2C4.68629 2 2 6.02944 2 10.5C2 17.4036 6.59644 23 12 23Z"/>
  </svg>
)

const TruckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3H16V16H1V3Z"/><path d="M16 8H20L23 11V16H16V8Z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" xmlns="http://www.w3.org/2000/svg">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const ShoppingBagIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"/>
    <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"/>
  </svg>
)

const VerifiedIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#22C55E" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 12L11 14L15 10M12 3L13.9101 4.87147L16.5 4.20577L17.2184 6.78155L19.7942 7.5L19.1285 10.0899L21 12L19.1285 13.9101L19.7942 16.5L17.2184 17.2184L16.5 19.7942L13.9101 19.1285L12 21L10.0899 19.1285L7.5 19.7942L6.78155 17.2184L4.20577 16.5L4.87147 13.9101L3 12L4.87147 10.0899L4.20577 7.5L6.78155 6.78155L7.5 4.20577L10.0899 4.87147L12 3Z" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LeafIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="#22C55E" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z"/>
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

// Format sold count like AliExpress
function formatSoldCount(count: number): string {
  if (count >= 10000) return `${Math.floor(count / 1000)}k+`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return `${count}+`
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
  const { addItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsAdding(true)
    addItem(product)
    setTimeout(() => {
      setIsAdding(false)
      setJustAdded(true)
      setShowToast(true)
      setTimeout(() => {
        setJustAdded(false)
        setShowToast(false)
      }, 2000)
    }, 300)
    // Don't open cart - just show confirmation toast
  }

  const hasDiscount = product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price_pence / product.compare_at_price_pence!) * 100)
    : 0

  const isOutOfStock = product.track_inventory && product.stock_quantity === 0 && !product.allow_backorder

  // Generate realistic data
  const soldCount = product.sold_count ?? generateFromId(product.id, 8000, 20)
  const rating = product.avg_rating ?? (3.8 + (generateFromId(product.id, 12) / 10))
  const reviewCount = product.review_count ?? generateFromId(product.id, Math.floor(soldCount * 0.3), 5)
  const isHot = soldCount > 1000
  const isBestSeller = soldCount > 3000
  const hasChoice = generateFromId(product.id + 'choice', 100) > 60
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
      {/* Added to Basket Toast */}
      {showToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 animate-in fade-in zoom-in duration-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span className="text-sm font-medium">Added to basket</span>
        </div>
      )}
      <Link href={`/products/${product.slug}`} className="block">
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
              <span className="bg-[#F85606] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                -{discountPercentage}%
              </span>
            )}
            {isBestSeller && (
              <span className="bg-[#FFE4E1] text-[#F85606] text-[9px] font-semibold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                <FireIcon /> Best Seller
              </span>
            )}
            {isHot && !isBestSeller && (
              <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                <FireIcon /> Hot
              </span>
            )}
            {hasChoice && !isBestSeller && !isHot && (
              <span className="bg-[#1A1A1A] text-white text-[9px] font-medium px-1.5 py-0.5 rounded-sm">
                Choice
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

          {/* Wishlist Button */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <WishlistButton productId={product.id} isLoggedIn={isLoggedIn} size="sm" />
          </div>

          {/* Quick Add Button */}
          {!isOutOfStock && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Button
                size="icon"
                className={`h-8 w-8 rounded-full shadow-md transition-all ${
                  justAdded ? 'bg-green-500' : 'bg-[#F85606] hover:bg-[#E04D00]'
                }`}
                onClick={handleAddToCart}
                disabled={isAdding}
              >
                {justAdded ? <CheckIcon /> : <PlusIcon />}
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5">
          {/* Price Row */}
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-[#F85606] text-lg font-bold">
              {formatPrice(product.price_pence)}
            </span>
            {hasDiscount && (
              <span className="text-gray-400 text-xs line-through">
                {formatPrice(product.compare_at_price_pence!)}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="text-gray-800 text-[13px] font-normal leading-tight line-clamp-2 mb-1.5 min-h-[32px] group-hover:text-[#F85606] transition-colors">
            {product.name}
          </h3>

          {/* Rating Row */}
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex items-center gap-[1px]">
              {renderStars()}
            </div>
            <span className="text-[11px] text-gray-600 font-medium">{rating.toFixed(1)}</span>
            <span className="text-[11px] text-gray-400">| {formatSoldCount(soldCount)} sold</span>
          </div>

          {/* Shipping & Vendor Info */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasFreeShipping && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                <TruckIcon />
                Free shipping
              </span>
            )}
            {product.vendor?.is_verified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500">
                <VerifiedIcon />
                Verified
              </span>
            )}
          </div>

          {/* Extra Info for higher priced items */}
          {product.price_pence >= 3000 && (
            <div className="mt-1.5 pt-1.5 border-t border-gray-100">
              <span className="text-[10px] text-gray-500">
                {reviewCount} reviews
              </span>
            </div>
          )}
        </div>
      </Link>
    </Card>
  )
}
