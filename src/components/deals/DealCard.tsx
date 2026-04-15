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
      'group relative bg-(--color-surface) rounded-xl border border-(--color-border) overflow-hidden shadow-sm hover:shadow-lg transition-shadow',
      className
    )}>
      {/* Discount Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-(--color-error) text-white px-2 py-1 rounded-full text-sm font-bold">
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
        <div className="relative aspect-square bg-(--color-elevated)">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-(--color-text-disabled)">
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
          <span className="text-xs text-(--color-text-muted)">Ends in:</span>
          <CountdownTimerInline
            endTime={deal.ends_at}
            className="text-sm font-bold text-(--color-error)"
          />
        </div>

        {/* Title */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-foreground hover:text-(--brand-primary) transition-colors line-clamp-2 mb-2">
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
          <span className="text-xl font-bold text-(--color-error)">
            £{(deal.deal_price_pence / 100).toFixed(2)}
          </span>
          <span className="text-sm text-(--color-text-muted) line-through">
            £{(deal.original_price_pence / 100).toFixed(2)}
          </span>
          <span className="text-sm text-(--brand-primary) font-medium">
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
              ? 'bg-(--brand-primary) text-white hover:bg-(--brand-primary-hover)'
              : 'bg-(--color-elevated) text-(--color-text-muted) cursor-not-allowed'
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
      'flex gap-4 p-3 bg-(--color-surface) rounded-lg border border-(--color-border) hover:shadow-md transition-shadow',
      className
    )}>
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="shrink-0">
        <div className="relative w-20 h-20 bg-(--color-elevated) rounded-lg overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-(--color-elevated)" />
          )}
          <div className="absolute top-1 left-1 bg-(--color-error) text-white text-xs font-bold px-1 py-0.5 rounded">
            -{deal.discount_percentage}%
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug}`}>
          <h4 className="font-medium text-foreground text-sm line-clamp-1 hover:text-(--brand-primary)">
            {product.name}
          </h4>
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg font-bold text-(--color-error)">
            £{(deal.deal_price_pence / 100).toFixed(2)}
          </span>
          <span className="text-xs text-(--color-text-disabled) line-through">
            £{(deal.original_price_pence / 100).toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <CountdownTimerInline
            endTime={deal.ends_at}
            className="text-xs text-(--color-error)"
          />
          {deal.max_quantity && (
            <span className="text-xs text-(--color-text-muted)">
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
            ? 'bg-(--brand-primary) text-white hover:bg-(--brand-primary-hover)'
            : 'bg-(--color-elevated) text-(--color-text-disabled) cursor-not-allowed'
        )}
      >
        <ShoppingCart className="h-5 w-5" />
      </button>
    </div>
  )
}
