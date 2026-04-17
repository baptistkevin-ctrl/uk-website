'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  CreditCard,
  BarChart3,
  Menu,
  X,
  Store,
  LogOut,
  HelpCircle,
  ExternalLink,
  Star,
  Ticket,
  Tag,
  Gift,
  Zap,
  BellRing,
  Bell,
  Users,
  RotateCcw,
  ChefHat,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Spinner } from '@/components/ui/Spinner'

const vendorNavItems = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/products', label: 'Products', icon: Package },
  { href: '/vendor/recipes', label: 'Recipes', icon: ChefHat },
  { href: '/vendor/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/vendor/returns', label: 'Returns', icon: RotateCcw },
  { href: '/vendor/reviews', label: 'Reviews', icon: Star },
  { href: '/vendor/coupons', label: 'Coupons', icon: Ticket },
  { href: '/vendor/offers', label: 'Multi-Buy Offers', icon: Tag },
  { href: '/vendor/gift-cards', label: 'Gift Cards', icon: Gift },
  { href: '/vendor/deals', label: 'Flash Deals', icon: Zap },
  { href: '/vendor/stock-alerts', label: 'Stock Alerts', icon: BellRing },
  { href: '/vendor/live-chat', label: 'Live Chat', icon: MessageCircle },
  { href: '/vendor/customers', label: 'Customers', icon: Users },
  { href: '/vendor/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/vendor/payouts', label: 'Payouts', icon: CreditCard },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
]

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut, loading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [vendorData, setVendorData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    // Skip auth check for vendor login page
    if (pathname === '/vendor/login') {
      setLoading(false)
      return
    }

    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    const checkVendorAccess = async () => {
      if (!user) {
        router.push('/vendor/login')
        return
      }

      try {
        const res = await fetch('/api/vendor/register')
        const data = await res.json()

        if (!data.isVendor) {
          // Not a vendor, redirect to sell page
          router.push('/sell')
          return
        }

        setVendorData(data.vendor)

        // Fetch alert count for notification badge
        try {
          const statsRes = await fetch('/api/vendor/stats')
          if (statsRes.ok) {
            const stats = await statsRes.json()
            setAlertCount((stats.pendingOrders || 0) + (stats.lowStockCount || 0) + (stats.pendingReviews || 0))
          }
        } catch {
          // Non-critical
        }
      } catch (error) {
        console.error('Vendor check error:', error)
        router.push('/vendor/login')
      } finally {
        setLoading(false)
      }
    }

    checkVendorAccess()
  }, [user, authLoading, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Spinner size="lg" />
        <p className="text-sm text-(--color-text-muted)">Checking access...</p>
      </div>
    )
  }

  // Render login page without sidebar
  if (pathname === '/vendor/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-(--z-sticky) bg-(--color-surface) border-b border-(--color-border) px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-(--color-elevated) transition-colors duration-(--duration-fast)"
        >
          {sidebarOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
        </button>
        <Link href="/vendor/dashboard" className="flex items-center gap-2">
          <Store className="h-5 w-5 text-(--brand-primary)" />
          <span className="font-display text-lg font-semibold text-(--brand-dark)">Vendor Portal</span>
        </Link>
        <Link href="/vendor/dashboard" className="relative p-2 rounded-lg hover:bg-(--color-elevated) transition-colors">
          <Bell className="h-5 w-5 text-foreground" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-(--color-error) text-white text-[10px] font-bold flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </Link>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-(--z-overlay) w-64 bg-(--brand-dark) transform transition-transform duration-(--duration-base) ease-(--ease-premium) lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo section */}
          <div className="p-5 border-b border-white/10 hidden lg:block">
            <div className="flex items-center justify-between">
              <Link href="/vendor/dashboard" className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-(--color-surface)/15 backdrop-blur-sm flex items-center justify-center">
                  <Store className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <span className="font-display text-base font-semibold text-white block">Vendor Portal</span>
                  <span className="text-xs text-white/50">{vendorData?.business_name}</span>
                </div>
              </Link>
              {alertCount > 0 && (
                <Link href="/vendor/dashboard" className="relative p-2">
                  <Bell className="h-5 w-5 text-white/60 hover:text-white transition-colors" />
                  <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-(--color-error) text-white text-[10px] font-bold flex items-center justify-center">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto mt-16 lg:mt-0">
            {vendorNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-(--duration-fast) ${
                    isActive
                      ? 'bg-(--color-surface)/15 text-white font-medium'
                      : 'text-white/60 hover:bg-(--color-surface)/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Support section */}
          <div className="px-3 py-3 border-t border-white/10">
            <Link
              href="/vendor/support"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-(--duration-fast) ${
                pathname === '/vendor/support'
                  ? 'bg-(--color-surface)/15 text-white font-medium'
                  : 'text-white/60 hover:bg-(--color-surface)/10 hover:text-white'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm">Support Portal</span>
            </Link>
          </div>

          {/* Footer */}
          <div className="px-3 py-3 border-t border-white/10 space-y-0.5">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2.5 text-white/60 hover:text-white rounded-lg transition-colors duration-(--duration-fast)"
            >
              <span className="flex items-center gap-3">
                <Store className="h-4 w-4" />
                <span className="text-sm">View Store</span>
              </span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-3 py-2.5 text-white/60 hover:bg-(--color-error)/20 hover:text-(--color-error) rounded-lg transition-colors duration-(--duration-fast) w-full"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-(--z-overlay) lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <main className="lg:ml-64 pt-16 lg:pt-0 bg-background min-h-screen">
        {children}
      </main>
    </div>
  )
}
