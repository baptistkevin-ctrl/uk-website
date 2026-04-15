'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Zap, ArrowRight, Clock } from 'lucide-react'
import { CountdownTimer } from './CountdownTimer'
import { cn } from '@/lib/utils/cn'

interface DealBannerProps {
  deal: {
    id: string
    title: string
    slug: string
    description: string | null
    deal_price_pence: number
    original_price_pence: number
    discount_percentage: number
    ends_at: string
    banner_image_url: string | null
    products: {
      id: string
      name: string
      slug: string
      image_url: string | null
    } | null
  }
  className?: string
}

export function DealBanner({ deal, className }: DealBannerProps) {
  const product = deal.products
  const savings = deal.original_price_pence - deal.deal_price_pence

  return (
    <div className={cn(
      'relative bg-linear-to-r from-red-600 to-orange-500 rounded-2xl overflow-hidden',
      className
    )}>
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
        {/* Content */}
        <div className="flex-1 text-white text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <Zap className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              Flash Deal
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {deal.title || product?.name}
          </h2>

          {deal.description && (
            <p className="text-white/90 text-sm md:text-base mb-4 max-w-md">
              {deal.description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
            <span className="text-3xl md:text-4xl font-black">
              £{(deal.deal_price_pence / 100).toFixed(2)}
            </span>
            <div className="flex flex-col">
              <span className="text-white/70 line-through text-sm">
                £{(deal.original_price_pence / 100).toFixed(2)}
              </span>
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded">
                SAVE £{(savings / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-(--color-surface)/20 rounded-lg p-3 inline-block mb-4">
            <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
              <Clock className="h-3 w-3" />
              <span>Offer ends in:</span>
            </div>
            <CountdownTimer
              endTime={deal.ends_at}
              size="md"
              showIcon={false}
              className="text-white"
            />
          </div>

          {/* CTA */}
          {product && (
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex items-center gap-2 bg-(--color-surface) text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-(--color-elevated) transition-colors"
            >
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Product Image */}
        {(deal.banner_image_url || product?.image_url) && (
          <div className="relative w-48 h-48 md:w-64 md:h-64 shrink-0">
            <div className="absolute inset-0 bg-(--color-surface)/10 rounded-full blur-3xl" />
            <Image
              src={deal.banner_image_url || product?.image_url || ''}
              alt={product?.name || deal.title}
              fill
              className="object-contain drop-shadow-2xl relative z-10"
            />
            {/* Discount Badge */}
            <div className="absolute -top-2 -right-2 z-20 bg-yellow-400 text-yellow-900 w-16 h-16 rounded-full flex items-center justify-center font-black text-lg shadow-lg">
              -{deal.discount_percentage}%
            </div>
          </div>
        )}
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
    </div>
  )
}

// Smaller banner for sidebar or mobile
export function DealBannerCompact({
  deal,
  className,
}: DealBannerProps) {
  const product = deal.products

  return (
    <Link
      href={product ? `/products/${product.slug}` : '#'}
      className={cn(
        'block bg-linear-to-r from-red-600 to-orange-500 rounded-xl overflow-hidden hover:shadow-lg transition-shadow',
        className
      )}
    >
      <div className="flex items-center gap-4 p-4">
        {(deal.banner_image_url || product?.image_url) && (
          <div className="relative w-16 h-16 shrink-0 bg-(--color-surface)/20 rounded-lg overflow-hidden">
            <Image
              src={deal.banner_image_url || product?.image_url || ''}
              alt={product?.name || deal.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0 text-white">
          <div className="flex items-center gap-1 text-xs font-semibold mb-1">
            <Zap className="h-3 w-3" />
            -{deal.discount_percentage}% OFF
          </div>
          <h4 className="font-bold truncate">{deal.title || product?.name}</h4>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold">
              £{(deal.deal_price_pence / 100).toFixed(2)}
            </span>
            <span className="text-white/70 line-through text-xs">
              £{(deal.original_price_pence / 100).toFixed(2)}
            </span>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-white/70" />
      </div>
    </Link>
  )
}
