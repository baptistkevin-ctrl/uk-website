'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trash2, ShoppingCart, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface WishlistItemProduct {
  id: string
  name: string
  slug: string
  price_pence: number
  compare_at_price_pence: number | null
  image_url: string | null
  is_active: boolean
  stock_quantity: number
}

interface WishlistCardProps {
  item: {
    id: string
    product_id: string
    added_price_pence: number | null
    notes: string | null
    created_at: string
    products: WishlistItemProduct | null
  }
  onRemove: (productId: string) => void
  onAddToCart: (product: WishlistItemProduct) => void
  className?: string
}

export function WishlistCard({
  item,
  onRemove,
  onAddToCart,
  className,
}: WishlistCardProps) {
  const product = item.products

  if (!product) {
    return null
  }

  const priceChanged = item.added_price_pence && item.added_price_pence !== product.price_pence
  const priceDrop = priceChanged && product.price_pence < (item.added_price_pence || 0)
  const priceIncrease = priceChanged && product.price_pence > (item.added_price_pence || 0)
  const priceDifference = item.added_price_pence
    ? Math.abs(product.price_pence - item.added_price_pence)
    : 0

  const isAvailable = product.is_active && product.stock_quantity > 0

  return (
    <div className={cn('flex gap-4 p-4 bg-(--color-surface) rounded-lg border border-(--color-border)', className)}>
      {/* Product Image */}
      <Link href={`/products/${product.slug}`} className="shrink-0">
        <div className="relative w-24 h-24 bg-(--color-elevated) rounded-lg overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-(--color-text-disabled)">
              No image
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium text-foreground hover:text-(--brand-primary) transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            £{(product.price_pence / 100).toFixed(2)}
          </span>
          {product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence && (
            <span className="text-sm text-(--color-text-muted) line-through">
              £{(product.compare_at_price_pence / 100).toFixed(2)}
            </span>
          )}
        </div>

        {/* Price Change Alert */}
        {priceChanged && (
          <div className={cn(
            'mt-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            priceDrop ? 'bg-(--brand-primary-light) text-(--brand-primary)' : 'bg-orange-100 text-orange-700'
          )}>
            {priceDrop ? (
              <>
                <TrendingDown className="h-3 w-3" />
                Price dropped £{(priceDifference / 100).toFixed(2)}!
              </>
            ) : (
              <>
                <TrendingUp className="h-3 w-3" />
                Price increased £{(priceDifference / 100).toFixed(2)}
              </>
            )}
          </div>
        )}

        {/* Stock Status */}
        {!isAvailable && (
          <div className="mt-2 text-sm text-(--color-error)">
            {!product.is_active ? 'Product unavailable' : 'Out of stock'}
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <p className="mt-2 text-sm text-(--color-text-muted) line-clamp-2">{item.notes}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onAddToCart(product)}
          disabled={!isAvailable}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isAvailable
              ? 'bg-(--brand-primary) text-white hover:bg-(--brand-primary-hover)'
              : 'bg-(--color-elevated) text-(--color-text-disabled) cursor-not-allowed'
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </button>
        <button
          onClick={() => onRemove(product.id)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-elevated) transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>
    </div>
  )
}

// Compact version for sidebar/mobile
export function WishlistCardCompact({
  item,
  onRemove,
  className,
}: {
  item: {
    id: string
    product_id: string
    products: WishlistItemProduct | null
  }
  onRemove: (productId: string) => void
  className?: string
}) {
  const product = item.products

  if (!product) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-3 p-2', className)}>
      <Link href={`/products/${product.slug}`} className="shrink-0">
        <div className="relative w-12 h-12 bg-(--color-elevated) rounded overflow-hidden">
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
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug}`}>
          <p className="text-sm font-medium text-foreground truncate hover:text-(--brand-primary)">
            {product.name}
          </p>
        </Link>
        <p className="text-sm text-(--color-text-secondary)">
          £{(product.price_pence / 100).toFixed(2)}
        </p>
      </div>
      <button
        onClick={() => onRemove(product.id)}
        className="p-1 text-(--color-text-disabled) hover:text-(--color-error) transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
