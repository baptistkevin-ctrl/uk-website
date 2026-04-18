'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  User,
  Menu,
  LogOut,
  Package,
  Heart,
  Clock,
  MapPin,
} from 'lucide-react'
import { GlobalSearch } from '@/components/ui/search'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils/cn'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { useWishlistStore } from '@/hooks/use-wishlist'
import { MobileDrawer } from '@/components/layout/MobileDrawer'

/* ─── Category nav data ──────────────────────────────── */
const navCategories = [
  { name: 'Fresh Produce', slug: 'fresh-produce' },
  { name: 'Meat & Fish', slug: 'meat-fish' },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs' },
  { name: 'Bakery', slug: 'bakery' },
  { name: 'Pantry', slug: 'pantry' },
  { name: 'Drinks', slug: 'drinks' },
  { name: 'Frozen', slug: 'frozen' },
  { name: 'Health & Beauty', slug: 'health-beauty' },
] as const

export function Header() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [postcodeOpen, setPostcodeOpen] = useState(false)
  const [postcode, setPostcode] = useState('SW1A 1AA')
  const [postcodeInput, setPostcodeInput] = useState('')

  const { itemCount, openCart } = useCart()
  const { user, signOut } = useAuth()
  const wishlistCount = useWishlistStore((s) => s.productIds.size)

  /* ─── Scroll listener ──────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={cn(
          'sticky top-0 w-full transition-all duration-300',
          'z-(--z-sticky)',
          isScrolled
            ? 'nav-glass'
            : 'bg-(--color-surface) border-b border-(--color-border)'
        )}
      >
        {/* ── Main bar ───────────────────────────────── */}
        <div className="mx-auto max-w-7xl h-16 flex items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'md:hidden flex items-center justify-center',
              'h-10 w-10 rounded-md',
              'border border-(--color-border)',
              'text-(--color-text-secondary)',
              'hover:bg-(--color-elevated)',
              'transition-colors duration-(--duration-fast)'
            )}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 flex items-center gap-2.5 group"
          >
            <div className="h-9 w-9 rounded-xl bg-(--brand-primary) flex items-center justify-center shadow-[0_2px_8px_rgba(27,107,58,0.3)] group-hover:shadow-[0_4px_12px_rgba(27,107,58,0.4)] transition-shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.16 6.66l-.67-1.33C6.3 4.93 5.91 4.5 5.34 4.5H2v2h2l3.6 7.59-1.35 2.44C6.09 16.86 6 17.17 6 17.5c0 1.1.9 2 2 2h12v-2H8.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0021 7H6.21l-.94-2H2" fill="currentColor"/>
                <circle cx="12" cy="10" r="3" fill="rgba(232,134,26,0.9)"/>
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold text-(--brand-dark) tracking-tight">
                UK Grocery
              </span>
              <span className="text-[11px] font-medium text-(--color-text-muted) tracking-[0.12em] uppercase mt-0.5">
                Fresh to your door
              </span>
            </div>
          </Link>

          {/* Search — desktop only */}
          <div className="hidden md:block flex-1 max-w-2xl mx-auto">
            <GlobalSearch variant="header" placeholder="Search for groceries..." />
          </div>

          {/* Delivery postcode */}
          <div className="relative shrink-0 hidden sm:block">
            <button
              onClick={() => setPostcodeOpen(!postcodeOpen)}
              aria-label={`Change delivery postcode — currently ${postcode}`}
              className={cn(
                'flex items-center gap-2',
                'border border-(--color-border) rounded-lg',
                'px-3 py-2 text-sm',
                'hover:bg-(--color-elevated)',
                'transition-colors duration-(--duration-fast)'
              )}
            >
              <Clock className="h-4 w-4 text-(--color-text-muted)" />
              <div className="text-left">
                <p className="text-[11px] leading-tight text-(--color-text-muted)">
                  Deliver to
                </p>
                <p className="text-xs font-medium text-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {postcode}
                </p>
              </div>
            </button>

            {/* Postcode popover */}
            {postcodeOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPostcodeOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-72 rounded-xl border border-(--color-border) bg-(--color-surface) shadow-(--shadow-xl) p-4 z-50">
                  <p className="text-sm font-semibold text-foreground mb-1">Enter your postcode</p>
                  <p className="text-xs text-(--color-text-muted) mb-3">We'll show delivery availability for your area</p>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    if (postcodeInput.trim()) {
                      setPostcode(postcodeInput.trim().toUpperCase())
                      setPostcodeOpen(false)
                      setPostcodeInput('')
                    }
                  }}>
                    <input
                      type="text"
                      value={postcodeInput}
                      onChange={(e) => setPostcodeInput(e.target.value)}
                      placeholder="e.g. SW1A 1AA"
                      className="w-full h-10 rounded-lg border border-(--color-border) bg-background px-3 text-sm text-foreground placeholder:text-(--color-text-muted) focus:border-(--brand-primary) focus:ring-2 focus:ring-(--brand-primary)/30 outline-none mb-2"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full h-9 rounded-lg bg-(--brand-primary) text-white text-sm font-semibold hover:bg-(--brand-primary-hover) transition-colors"
                    >
                      Update postcode
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>

          {/* Account */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center justify-center',
                    'h-10 w-10 rounded-md',
                    'border border-(--color-border)',
                    'text-(--color-text-secondary)',
                    'hover:bg-(--color-elevated)',
                    'transition-colors duration-(--duration-fast)'
                  )}
                  aria-label="Account menu"
                >
                  <User className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-9999">
                <div className="px-3 py-3 border-b border-(--color-border)">
                  <p className="text-sm font-semibold truncate text-foreground">
                    {user.email}
                  </p>
                  <p className="text-xs text-(--color-text-muted) mt-0.5">Manage your account</p>
                </div>
                <DropdownMenuItem onClick={() => window.location.href = '/account'} className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" /> My Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/account/orders'} className="flex items-center gap-2 cursor-pointer">
                  <Package className="h-4 w-4" /> Orders
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/account/wishlist'} className="flex items-center gap-2 cursor-pointer">
                  <Heart className="h-4 w-4" />
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="ml-auto text-xs text-(--color-text-muted)">
                      {wishlistCount}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <button
                className={cn(
                  'flex items-center justify-center',
                  'h-10 w-10 rounded-md',
                  'border border-(--color-border)',
                  'text-(--color-text-secondary)',
                  'hover:bg-(--color-elevated)',
                  'transition-colors duration-(--duration-fast)'
                )}
                aria-label="Sign in"
              >
                <User className="h-5 w-5" />
              </button>
            </Link>
          )}

          {/* Cart — the star */}
          <button
            onClick={openCart}
            className={cn(
              'flex items-center gap-2',
              'bg-(--brand-amber) rounded-lg',
              'px-4 h-10 text-white font-medium text-sm',
              'shadow-(--shadow-amber)',
              'hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(232,134,26,0.4)]',
              'active:translate-y-0',
              'transition-all duration-(--duration-base)',
              'ease-(--ease-premium)'
            )}
            aria-label="Open basket"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden sm:inline">Basket</span>
            {itemCount > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center',
                  'h-5 min-w-[20px] px-1 rounded-full',
                  'bg-(--color-surface) text-(--brand-amber)',
                  'text-xs font-bold leading-none'
                )}
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Category nav row — desktop only ────────── */}
        <nav
          className={cn(
            'hidden md:flex',
            'border-t border-(--color-border)'
          )}
        >
          <div
            className={cn(
              'mx-auto max-w-7xl w-full h-11',
              'flex items-center gap-1 px-4 sm:px-6 lg:px-8',
              'overflow-x-auto scrollbar-none'
            )}
          >
            {/* All Departments */}
            <Link
              href="/categories"
              className={cn(
                'shrink-0 flex items-center gap-1.5',
                'rounded-md px-3 py-1.5',
                'text-sm font-medium whitespace-nowrap',
                'text-foreground',
                'hover:bg-(--color-elevated)',
                'transition-colors duration-(--duration-fast)',
                pathname === '/categories' && 'bg-(--color-elevated)'
              )}
            >
              <Menu className="h-4 w-4" />
              All Departments
            </Link>

            {/* Separator */}
            <div className="w-px h-5 bg-(--color-border) shrink-0 mx-0.5" />

            {/* Category links */}
            {navCategories.map((cat) => {
              const href = `/categories/${cat.slug}`
              const isActive = pathname === href
              return (
                <Link
                  key={cat.slug}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-1.5',
                    'text-sm whitespace-nowrap',
                    'transition-colors duration-(--duration-fast)',
                    isActive
                      ? 'bg-(--color-elevated) text-foreground font-medium'
                      : 'text-(--color-text-secondary) hover:bg-(--color-elevated)'
                  )}
                >
                  {cat.name}
                </Link>
              )
            })}

            {/* Separator */}
            <div className="w-px h-5 bg-(--color-border) shrink-0 mx-0.5" />

            {/* Deals pill */}
            <Link
              href="/deals"
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5',
                'text-sm font-medium whitespace-nowrap',
                'transition-colors duration-(--duration-fast)',
                pathname === '/deals'
                  ? 'bg-(--brand-amber) text-white'
                  : 'bg-(--brand-amber-soft) text-(--brand-amber) hover:bg-(--brand-amber) hover:text-white'
              )}
            >
              Deals 🔥
            </Link>
          </div>
        </nav>

        {/* ── Mobile search row ───────────────────── */}
        <div className="md:hidden border-t border-(--color-border) px-4 py-2">
          <GlobalSearch variant="header" placeholder="Search for groceries..." />
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}
