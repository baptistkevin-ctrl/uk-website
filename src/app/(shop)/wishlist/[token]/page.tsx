'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, User, ShoppingCart, ArrowLeft, Share2, ExternalLink } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'

interface WishlistItem {
  id: string
  product_id: string
  added_price_pence: number | null
  created_at: string
  products: {
    id: string
    name: string
    slug: string
    price_pence: number
    compare_at_price_pence: number | null
    image_url: string | null
    is_active: boolean
    stock_quantity: number
  } | null
}

interface Wishlist {
  id: string
  name: string
  is_public: boolean
  share_token: string
  created_at: string
  user: {
    full_name: string
    avatar_url: string | null
  } | null
  wishlist_items: WishlistItem[]
}

export default function SharedWishlistPage() {
  const params = useParams()
  const { addItem } = useCart()
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await fetch(`/api/wishlist/${params.token}`)
        const data = await res.json()

        if (data.wishlist) {
          setWishlist(data.wishlist)
        } else {
          setError(data.error || 'Wishlist not found')
        }
      } catch (err) {
        setError('Failed to load wishlist')
      } finally {
        setLoading(false)
      }
    }

    if (params.token) {
      fetchWishlist()
    }
  }, [params.token])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${wishlist?.user?.full_name || 'Someone'}'s Wishlist`,
          text: `Check out this wishlist: ${wishlist?.name}`,
          url
        })
      } catch (err) {
        // AbortError means user cancelled the share dialog — not an error
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Share failed:', err)
          setError('Sharing failed. Please try copying the link instead.')
        }
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAddToCart = (product: NonNullable<WishlistItem['products']>) => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price_pence: product.price_pence,
      image_url: product.image_url
    } as Parameters<typeof addItem>[0])
  }

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--brand-primary)"></div>
      </div>
    )
  }

  if (error || !wishlist) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-(--color-elevated) rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-(--color-text-disabled)" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Wishlist Not Found</h1>
          <p className="text-(--color-text-secondary) mb-6">{error || 'This wishlist may be private or no longer exists.'}</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover)"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  const validItems = wishlist.wishlist_items.filter(item => item.products !== null && item.products.is_active)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-(--color-text-secondary) hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-(--color-error-bg) rounded-full flex items-center justify-center">
              {wishlist.user?.avatar_url ? (
                <Image
                  src={wishlist.user.avatar_url}
                  alt={wishlist.user.full_name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <User className="h-6 w-6 text-(--color-error)" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Heart className="h-6 w-6 text-(--color-error)" />
                {wishlist.name}
              </h1>
              <p className="text-(--color-text-muted)">
                by {wishlist.user?.full_name || 'Someone'} • {validItems.length} items
              </p>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 bg-(--color-elevated) text-(--color-text-secondary) rounded-lg hover:bg-(--color-border)"
          >
            <Share2 className="h-4 w-4" />
            {copied ? 'Link Copied!' : 'Share'}
          </button>
        </div>
      </div>

      {/* Items Grid */}
      {validItems.length === 0 ? (
        <div className="text-center py-12 bg-background rounded-xl">
          <Heart className="h-16 w-16 text-(--color-text-disabled) mx-auto mb-4" />
          <p className="text-(--color-text-muted)">This wishlist is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {validItems.map((item) => {
            const product = item.products!
            const hasDiscount = product.compare_at_price_pence && product.compare_at_price_pence > product.price_pence
            const hasPriceDrop = item.added_price_pence && product.price_pence < item.added_price_pence
            const isOutOfStock = product.stock_quantity <= 0

            return (
              <div key={item.id} className="bg-(--color-surface) rounded-xl border border-(--color-border) overflow-hidden group">
                <Link href={`/products/${product.slug}`} className="block relative aspect-square">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-(--color-elevated) flex items-center justify-center">
                      <ShoppingCart className="h-16 w-16 text-(--color-text-disabled)" />
                    </div>
                  )}
                  {hasPriceDrop && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-(--brand-primary) text-white text-xs font-medium rounded">
                      Price Drop!
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="px-3 py-1 bg-(--color-surface) text-foreground text-sm font-medium rounded">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </Link>

                <div className="p-4">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-(--brand-primary)">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      {formatPrice(product.price_pence)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-(--color-text-muted) line-through">
                        {formatPrice(product.compare_at_price_pence!)}
                      </span>
                    )}
                  </div>

                  {hasPriceDrop && (
                    <p className="text-xs text-(--brand-primary) mt-1">
                      Was {formatPrice(item.added_price_pence!)} when added
                    </p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover) disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </button>
                    <Link
                      href={`/products/${product.slug}`}
                      className="p-2 border border-(--color-border) rounded-lg hover:bg-background"
                    >
                      <ExternalLink className="h-4 w-4 text-(--color-text-secondary)" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
