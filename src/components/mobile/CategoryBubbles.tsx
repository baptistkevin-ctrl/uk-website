'use client'

import Link from 'next/link'
import Image from 'next/image'

interface CategoryBubble {
  name: string
  slug: string
  emoji: string
  image: string
}

const categories: CategoryBubble[] = [
  { name: 'Fresh', slug: 'fresh-produce', emoji: '🥬', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120&h=120&fit=crop&q=80' },
  { name: 'Meat', slug: 'meat-fish', emoji: '🥩', image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=120&h=120&fit=crop&q=80' },
  { name: 'Dairy', slug: 'dairy-eggs', emoji: '🥛', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=120&h=120&fit=crop&q=80' },
  { name: 'Bakery', slug: 'bakery', emoji: '🥐', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&h=120&fit=crop&q=80' },
  { name: 'Pantry', slug: 'pantry', emoji: '🫙', image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=120&h=120&fit=crop&q=80' },
  { name: 'Drinks', slug: 'drinks', emoji: '🧃', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=120&h=120&fit=crop&q=80' },
  { name: 'Frozen', slug: 'frozen', emoji: '🧊', image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=120&h=120&fit=crop&q=80' },
  { name: 'Health', slug: 'health-beauty', emoji: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&h=120&fit=crop&q=80' },
  { name: 'Deals', slug: '../deals', emoji: '🔥', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=120&h=120&fit=crop&q=80' },
]

export function CategoryBubbles() {
  return (
    <section className="pt-5 pb-4 lg:hidden bg-(--color-surface) relative">
      {/* Right fade hint to show more items */}
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-linear-to-l from-(--color-surface) to-transparent z-10 pointer-events-none" />
      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none px-4 pb-1 pr-10">
        {categories.map((cat) => {
          const href = cat.slug.startsWith('..') ? cat.slug.replace('..', '') : `/categories/${cat.slug}`
          return (
            <Link
              key={cat.slug}
              href={href}
              className="shrink-0 flex flex-col items-center gap-1.5 group"
            >
              <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-(--color-border) group-active:scale-90 group-active:border-(--brand-primary) transition-all shadow-sm">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
                {/* Emoji overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="text-2xl drop-shadow-lg">{cat.emoji}</span>
                </div>
              </div>
              <span className="text-xs font-medium text-(--color-text-secondary) group-hover:text-foreground transition-colors">
                {cat.name}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
