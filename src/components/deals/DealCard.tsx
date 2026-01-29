'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Zap } from 'lucide-react'
import { CountdownTimerInline } from './CountdownTimer'
import { DealProgress, DealProgressBadge } from './DealProgress'
import { StarRatingCompact } from '../reviews'
import { cn } from '@/lib/utils/cn'

interface DealProduct {
  id: string
  name: string
  slug: string
  price_pence: number
  compare_at_price_pence: number | null
  image_url: string | null
  stock_quantity: number
  is_active: boolean
  avg_rating?: number
  review_count?: number
}

interface DealCardProps {
  deal: {
    id: string
    title: string
    slug: string
    description: string | null
    deal_price_pence: number
    original_price_pence: number
    discount_percentage: number
    ends_at: string
    max_quantity: number | null
    claimed_quantity: number
    banner_image_url: string | null
    products: DealProduct | null
  }
  onAddToCart?: (product: DealProduct, dealPrice: number) => void
  className?: string
}

export function DealCard({
  deal,
  onAddToCart,
  className,
}: DealCardProps) {
  const product = deal.products

  if (!product) {
    return null
  }

  const savings = deal.original_price_pence - deal.deal_price_pence
  const isSoldOut = deal.max_quantity !== null && deal.claimed_quantity >= deal.max_quantity
  const isAvailable = product.is_active && product.stock_quantity > 0 && !isSoldOut

  return (
    <div className={cn(
      'group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow',
      className
    )}>
      {/* Discount Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded-full text-sm font-bold">
        <Zap className="h-3 w-3" />
        {deal.discount_percentage}% OFF
      </div>

      {/* Stock Badge */}
      <div className="absolute top-3 right-3 z-10">
        <DealProgressBadge
          claimed={deal.claimed_quantity}
          total={deal.max_quantity}
        />
      </div>

      {/* Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square bg-gray-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {isSoldOut ? 'SOLD OUT' : 'UNAVAILABLE'}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Timer */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Ends in:</span>
          <CountdownTimerInline
            endTime={deal.ends_at}
            className="text-sm font-bold text-red-600"
          />
        </div>

        {/* Title */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 hover:text-green-600 transition-colors line-clamp-2 mb-2">
            {deal.title || product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.avg_rating !== undefined && product.avg_rating > 0 && (
          <StarRatingCompact
            rating={product.avg_rating}
            reviewCount={product.review_count || 0}
            className="mb-2"
          />
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-bold text-red-600">
            £{(deal.deal_price_pence / 100).toFixed(2)}
          </span>
          <span className="text-sm text-gray-500 line-through">
            £{(deal.original_price_pence / 100).toFixed(2)}
          </span>
          <span className="text-sm text-green-600 font-medium">
            Save £{(savings / 100).toFixed(2)}
          </span>
        </div>

        {/* Progress */}
        {deal.max_quantity && (
          <DealProgress
            claimed={deal.claimed_quantity}
            total={deal.max_quantity}
            className="mb-3"
          />
        )}

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart?.(product, deal.deal_price_pence)}
          disabled={!isAvailable}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-colors',
            isAvailable
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          {isSoldOut ? 'Sold Out' : isAvailable ? 'Add to Cart' : 'Unavailable'}
        </button>
      </div>
    </div>
  )
}

// Compact horizontal version for lists
export function DealCardCompact({
  deal,
  onAddToCart,
  className,
}: DealCardProps) {
  const product = deal.products

  if (!product) {
    return null
  }

  const isSoldOut = deal.max_quantity !== null && deal.claimed_quantity >= deal.max_quantity
  const isAvailable = product.is_active && product.stock_quantity > 0 && !isSoldOut

  return (
    <div className={cn(
      'flex gap-4 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow',
      className
    )}>
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="flex-shrink-0">
        <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
          <div className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-1 py-0.5 rounded">
            -{deal.discount_percentage}%
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug}`}>
          <h4 className="font-medium text-gray-900 text-sm line-clamp-1 hover:text-green-600">
            {product.name}
          </h4>
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg font-bold text-red-600">
            £{(deal.deal_price_pence / 100).toFixed(2)}
          </span>
          <span className="text-xs text-gray-400 line-through">
            £{(deal.original_price_pence / 100).toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <CountdownTimerInline
            endTime={deal.ends_at}
            className="text-xs text-red-600"
          />
          {deal.max_quantity && (
            <span className="text-xs text-gray-500">
              {Math.max(deal.max_quantity - deal.claimed_quantity, 0)} left
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => onAddToCart?.(product, deal.deal_price_pence)}
        disabled={!isAvailable}
        className={cn(
          'self-center p-2 rounded-lg transition-colors',
          isAvailable
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        )}
      >
        <ShoppingCart className="h-5 w-5" />
      </button>
    </div>
  )
}
