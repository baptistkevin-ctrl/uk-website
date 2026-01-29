'use client'

import { useEffect, useRef } from 'react'
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store'

interface ProductData {
  id: string
  name: string
  slug: string
  price_pence: number
  original_price_pence?: number | null
  image_url: string | null
  category_name?: string | null
  avg_rating?: number | null
  review_count?: number | null
}

/**
 * Hook to track product views
 * Call this on product detail pages to track the view
 */
export function useTrackView(product: ProductData | null) {
  const { addProduct } = useRecentlyViewedStore()
  const hasTracked = useRef(false)

  useEffect(() => {
    // Only track once per mount
    if (hasTracked.current || !product) return
    hasTracked.current = true

    // Add to recently viewed store
    addProduct({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price_pence: product.price_pence,
      original_price_pence: product.original_price_pence,
      image_url: product.image_url,
      category_name: product.category_name,
      avg_rating: product.avg_rating,
      review_count: product.review_count
    })
  }, [product, addProduct])
}

/**
 * Track view imperatively (for server components or other scenarios)
 */
export async function trackProductView(
  productId: string,
  sessionId?: string
) {
  try {
    await fetch('/api/recently-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        session_id: sessionId
      })
    })
  } catch (error) {
    console.error('Failed to track view:', error)
  }
}
