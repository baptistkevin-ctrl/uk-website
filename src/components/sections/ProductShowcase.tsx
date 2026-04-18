import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatPrice } from '@/lib/utils/format'

interface ShowcaseProduct {
  id: string
  name: string
  slug: string
  imageUrl: string
  pricePence: number
  compareAtPricePence?: number
  brand?: string
  isOrganic?: boolean
}

interface ProductShowcaseProps {
  title: string
  subtitle?: string
  viewAllHref?: string
  products: ShowcaseProduct[]
  layout?: 'scroll' | 'grid'
  columns?: 3 | 4 | 5 | 6
  badgeText?: string
  badgeColor?: string
}

function ProductCard({
  product,
  badgeText,
  badgeColor,
}: {
  product: ShowcaseProduct
  badgeText?: string
  badgeColor?: string
}) {
  const hasSale =
    product.compareAtPricePence !== undefined &&
    product.compareAtPricePence > product.pricePence

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group rounded-2xl border border-(--color-border) bg-(--color-surface) overflow-hidden',
        'hover:-translate-y-1 hover:shadow-(--shadow-lg) transition-all duration-300'
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 ease-(--ease-premium) group-hover:scale-105"
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 200px, 180px"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {badgeText && (
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white',
                badgeColor ?? 'bg-(--brand-primary)'
              )}
            >
              {badgeText}
            </span>
          )}
          {product.isOrganic && (
            <span className="rounded-full bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5">
              ORGANIC
            </span>
          )}
          {hasSale && (
            <span className="rounded-full bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5">
              SALE
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {product.brand && (
          <p className="text-[11px] uppercase tracking-wider text-(--color-text-muted)">
            {product.brand}
          </p>
        )}
        <p className="text-sm font-medium text-foreground line-clamp-2 mt-0.5">
          {product.name}
        </p>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="font-mono text-sm font-bold text-foreground">
            {formatPrice(product.pricePence)}
          </span>
          {hasSale && product.compareAtPricePence !== undefined && (
            <span className="font-mono text-xs text-(--color-text-muted) line-through">
              {formatPrice(product.compareAtPricePence)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

const COLUMN_MAP: Record<number, string> = {
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-3 lg:grid-cols-4',
  5: 'md:grid-cols-3 lg:grid-cols-5',
  6: 'md:grid-cols-4 lg:grid-cols-6',
}

export function ProductShowcase({
  title,
  subtitle,
  viewAllHref,
  products,
  layout = 'scroll',
  columns = 4,
  badgeText,
  badgeColor,
}: ProductShowcaseProps) {
  return (
    <section className="py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-(--color-text-secondary) mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1 text-sm font-medium text-(--brand-primary) hover:underline shrink-0"
            >
              See all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Products */}
        {layout === 'scroll' ? (
          <div className="flex gap-2.5 sm:gap-3 lg:gap-4 overflow-x-auto scrollbar-hide pb-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="shrink-0 w-40 sm:w-50 lg:w-60"
              >
                <ProductCard
                  product={product}
                  badgeText={badgeText}
                  badgeColor={badgeColor}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              'grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4',
              COLUMN_MAP[columns]
            )}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                badgeText={badgeText}
                badgeColor={badgeColor}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
