'use client'

import Image from 'next/image'
import { Store, MapPin, Calendar, CheckCircle, Package } from 'lucide-react'
import { StarRatingCompact } from '../reviews'
import { cn } from '@/lib/utils/cn'

interface StoreBannerProps {
  vendor: {
    business_name: string
    description: string | null
    logo_url: string | null
    banner_url: string | null
    city: string | null
    rating: number
    review_count: number
    is_verified: boolean
    created_at: string
    product_count: number
  }
  className?: string
}

export function StoreBanner({ vendor, className }: StoreBannerProps) {
  const memberSince = new Date(vendor.created_at).getFullYear()

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Banner Background */}
      <div className="relative h-48 md:h-64 bg-(--brand-primary)">
        {vendor.banner_url && (
          <Image
            src={vendor.banner_url}
            alt={vendor.business_name}
            fill
            className="object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Store Info Overlay */}
      <div className="relative -mt-20 px-4 md:px-8 pb-6">
        <div className="bg-(--color-surface) rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Logo */}
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl bg-background overflow-hidden border-4 border-(--color-surface) shadow-lg -mt-16 md:-mt-20 shrink-0">
              {vendor.logo_url ? (
                <Image
                  src={vendor.logo_url}
                  alt={vendor.business_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-(--brand-primary-light)">
                  <Store className="h-12 w-12 text-(--brand-primary)" />
                </div>
              )}
            </div>

            {/* Store Details */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {vendor.business_name}
                </h1>
                {vendor.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-(--brand-primary-light) text-(--brand-primary) text-xs font-medium px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 mt-3 justify-center md:justify-start">
                {vendor.rating > 0 && (
                  <StarRatingCompact
                    rating={vendor.rating}
                    reviewCount={vendor.review_count}
                    size="md"
                  />
                )}

                <div className="flex items-center gap-1 text-(--color-text-secondary)">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">{vendor.product_count} products</span>
                </div>

                {vendor.city && (
                  <div className="flex items-center gap-1 text-(--color-text-secondary)">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{vendor.city}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-(--color-text-secondary)">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Seller since {memberSince}</span>
                </div>
              </div>

              {/* Description */}
              {vendor.description && (
                <p className="mt-4 text-(--color-text-secondary) text-sm md:text-base max-w-2xl">
                  {vendor.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact store header for product cards
export function VendorBadge({
  vendor,
  className,
}: {
  vendor: {
    business_name: string
    slug: string
    logo_url: string | null
    is_verified: boolean
  }
  className?: string
}) {
  return (
    <a
      href={`/store/${vendor.slug}`}
      className={cn(
        'inline-flex items-center gap-2 text-sm text-(--color-text-secondary) hover:text-(--brand-primary) transition-colors',
        className
      )}
    >
      <div className="relative w-5 h-5 rounded-full overflow-hidden bg-background shrink-0">
        {vendor.logo_url ? (
          <Image
            src={vendor.logo_url}
            alt={vendor.business_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Store className="h-3 w-3 text-(--color-text-muted)" />
          </div>
        )}
      </div>
      <span className="truncate">{vendor.business_name}</span>
      {vendor.is_verified && (
        <CheckCircle className="h-3 w-3 text-(--brand-primary) shrink-0" />
      )}
    </a>
  )
}
