import Link from 'next/link'
import { ArrowLeft, Search, ShoppingBag, Truck, Tag, Leaf, Coffee, Fish, Wheat, Apple } from 'lucide-react'
import { Button } from '@/components/ui/button'

const popularCategories = [
  { name: 'Fresh Produce', slug: 'fresh-produce', icon: Apple, color: 'bg-(--brand-primary-light) text-(--brand-primary)' },
  { name: 'Meat & Fish', slug: 'meat-fish', icon: Fish, color: 'bg-(--color-error)/10 text-(--color-error)' },
  { name: 'Bakery', slug: 'bakery', icon: Wheat, color: 'bg-(--brand-amber)/10 text-(--brand-amber)' },
  { name: 'Drinks', slug: 'drinks', icon: Coffee, color: 'bg-(--color-info-bg) text-(--color-info)' },
  { name: 'Deals', slug: '/deals', icon: Tag, color: 'bg-(--color-success-bg) text-(--color-success)' },
  { name: 'Organic', slug: '/products?is_organic=true', icon: Leaf, color: 'bg-(--brand-primary-light) text-(--brand-primary)' },
]

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="mx-auto max-w-2xl w-full text-center">
        {/* Large 404 */}
        <p className="font-display text-8xl font-bold text-(--brand-primary)/10 lg:text-[10rem] leading-none">
          404
        </p>

        {/* Message */}
        <h1 className="mt-4 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-2 text-(--color-text-muted) max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to shopping.
        </p>

        {/* Search */}
        <div className="relative mx-auto mt-8 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-(--color-text-muted)" />
          <form action="/products" method="GET">
            <input
              type="search"
              name="search"
              placeholder="Search for products..."
              className="h-12 w-full rounded-xl border border-(--color-border) bg-(--color-surface) pl-12 pr-4 text-sm text-foreground placeholder:text-(--color-text-muted) transition-all focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/20 focus:outline-none shadow-sm"
            />
          </form>
        </div>

        {/* CTA buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button size="lg" className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Homepage
            </Button>
          </Link>
          <Link href="/products">
            <Button size="lg" variant="outline">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
          </Link>
        </div>

        {/* Popular Categories */}
        <div className="mt-12">
          <p className="text-sm font-semibold text-(--color-text-muted) uppercase tracking-wider mb-4">Popular Categories</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {popularCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.slug.startsWith('/') ? cat.slug : `/categories/${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-(--color-surface) border border-(--color-border) hover:border-(--brand-primary) hover:shadow-sm transition-all"
              >
                <div className={`h-10 w-10 rounded-lg ${cat.color} flex items-center justify-center`}>
                  <cat.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-foreground">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Trust */}
        <div className="mt-12 flex items-center justify-center gap-6 text-(--color-text-disabled) text-xs">
          <div className="flex items-center gap-1.5">
            <Truck className="h-4 w-4" />
            <span>Free delivery over £50</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="h-4 w-4" />
            <span>5,000+ products</span>
          </div>
        </div>
      </div>
    </div>
  )
}
