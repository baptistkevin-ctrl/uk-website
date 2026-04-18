import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  name: string
  slug: string
  imageUrl?: string
  itemCount?: number
}

interface CategoryGridProps {
  categories: Category[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const tiles = categories.slice(0, 8)

  return (
    <section className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
            Shop by Category
          </h2>
          <Link
            href="/categories"
            className="text-sm font-medium text-(--brand-primary) hover:underline"
          >
            View all &rarr;
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {tiles.map((category, index) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="reveal-up stagger-child group relative overflow-hidden rounded-xl aspect-4/3"
              style={{ '--delay': `${index * 80}ms` } as React.CSSProperties}
            >
              {/* Image or gradient placeholder */}
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className={cn(
                    'object-cover',
                    'transition-transform duration-500 ease-(--ease-premium)',
                    'group-hover:scale-[1.08]',
                  )}
                />
              ) : (
                <div className="absolute inset-0 bg-linear-to-br from-(--brand-primary) to-(--brand-dark)" />
              )}

              {/* Gradient overlay */}
              <div
                className={cn(
                  'absolute inset-0',
                  'bg-linear-to-t from-black/70 via-black/30 to-transparent',
                  'transition-colors duration-(--duration-base)',
                  'group-hover:from-black/80',
                )}
              />

              {/* Text area */}
              <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 flex items-end justify-between">
                <div>
                  <span className="text-sm lg:text-base font-semibold text-white block">
                    {category.name}
                  </span>
                  {category.itemCount != null && (
                    <span className="text-xs text-white/70">
                      {category.itemCount}+ items
                    </span>
                  )}
                </div>

                <ArrowRight
                  className={cn(
                    'h-4 w-4 text-white/0 shrink-0',
                    'transition-all duration-(--duration-base) ease-(--ease-premium)',
                    'group-hover:text-white/80 group-hover:translate-x-1',
                  )}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
