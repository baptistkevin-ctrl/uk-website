'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User,
  Package,
  RotateCcw,
  MapPin,
  Heart,
  Gift,
  Users,
  Bell,
  MessageSquare,
  CreditCard,
  Shield,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const accountLinks = [
  { href: '/account', label: 'Overview', icon: User },
  { href: '/account/profile', label: 'Profile', icon: User },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/returns', label: 'Returns', icon: RotateCcw },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/rewards', label: 'Rewards', icon: Gift },
  { href: '/account/referrals', label: 'Referrals', icon: Users },
  { href: '/account/notifications', label: 'Notifications', icon: Bell },
  { href: '/account/tickets', label: 'Tickets', icon: MessageSquare },
  { href: '/account/payments', label: 'Payments', icon: CreditCard },
  { href: '/account/security', label: 'Security', icon: Shield },
  { href: '/account/settings', label: 'Settings', icon: Settings },
]

export function AccountSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/account' ? pathname === '/account' : pathname.startsWith(href)

  return (
    <>
      {/* Mobile: horizontal scrollable nav */}
      <nav className="lg:hidden -mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 pb-2 min-w-max">
          {accountLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors shrink-0',
                  active
                    ? 'bg-(--brand-primary) text-white font-medium'
                    : 'bg-(--color-surface) border border-(--color-border) text-(--color-text-secondary)'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop: vertical sidebar */}
      <nav className="hidden lg:block rounded-xl border border-(--color-border) bg-(--color-surface) p-3 space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-(--color-text-muted) px-3 pb-2 mb-1">
          My Account
        </p>

        {accountLinks.map((link) => {
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-(--brand-primary-light) text-(--brand-primary) font-medium'
                  : 'text-(--color-text-secondary) hover:bg-(--color-elevated) hover:text-foreground'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
