'use client'

import { useState } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { X, ChevronRight, ChevronDown, Flame, Package, Heart, HelpCircle, Phone, User, Search, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CategoryItem {
  name: string
  slug: string
  subcategories: string[]
}

const CATEGORIES: CategoryItem[] = [
  {
    name: 'Fresh Produce',
    slug: 'fresh-produce',
    subcategories: ['Vegetables', 'Fruit', 'Herbs & Garlic', 'Organic'],
  },
  {
    name: 'Meat & Fish',
    slug: 'meat-fish',
    subcategories: ['Beef', 'Chicken', 'Lamb', 'Seafood', 'Plant-based'],
  },
  {
    name: 'Dairy & Eggs',
    slug: 'dairy-eggs',
    subcategories: ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Eggs'],
  },
  {
    name: 'Bakery',
    slug: 'bakery',
    subcategories: ['Bread', 'Pastries', 'Cakes', 'Gluten-free'],
  },
  {
    name: 'Pantry',
    slug: 'pantry',
    subcategories: ['Rice', 'Pasta', 'Canned Goods', 'Sauces'],
  },
  {
    name: 'Drinks',
    slug: 'drinks',
    subcategories: ['Water', 'Juices', 'Tea', 'Coffee', 'Alcohol'],
  },
  {
    name: 'Frozen Foods',
    slug: 'frozen-foods',
    subcategories: ['Ready Meals', 'Ice Cream', 'Frozen Veg'],
  },
  {
    name: 'Health & Beauty',
    slug: 'health-beauty',
    subcategories: ['Vitamins', 'Personal Care', 'Household'],
  },
] as const

function CategoryRow({
  category,
  onNavigate,
}: {
  category: CategoryItem
  onNavigate: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b border-(--color-border)">
      <div className="flex items-center">
        <Link
          href={`/categories/${category.slug}`}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium',
            'text-foreground',
            'transition-colors hover:text-(--brand-primary)'
          )}
          onClick={onNavigate}
        >
          {category.name}
        </Link>
        {category.subcategories.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={cn(
              'flex h-full items-center px-4 py-3',
              'text-(--color-text-muted)',
              'transition-transform duration-(--duration-base)'
            )}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.name}`}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Subcategories */}
      {expanded && category.subcategories.length > 0 && (
        <div className="bg-(--color-elevated) pb-2">
          {category.subcategories.map((sub) => {
            const subSlug = sub.toLowerCase().replace(/[&\s]+/g, '-')
            return (
              <Link
                key={sub}
                href={`/categories/${category.slug}/${subSlug}`}
                className={cn(
                  'block px-8 py-2.5 text-sm',
                  'text-(--color-text-secondary)',
                  'transition-colors hover:text-(--brand-primary)'
                )}
                onClick={onNavigate}
              >
                {sub}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const closeDrawer = () => onOpenChange(false)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-(--z-overlay) bg-black/50',
            'data-state-open:animate-in data-state-open:fade-in-0',
            'data-state-closed:animate-out data-state-closed:fade-out-0'
          )}
        />

        {/* Drawer panel */}
        <Dialog.Content
          className={cn(
            'fixed right-0 top-0 z-(--z-overlay) h-full',
            'w-[85vw] max-w-[320px] sm:w-95',
            'bg-(--color-surface)',
            'shadow-(--shadow-2xl)',
            'overflow-y-auto',
            'outline-none',
            'data-state-open:animate-in data-state-open:slide-in-from-right',
            'data-state-closed:animate-out data-state-closed:slide-out-to-right',
            'duration-(--duration-base)'
          )}
        >
          {/* Close button */}
          <Dialog.Close asChild>
            <button
              type="button"
              className={cn(
                'absolute right-4 top-4 rounded-md p-2',
                'text-(--color-text-muted)',
                'transition-colors hover:bg-(--color-elevated) hover:text-foreground'
              )}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>

          <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>

          {/* Search bar */}
          <div className="border-b border-(--color-border) px-4 pb-3 pt-14">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--color-text-muted)" />
              <input
                type="text"
                placeholder="Search for groceries..."
                className="w-full h-11 rounded-lg border border-(--color-border) bg-(--color-elevated) pl-10 pr-3 text-sm text-foreground placeholder:text-(--color-text-muted) focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/30 outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value.trim())}`
                    closeDrawer()
                  }
                }}
              />
            </div>
          </div>

          {/* Delivery area */}
          <div className="border-b border-(--color-border) px-4 py-3">
            <div className="flex items-center gap-3 rounded-lg bg-(--color-elevated) p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--brand-primary)/10">
                <MapPin className="h-4 w-4 text-(--brand-primary)" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-(--color-text-muted)">Deliver to</p>
                <p className="text-sm font-medium text-foreground truncate">SW1A 1AA</p>
              </div>
              <ChevronRight className="h-4 w-4 text-(--color-text-muted) shrink-0" />
            </div>
          </div>

          {/* User section */}
          <div className="border-b border-(--color-border) px-4 pb-4 pt-4">
            <Link
              href="/login"
              className={cn(
                'flex items-center gap-3 rounded-lg p-3',
                'bg-(--color-elevated)',
                'transition-colors hover:bg-(--brand-primary)/10'
              )}
              onClick={closeDrawer}
            >
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center',
                  'rounded-full bg-(--brand-primary)/10'
                )}
              >
                <User className="h-5 w-5 text-(--brand-primary)" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Sign In
                </p>
                <p className="text-xs text-(--color-text-muted)">
                  Access your account
                </p>
              </div>
            </Link>
          </div>

          {/* All Departments header */}
          <div className="px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
              All Departments
            </h3>
          </div>

          {/* Category list */}
          <div>
            {CATEGORIES.map((category) => (
              <CategoryRow
                key={category.slug}
                category={category}
                onNavigate={closeDrawer}
              />
            ))}
          </div>

          {/* Quick links */}
          <div className="border-t border-(--color-border) py-2">
            <Link
              href="/deals"
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium',
                'text-foreground',
                'transition-colors hover:bg-(--color-elevated)'
              )}
              onClick={closeDrawer}
            >
              <Flame className="h-4 w-4 text-(--brand-amber)" />
              Today&apos;s Deals
            </Link>
            <Link
              href="/account/orders"
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium',
                'text-foreground',
                'transition-colors hover:bg-(--color-elevated)'
              )}
              onClick={closeDrawer}
            >
              <Package className="h-4 w-4 text-(--color-text-muted)" />
              My Orders
            </Link>
            <Link
              href="/wishlist"
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium',
                'text-foreground',
                'transition-colors hover:bg-(--color-elevated)'
              )}
              onClick={closeDrawer}
            >
              <Heart className="h-4 w-4 text-(--color-text-muted)" />
              Wishlist
            </Link>
          </div>

          {/* Help section */}
          <div className="border-t border-(--color-border) py-2">
            <Link
              href="/help"
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm',
                'text-(--color-text-secondary)',
                'transition-colors hover:bg-(--color-elevated) hover:text-foreground'
              )}
              onClick={closeDrawer}
            >
              <HelpCircle className="h-4 w-4" />
              Help Centre
            </Link>
            <Link
              href="/contact"
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm',
                'text-(--color-text-secondary)',
                'transition-colors hover:bg-(--color-elevated) hover:text-foreground'
              )}
              onClick={closeDrawer}
            >
              <Phone className="h-4 w-4" />
              Contact Us
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
