import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, ArrowRight, Package, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import { Container } from '@/components/layout/Container'

interface NewProduct {
  id: string
  name: string
  slug: string
  imageUrl: string
  pricePence: number
  daysAgo: number
}

export function NewThisWeek({ products }: { products: NewProduct[] }) {
  if (products.length === 0) return null

  return (
    <section className="py-10 lg:py-14">
      <Container size="xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-(--brand-primary-light) flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-(--brand-primary)" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">New This Week</h2>
              <p className="text-sm text-(--color-text-muted)">Fresh additions to our range</p>
            </div>
          </div>
          <Link
            href="/products?sort=newest"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-(--brand-primary) hover:underline"
          >
            View all new <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden hover:shadow-lg hover:border-(--brand-primary) transition-all"
            >
              <div className="aspect-square bg-(--color-elevated) relative overflow-hidden">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-(--color-text-disabled)" />
                  </div>
                )}
                {/* NEW badge */}
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-(--brand-primary) text-white text-[11px] font-bold rounded-md uppercase tracking-wide shadow-sm">
                  New
                </div>
                {/* Days ago */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-(--color-surface)/90 backdrop-blur-sm text-(--color-text-secondary) text-[10px] font-medium rounded-md flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {product.daysAgo === 0 ? 'Today' : product.daysAgo === 1 ? 'Yesterday' : `${product.daysAgo}d ago`}
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-(--brand-primary) transition-colors">
                  {product.name}
                </p>
                <p className="text-sm font-bold text-(--brand-primary) mt-1.5">
                  {formatPrice(product.pricePence)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/products?sort=newest"
          className="sm:hidden flex items-center justify-center gap-1.5 mt-4 text-sm font-medium text-(--brand-primary) hover:underline"
        >
          View all new products <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Container>
    </section>
  )
}
