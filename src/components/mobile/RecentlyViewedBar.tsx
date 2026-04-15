'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, ChevronRight, ShoppingBag } from 'lucide-react'
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store'
import { formatPrice } from '@/lib/utils/format'

export function RecentlyViewedBar() {
  const { products } = useRecentlyViewedStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted || products.length === 0) return null

  const recentItems = products.slice(0, 10)

  return (
    <section className="py-6">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-(--color-text-muted)" />
            <h2 className="text-base font-bold text-foreground">Recently Viewed</h2>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm font-medium text-(--brand-primary) hover:underline"
          >
            Browse all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
          {recentItems.map((product) => (
            <Link
              key={product.product_id}
              href={`/products/${product.slug}`}
              className="shrink-0 w-28 sm:w-32 group"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-(--color-elevated) border border-(--color-border) mb-1.5 group-hover:border-(--brand-primary)/30 transition-colors">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-(--color-text-muted)">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-foreground line-clamp-1 leading-tight group-hover:text-(--brand-primary) transition-colors">
                {product.name}
              </p>
              <p className="text-xs font-bold text-(--brand-primary)">
                {formatPrice(product.price_pence)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
