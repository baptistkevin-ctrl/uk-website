'use client'

import { useTrackView } from '@/hooks/use-track-view'
import { RecentlyViewed } from './recently-viewed'

interface ProductData {
  id: string
  name: string
  slug: string
  price_pence: number
  compare_at_price_pence?: number | null
  image_url: string | null
  category_name?: string | null
  avg_rating?: number | null
  review_count?: number | null
}

interface ProductViewTrackerProps {
  product: ProductData
  showRecentlyViewed?: boolean
}

export function ProductViewTracker({ product, showRecentlyViewed = true }: ProductViewTrackerProps) {
  // Track the product view
  useTrackView({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price_pence: product.price_pence,
    original_price_pence: product.compare_at_price_pence,
    image_url: product.image_url,
    category_name: product.category_name,
    avg_rating: product.avg_rating,
    review_count: product.review_count
  })

  if (!showRecentlyViewed) {
    return null
  }

  return (
    <div className="mt-12">
      <RecentlyViewed
        excludeProductId={product.id}
        title="Recently Viewed"
        maxItems={6}
      />
    </div>
  )
}
