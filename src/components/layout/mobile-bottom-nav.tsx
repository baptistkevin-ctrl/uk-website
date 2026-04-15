'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, Zap, ShoppingCart, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useCart } from '@/hooks/use-cart'

const tabs = [
  { href: '/', label: 'Home', icon: Home, matchExact: true },
  { href: '/categories', label: 'Categories', icon: Grid3X3 },
  { href: '/deals', label: 'Deals', icon: Zap },
  { href: '/cart', label: 'Cart', icon: ShoppingCart, isCart: true },
  { href: '/account', label: 'Account', icon: User },
] as const

export function MobileBottomNav() {
  const pathname = usePathname()
  const { itemCount, openCart } = useCart()

  const isActive = (tab: (typeof tabs)[number]) => {
    if ('matchExact' in tab && tab.matchExact) return pathname === tab.href
    return pathname.startsWith(tab.href)
  }

  // Hide on admin, vendor, and checkout pages
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/checkout')
  ) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-(--z-sticky) bg-(--color-surface) border-t border-(--color-border) lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab)
          const isCartTab = 'isCart' in tab && tab.isCart

          const content = (
            <div
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors min-w-12',
                active ? 'text-(--brand-primary)' : 'text-(--color-text-disabled)'
              )}
            >
              <div className="relative">
                <tab.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.5} />
                {isCartTab && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 h-4 min-w-4 rounded-full bg-(--color-error) text-white text-[11px] font-bold flex items-center justify-center px-1">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </div>
              <span className={cn('text-[11px] leading-tight', active && 'font-semibold')}>
                {tab.label}
              </span>
            </div>
          )

          // Cart opens the MiniCart sheet instead of navigating
          if (isCartTab) {
            return (
              <button
                key={tab.href}
                onClick={openCart}
                className="flex-1 h-full"
                aria-label="Open basket"
              >
                {content}
              </button>
            )
          }

          return (
            <Link key={tab.href} href={tab.href} className="flex-1 h-full">
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
