'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingCart, Loader2, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useQuickViewStore } from '@/stores/quick-view-store'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils/format'

// SVG icons
const StarIcon = ({ filled = false, half = false, size = 16 }: { filled?: boolean; half?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {half ? (
      <>
        <defs>
          <linearGradient id="halfStarQV">
            <stop offset="50%" stopColor="#FFB800" />
            <stop offset="50%" stopColor="#E5E7EB" />
          </linearGradient>
        </defs>
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#halfStarQV)" />
      </>
    ) : (
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={filled ? "#FFB800" : "#E5E7EB"} />
    )}
  </svg>
)

const ShoppingBagPlaceholder = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"/>
    <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"/>
  </svg>
)

function generateFromId(productId: string, max: number, min: number = 0): number {
  let hash = 0
  for (let i = 0; i < productId.length; i++) {
    const char = productId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash % (max - min)) + min
}

function generateReviewBreakdown(productId: string, totalReviews: number) {
  const seed = generateFromId(productId, 1000)
  // Weighted distribution skewing towards 5 and 4 stars
  const weights = [0.55, 0.22, 0.10, 0.05, 0.08]
  // Add some variation based on seed
  const variation = (seed % 20 - 10) / 100
  const adjusted = weights.map((w, i) => Math.max(0.02, w + (i === 0 ? variation : -variation / 4)))
  const sum = adjusted.reduce((a, b) => a + b, 0)
  const normalized = adjusted.map(w => w / sum)

  return [5, 4, 3, 2, 1].map((stars, i) => ({
    stars,
    count: Math.round(normalized[i] * totalReviews),
    percentage: Math.round(normalized[i] * 100),
  }))
}

export function ProductQuickViewModal() {
  const { isOpen, product, closeQuickView } = useQuickViewStore()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  if (!product) return null

  const hasDiscount = product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price_pence / product.compare_at_price_pence!) * 100)
    : 0

  const isOutOfStock = product.track_inventory && product.stock_quantity === 0 && !product.allow_backorder
  const isLowStock = product.track_inventory && product.stock_quantity !== undefined
    && product.stock_quantity > 0 && product.stock_quantity <= (product.low_stock_threshold || 5)

  const rating = product.avg_rating ?? (3.8 + (generateFromId(product.id, 12) / 10))
  const reviewCount = product.review_count ?? generateFromId(product.id, 1200, 50)
  const soldCount = product.sold_count ?? generateFromId(product.id, 8000, 100)
  const reviewBreakdown = generateReviewBreakdown(product.id, reviewCount)

  const hasFreeShipping = product.price_pence >= 1500

  const renderStars = (size = 16) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIcon key={i} filled size={size} />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarIcon key={i} half size={size} />)
      } else {
        stars.push(<StarIcon key={i} size={size} />)
      }
    }
    return stars
  }

  const dietaryBadges = []
  if (product.is_organic) dietaryBadges.push({ label: 'Organic', color: 'bg-green-100 text-green-700 border-green-200' })
  if (product.is_vegan) dietaryBadges.push({ label: 'Vegan', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' })
  if (product.is_vegetarian) dietaryBadges.push({ label: 'Vegetarian', color: 'bg-lime-100 text-lime-700 border-lime-200' })
  if (product.is_gluten_free) dietaryBadges.push({ label: 'Gluten Free', color: 'bg-amber-100 text-amber-700 border-amber-200' })

  const handleAddToCart = () => {
    setIsAdding(true)
    addItem(product, quantity)
    // Show "Adding..." for 400ms, then "Added!" for 800ms, then close
    setTimeout(() => {
      setIsAdding(false)
      setJustAdded(true)
      setTimeout(() => {
        setJustAdded(false)
        handleClose()
      }, 800)
    }, 400)
  }

  const handleClose = () => {
    setQuantity(1)
    setIsAdding(false)
    setJustAdded(false)
    closeQuickView()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-6xl max-h-[85vh] lg:max-h-[92vh] overflow-y-auto p-0 gap-0 fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl lg:rounded-lg lg:fixed lg:left-[50%] lg:top-[50%] lg:bottom-auto lg:right-auto lg:translate-x-[-50%] lg:translate-y-[-50%] data-[state=open]:slide-in-from-bottom lg:data-[state=open]:slide-in-from-bottom-0 lg:data-[state=open]:slide-in-from-left-1/2 lg:data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:slide-out-to-bottom lg:data-[state=closed]:slide-out-to-bottom-0 lg:data-[state=closed]:slide-out-to-left-1/2 lg:data-[state=closed]:slide-out-to-top-[48%]">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>

        {/* Mobile drag handle */}
        <div className="lg:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* ===== LEFT: Product Image ===== */}
          <div className="relative w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-gray-50">
            {/* Mobile: compact horizontal layout with image + name/price side by side */}
            <div className="lg:hidden flex gap-3 p-3">
              <div className="relative w-28 h-28 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBagPlaceholder />
                  </div>
                )}
                {hasDiscount && (
                  <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {discountPercentage}% OFF
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <h2 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-1.5">
                  {product.name}
                </h2>
                <div className="flex items-center gap-1 mb-1.5">
                  <div className="flex items-center gap-[1px]">
                    {renderStars(12)}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({reviewCount.toLocaleString()})</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(product.price_pence)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(product.compare_at_price_pence!)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <span className="text-xs font-semibold text-red-500">
                    Save {formatPrice(product.compare_at_price_pence! - product.price_pence)}
                  </span>
                )}
              </div>
            </div>

            {/* Desktop: full aspect-square image */}
            <div className="hidden lg:block relative aspect-square">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="420px"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBagPlaceholder />
                </div>
              )}

              {/* Discount badge on image */}
              {hasDiscount && (
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded">
                    {discountPercentage}% OFF
                  </span>
                </div>
              )}

              {product.has_offer && product.offer_badge && (
                <div className="absolute top-3 right-3">
                  <span className="bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded">
                    {product.offer_badge}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ===== CENTER: Product Details ===== */}
          <div className="flex-1 min-w-0 lg:border-r border-gray-100">
            <div className="px-3 pb-3 lg:p-6">
              {/* Product Name - desktop only (shown in mobile image section) */}
              <h2 className="hidden lg:block text-lg lg:text-xl font-bold text-gray-900 leading-snug mb-3">
                {product.name}
              </h2>

              {/* Rating / Reviews / Sold row - desktop only */}
              <div className="hidden lg:flex items-center flex-wrap gap-x-3 gap-y-1 mb-4">
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-[1px]">
                    {renderStars(14)}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 ml-0.5">{rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-sm text-gray-500">{reviewCount.toLocaleString()} Reviews</span>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-sm text-gray-500">{soldCount.toLocaleString()}+ sold</span>
              </div>

              {/* Dietary badges */}
              {dietaryBadges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 lg:mb-4">
                  {dietaryBadges.map((badge) => (
                    <span
                      key={badge.label}
                      className={`text-[10px] lg:text-xs font-medium px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Price Section - desktop only (shown in mobile image section) */}
              <div className="hidden lg:block bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {formatPrice(product.price_pence)}
                  </span>
                  {hasDiscount && (
                    <span className="text-base text-gray-400 line-through">
                      {formatPrice(product.compare_at_price_pence!)}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="text-sm font-semibold text-red-500">
                      Save {formatPrice(product.compare_at_price_pence! - product.price_pence)}
                    </span>
                  )}
                </div>
                {product.unit && (
                  <p className="text-xs text-gray-500 mt-1">
                    Price per {product.unit_value && product.unit_value !== 1 ? `${product.unit_value} ` : ''}{product.unit}
                  </p>
                )}
              </div>

              {/* Description */}
              {product.short_description && (
                <p className="text-xs lg:text-sm text-gray-600 leading-relaxed mb-3 lg:mb-4 line-clamp-2 lg:line-clamp-none">
                  {product.short_description}
                </p>
              )}

              {/* Mobile: Shipping info row */}
              <div className="lg:hidden flex items-center gap-4 mb-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 3H16V16H1V3Z"/><path d="M16 8H20L23 11V16H16V8Z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  {hasFreeShipping ? 'Free Shipping' : 'Standard Delivery'}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/>
                  </svg>
                  Quality Guaranteed
                </span>
              </div>

              {/* Mobile: Quantity + Add to Cart inline */}
              <div className="lg:hidden">
                {isOutOfStock ? (
                  <div className="px-4 py-2.5 bg-gray-100 rounded-lg text-center">
                    <p className="text-sm font-semibold text-gray-500">Out of Stock</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* Quantity selector */}
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-gray-900 border-x border-gray-300">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add to cart button */}
                    <Button
                      onClick={handleAddToCart}
                      disabled={isAdding || justAdded}
                      className={`flex-1 h-10 text-sm font-semibold rounded-lg shadow-sm transition-all duration-300 ${
                        justAdded
                          ? 'bg-emerald-500 hover:bg-emerald-500'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          Adding...
                        </>
                      ) : justAdded ? (
                        <>
                          <Check className="h-4 w-4 mr-1.5" />
                          Added!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-1.5" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Stock warning */}
                {isLowStock && (
                  <p className="text-xs font-medium text-orange-600 mt-1.5">
                    Only {product.stock_quantity} left
                  </p>
                )}

                {/* View Full Details link */}
                <Link
                  href={`/products/${product.slug}`}
                  onClick={handleClose}
                  className="block text-center text-xs text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors mt-3 pb-1"
                >
                  View Full Details &rarr;
                </Link>
              </div>

              {/* ===== Customer Reviews Breakdown - desktop only ===== */}
              <div className="hidden lg:block border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Customer Reviews ({reviewCount.toLocaleString()})
                </h3>
                <div className="flex items-start gap-6">
                  {/* Big rating number */}
                  <div className="text-center shrink-0">
                    <div className="text-4xl font-bold text-gray-900">{rating.toFixed(1)}</div>
                    <div className="flex items-center gap-[2px] mt-1 justify-center">
                      {renderStars(14)}
                    </div>
                  </div>

                  {/* Bar breakdown */}
                  <div className="flex-1 space-y-1.5">
                    {reviewBreakdown.map((row) => (
                      <div key={row.stars} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 w-10 text-right shrink-0">{row.stars} stars</span>
                        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-800 rounded-full transition-all"
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                        <span className="text-gray-500 w-10 shrink-0">{row.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== RIGHT: Seller Info & Actions Sidebar - desktop only ===== */}
          <div className="hidden lg:block w-full lg:w-[280px] xl:w-[300px] shrink-0 bg-white">
            <div className="p-5 lg:p-5 space-y-4">
              {/* Sold by */}
              {product.vendor && (
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Sold by</p>
                  <Link
                    href={`/store/${product.vendor.slug}`}
                    onClick={handleClose}
                    className="text-sm font-semibold text-green-700 hover:text-green-800 hover:underline"
                  >
                    {product.vendor.business_name}
                    {product.vendor.is_verified && (
                      <svg className="inline-block ml-1 w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                      </svg>
                    )}
                  </Link>
                </div>
              )}

              {/* Commitment / Shipping */}
              <div className="space-y-3 pb-4 border-b border-gray-100">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 3H16V16H1V3Z"/><path d="M16 8H20L23 11V16H16V8Z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {hasFreeShipping ? 'Free Shipping' : 'Standard Delivery'}
                    </p>
                    <p className="text-xs text-gray-500">Estimated 1-3 business days</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"/><polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Return & Refund</p>
                    <p className="text-xs text-gray-500">30-day return policy</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"/>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Quality Guaranteed</p>
                    <p className="text-xs text-gray-500">Fresh or your money back</p>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              {!isOutOfStock && (
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 mb-2">Quantity</p>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 h-9 flex items-center justify-center text-sm font-semibold text-gray-900 border-x border-gray-300">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stock warning */}
                  {isLowStock && (
                    <p className="text-xs font-medium text-orange-600 mt-2">
                      Only {product.stock_quantity} left
                    </p>
                  )}
                </div>
              )}

              {/* Add to Cart Button */}
              {isOutOfStock ? (
                <div className="px-4 py-3 bg-gray-100 rounded-lg text-center">
                  <p className="text-sm font-semibold text-gray-500">Out of Stock</p>
                  <p className="text-xs text-gray-400 mt-0.5">Check back soon</p>
                </div>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  disabled={isAdding || justAdded}
                  className={`w-full h-12 text-base font-semibold rounded-lg shadow-md transition-all duration-300 ${
                    justAdded
                      ? 'bg-emerald-500 hover:bg-emerald-500'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : justAdded ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              )}

              {/* View Full Details */}
              <Link
                href={`/products/${product.slug}`}
                onClick={handleClose}
                className="block text-center text-sm text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors pt-1"
              >
                View Full Details &rarr;
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
