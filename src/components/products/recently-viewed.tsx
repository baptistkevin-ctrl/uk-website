'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { History, X, Star, ShoppingCart, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store'
import { useCartStore } from '@/stores/cart-store'
import { useRef, useState } from 'react'

interface RecentlyViewedProps {
  title?: string
  maxItems?: number
  showClearButton?: boolean
  layout?: 'horizontal' | 'grid'
  excludeProductId?: string
}

export function RecentlyViewed({
  title = 'Recently Viewed',
  maxItems = 10,
  showClearButton = true,
  layout = 'horizontal',
  excludeProductId
}: RecentlyViewedProps) {
  const { products, clearAll, removeProduct, loadFromServer } = useRecentlyViewedStore()
  const { addItem } = useCartStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Load from server on mount
  useEffect(() => {
    loadFromServer()
  }, [loadFromServer])

  // Filter out excluded product and limit
  const displayProducts = products
    .filter(p => p.product_id !== excludeProductId)
    .slice(0, maxItems)

  // Check scroll state
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
      }
    }

    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
      return () => {
        container.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [displayProducts.length])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`
  }

  const handleAddToCart = (e: React.MouseEvent, product: typeof displayProducts[0]) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      product_id: product.product_id,
      name: product.name,
      price_pence: product.price_pence,
      image_url: product.image_url,
      quantity: 1,
      slug: product.slug
    })
  }

  if (displayProducts.length === 0) {
    return null
  }

  if (layout === 'grid') {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <History className="h-5 w-5 text-gray-500" />
            {title}
          </h2>
          {showClearButton && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayProducts.map((product) => (
            <Link
              key={product.product_id}
              href={`/products/${product.slug}`}
              className="group bg-white rounded-xl border hover:shadow-lg transition-all p-3"
            >
              <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeProduct(product.product_id)
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-green-600">
                {product.name}
              </h3>

              {product.category_name && (
                <p className="text-xs text-gray-500 mb-1">{product.category_name}</p>
              )}

              {product.avg_rating && product.avg_rating > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-600">
                    {product.avg_rating.toFixed(1)}
                    {product.review_count && ` (${product.review_count})`}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900">
                    {formatPrice(product.price_pence)}
                  </span>
                  {product.original_price_pence && product.original_price_pence > product.price_pence && (
                    <span className="text-xs text-gray-400 line-through ml-1">
                      {formatPrice(product.original_price_pence)}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Horizontal scroll layout
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <History className="h-5 w-5 text-gray-500" />
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {showClearButton && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="p-2 rounded-full bg-white border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="p-2 rounded-full bg-white border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayProducts.map((product) => (
          <Link
            key={product.product_id}
            href={`/products/${product.slug}`}
            className="group flex-shrink-0 w-48 bg-white rounded-xl border hover:shadow-lg transition-all p-3"
          >
            <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  removeProduct(product.product_id)
                }}
                className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white text-gray-500 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>

              {product.original_price_pence && product.original_price_pence > product.price_pence && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                  Sale
                </span>
              )}
            </div>

            <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-green-600">
              {product.name}
            </h3>

            {product.avg_rating && product.avg_rating > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-600">
                  {product.avg_rating.toFixed(1)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-900 text-sm">
                  {formatPrice(product.price_pence)}
                </span>
                {product.original_price_pence && product.original_price_pence > product.price_pence && (
                  <span className="text-xs text-gray-400 line-through ml-1">
                    {formatPrice(product.original_price_pence)}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => handleAddToCart(e, product)}
                className="p-1.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
