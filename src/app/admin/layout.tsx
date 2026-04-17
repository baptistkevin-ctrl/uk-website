'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Truck,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Store,
  Bell,
  User,
  Image as ImageIcon,
  Tag,
  Users,
  FileText,
  MessageCircleQuestion,
  Gift,
  BellRing,
  RotateCcw,
  History,
  UserCog,
  Mail,
  Upload,
  Bot,
  Headphones,
  Shield,
  Zap,
  Ticket,
  Star,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { AdminSessionTimeout } from '@/components/admin/AdminSessionTimeout'
import { useAuth } from '@/hooks/use-auth'
import { Spinner } from '@/components/ui/Spinner'

interface SidebarSection {
  title: string
  items: { href: string; label: string; icon: typeof LayoutDashboard; badge?: string }[]
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/finance', label: 'Finance', icon: CreditCard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree },
      { href: '/admin/deals', label: 'Flash Deals', icon: Zap },
      { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
      { href: '/admin/offers', label: 'Multi-Buy Offers', icon: Tag },
      { href: '/admin/gift-cards', label: 'Gift Cards', icon: Gift },
    ],
  },
  {
    title: 'Orders & Customers',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/returns', label: 'Returns', icon: RotateCcw },
      { href: '/admin/invoices', label: 'Invoices', icon: FileText },
      { href: '/admin/users', label: 'Customers', icon: Users },
      { href: '/admin/customers', label: 'Segments', icon: Users },
      { href: '/admin/reviews', label: 'Reviews', icon: Star },
      { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
      { href: '/admin/abandoned-carts', label: 'Abandoned Carts', icon: RotateCcw },
    ],
  },
  {
    title: 'Vendors',
    items: [
      { href: '/admin/vendors', label: 'Vendors', icon: Store },
      { href: '/admin/vendor-applications', label: 'Applications', icon: FileText },
    ],
  },
  {
    title: 'Support',
    items: [
      { href: '/admin/complaints', label: 'Complaints', icon: AlertTriangle },
      { href: '/admin/live-support', label: 'Live Support', icon: Headphones },
      { href: '/admin/support-analytics', label: 'Support Analytics', icon: BarChart3 },
      { href: '/admin/chatbot', label: 'Chatbot', icon: Bot },
      { href: '/admin/questions', label: 'Q&A', icon: MessageCircleQuestion },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/admin/delivery', label: 'Delivery Slots', icon: Truck },
      { href: '/admin/stock-alerts', label: 'Stock Alerts', icon: AlertTriangle },
      { href: '/admin/hero-slides', label: 'Hero Slides', icon: ImageIcon },
      { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/team', label: 'Team', icon: UserCog },
      { href: '/admin/security', label: 'Security', icon: Shield },
      { href: '/admin/email-templates', label: 'Email Templates', icon: Mail },
      { href: '/admin/import-export', label: 'Import/Export', icon: Upload },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

// Flat list for backward compat
const sidebarLinks = sidebarSections.flatMap((s) => s.items)

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'super_admin' | null>(null)
  const [alertCounts, setAlertCounts] = useState<Record<string, number>>({})
  const [notifOpen, setNotifOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    // Skip auth check for admin login page
    if (pathname === '/auth/sa-portal') {
      setCheckingAccess(false)
      setIsAdmin(true) // Allow rendering without sidebar
      return
    }

    const checkAdminAccess = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return
      }

      if (!user) {
        router.push('/auth/sa-portal')
        return
      }

      try {
        // Fetch profile via server API to bypass RLS
        const res = await fetch('/api/user/profile')
        if (!res.ok) {
          console.error('Profile fetch error:', res.status)
          router.push('/')
          return
        }

        const profile = await res.json()

        // Check for admin or super_admin role
        if (profile?.role === 'admin' || profile?.role === 'super_admin') {
          setIsAdmin(true)
          setUserRole(profile.role as 'admin' | 'super_admin')

          // Fetch alert counts for badges
          try {
            const dashRes = await fetch('/api/admin/dashboard')
            if (dashRes.ok) {
              const dashData = await dashRes.json()
              setAlertCounts({
                '/admin/orders': dashData.pendingOrders || 0,
                '/admin/vendor-applications': dashData.pendingApplications || 0,
                '/admin/complaints': dashData.openTickets || 0,
                '/admin/returns': dashData.pendingReturns || 0,
                '/admin/reviews': dashData.pendingReviews || 0,
                '/admin/stock-alerts': dashData.lowStockProducts || 0,
              })
            }
          } catch {
            // Non-critical
          }
        } else {
          // Not an admin, redirect to home
          router.push('/')
        }
      } catch (error) {
        console.error('Admin check error:', error)
        router.push('/')
      } finally {
        setCheckingAccess(false)
      }
    }

    checkAdminAccess()
  }, [user, authLoading, router])

  const handleLogout = async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await supabase.auth.signOut()
    router.push('/auth/sa-portal')
    router.refresh()
  }

  if (authLoading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-(--color-text-muted)">Checking access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  // Render login page without sidebar
  if (pathname === '/auth/sa-portal') {
    return <>{children}</>
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-(--brand-dark) transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-(--brand-primary) flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-white">UK Grocery</h1>
              <p className="text-xs text-white/50">Admin Panel</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-white/60 hover:text-white rounded-lg hover:bg-(--color-surface)/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - scrollable area with grouped sections */}
        <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {sidebarSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((link) => {
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 group ${
                        active
                          ? 'bg-(--color-surface)/15 text-white font-medium'
                          : 'text-white/60 hover:bg-(--color-surface)/10 hover:text-white'
                      }`}
                    >
                      <link.icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                      <span className="flex-1">{link.label}</span>
                      {alertCounts[link.href] > 0 && (
                        <span className="h-5 min-w-5 px-1 rounded-full bg-(--color-error) text-white text-[10px] font-bold flex items-center justify-center">
                          {alertCounts[link.href] > 99 ? '99+' : alertCounts[link.href]}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Support Portal Links */}
          <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
            <Link
              href="/admin/support"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 group ${
                pathname === '/admin/support'
                  ? 'bg-(--color-surface)/15 text-white'
                  : 'text-white/60 hover:bg-(--color-surface)/10 hover:text-white'
              }`}
            >
              <Headphones className={`w-4 h-4 shrink-0 ${pathname === '/admin/support' ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
              <span>Admin Support</span>
            </Link>
            {userRole === 'super_admin' && (
              <>
                <Link
                  href="/admin/audit-logs"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 group ${
                    pathname === '/admin/audit-logs'
                      ? 'bg-(--brand-amber)/20 text-(--brand-amber)'
                      : 'text-white/60 hover:bg-(--color-surface)/10 hover:text-white'
                  }`}
                >
                  <History className={`w-4 h-4 shrink-0 ${pathname === '/admin/audit-logs' ? 'text-(--brand-amber)' : 'text-(--brand-amber)/60 group-hover:text-(--brand-amber)'}`} />
                  <span>Activity Logs</span>
                </Link>
                <Link
                  href="/admin/super-admin-support"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 group ${
                    pathname === '/admin/super-admin-support'
                      ? 'bg-(--brand-amber)/20 text-(--brand-amber)'
                      : 'text-white/60 hover:bg-(--color-surface)/10 hover:text-white'
                  }`}
                >
                  <Shield className={`w-4 h-4 shrink-0 ${pathname === '/admin/super-admin-support' ? 'text-(--brand-amber)' : 'text-(--brand-amber)/60 group-hover:text-(--brand-amber)'}`} />
                  <span>Super Admin Portal</span>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Bottom section - fixed at bottom */}
        <div className="shrink-0 p-4 border-t border-white/10">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/60 hover:text-white transition-all duration-200 group"
          >
            <Store className="w-4 h-4 text-white/60 group-hover:text-white" />
            <span>View Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/60 hover:bg-(--color-error)/20 hover:text-red-400 transition-all duration-200 group mt-1"
          >
            <LogOut className="w-4 h-4 text-white/60 group-hover:text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-(--color-surface)/80 backdrop-blur-xl border-b border-(--color-border)">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-(--color-text-secondary) hover:text-foreground rounded-lg hover:bg-(--color-elevated) transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Search bar */}
              <div className="hidden sm:block">
                <AdminSearch />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2.5 text-(--color-text-secondary) hover:text-foreground rounded-lg hover:bg-(--color-elevated) transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {Object.values(alertCounts).reduce((a, b) => a + b, 0) > 0 && (
                    <span className="absolute top-1 right-1 h-5 min-w-5 px-1 rounded-full bg-(--color-error) text-white text-[10px] font-bold flex items-center justify-center border-2 border-(--color-surface)">
                      {Object.values(alertCounts).reduce((a, b) => a + b, 0) > 99 ? '99+' : Object.values(alertCounts).reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-(--color-surface) border border-(--color-border) rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-(--color-border)">
                        <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {Object.entries(alertCounts).filter(([, count]) => count > 0).length === 0 ? (
                          <div className="p-6 text-center text-(--color-text-muted) text-sm">All caught up!</div>
                        ) : (
                          Object.entries(alertCounts)
                            .filter(([, count]) => count > 0)
                            .map(([path, count]) => {
                              const label = sidebarLinks.find(l => l.href === path)?.label || path
                              return (
                                <Link
                                  key={path}
                                  href={path}
                                  onClick={() => setNotifOpen(false)}
                                  className="flex items-center justify-between px-4 py-3 hover:bg-(--color-elevated) transition-colors border-b border-(--color-border) last:border-0"
                                >
                                  <span className="text-sm text-foreground">{count} {label.toLowerCase()}</span>
                                  <span className="text-xs text-(--color-text-muted)">View &rarr;</span>
                                </Link>
                              )
                            })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile */}
              <button className="flex items-center gap-3 p-2 pr-4 rounded-lg hover:bg-(--color-elevated) transition-colors">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                  userRole === 'super_admin'
                    ? 'bg-(--brand-amber)'
                    : 'bg-(--brand-primary)'
                }`}>
                  {userRole === 'super_admin' ? (
                    <Shield className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-foreground">
                    {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                  <p className="text-xs text-(--color-text-muted)">
                    {userRole === 'super_admin' ? 'Full Access' : 'Standard Access'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Session Timeout Warning */}
      <AdminSessionTimeout />
    </div>
  )
}
