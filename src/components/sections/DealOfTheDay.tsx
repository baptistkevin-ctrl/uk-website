import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CountdownTimer } from '@/components/deals/CountdownTimer'

interface DealOfTheDayProps {
  deal: {
    productName: string
    productSlug: string
    productImageUrl: string
    originalPrice: number
    dealPrice: number
    endsAt: string
  } | null
}

export function DealOfTheDay({ deal }: DealOfTheDayProps) {
  if (!deal) return null

  const savingsPercent = Math.round(
    ((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100
  )

  return (
    <section className="reveal-fade max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div
        className={cn(
          'relative overflow-hidden',
          'rounded-2xl',
          'bg-(--brand-amber-soft)',
          'border-l-4 border-(--brand-amber)'
        )}
      >
        {/* Subtle mesh background */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background:
              'radial-gradient(circle at 80% 50%, var(--brand-amber) 0%, transparent 60%)',
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
          {/* Product image */}
          <div className="relative h-24 w-24 sm:h-32 sm:w-32 shrink-0 rounded-xl overflow-hidden shadow-(--shadow-md)">
            <Image
              src={deal.productImageUrl}
              alt={deal.productName}
              fill
              className="object-cover"
              sizes="(min-width: 640px) 128px, 96px"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="rounded-full bg-(--brand-amber) text-white text-xs font-bold px-2.5 py-0.5">
                DEAL OF THE DAY
              </span>
              <span className="text-xs font-semibold text-(--brand-amber)">
                Save {savingsPercent}%
              </span>
            </div>

            <h3 className="font-display text-xl font-semibold text-foreground leading-tight truncate">
              {deal.productName}
            </h3>

            <div className="mt-1.5 flex items-baseline gap-2 justify-center sm:justify-start font-mono">
              <span className="text-2xl font-bold text-foreground">
                &pound;{deal.dealPrice.toFixed(2)}
              </span>
              <span className="text-sm text-(--color-text-muted) line-through">
                &pound;{deal.originalPrice.toFixed(2)}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-4 flex-wrap justify-center sm:justify-start">
              <CountdownTimer
                endTime={deal.endsAt}
                size="sm"
                showIcon
              />

              <Link
                href={`/products/${deal.productSlug}`}
                className={cn(
                  'inline-flex items-center gap-1.5',
                  'rounded-full px-4 py-2',
                  'bg-(--brand-amber) text-white text-sm font-semibold',
                  'hover:bg-(--brand-amber-hover)',
                  'transition-colors duration-(--duration-fast) ease-(--ease-premium)'
                )}
              >
                Shop Deal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
