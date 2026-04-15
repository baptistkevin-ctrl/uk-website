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
} from 'lucide-react'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { useAuth } from '@/hooks/use-auth'
import { Spinner } from '@/components/ui/Spinner'

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/invoices', label: 'Invoices', icon: FileText },
  { href: '/admin/vendors', label: 'Vendors', icon: Store },
  { href: '/admin/vendor-applications', label: 'Applications', icon: FileText },
  { href: '/admin/live-support', label: 'Live Support', icon: Headphones },
  { href: '/admin/chatbot', label: 'Chatbot', icon: Bot },
  { href: '/admin/questions', label: 'Q&A', icon: MessageCircleQuestion },
  { href: '/admin/abandoned-carts', label: 'Abandoned Carts', icon: RotateCcw },
  { href: '/admin/hero-slides', label: 'Hero Slides', icon: ImageIcon },
  { href: '/admin/delivery', label: 'Delivery', icon: Truck },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/team', label: 'Team', icon: UserCog },
  { href: '/admin/email-templates', label: 'Email Templates', icon: Mail },
  { href: '/admin/import-export', label: 'Import/Export', icon: Upload },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'super_admin' | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return
      }

      if (!user) {
        router.push('/login?redirect=/admin')
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
    router.push('/login')
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

        {/* Navigation - scrollable area */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {sidebarLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-(--color-surface)/15 text-white'
                    : 'text-white/60 hover:bg-(--color-surface)/10 hover:text-white'
                }`}
              >
                <link.icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                <span>{link.label}</span>
              </Link>
            )
          })}

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
              {/* Notifications */}
              <button className="relative p-2.5 text-(--color-text-secondary) hover:text-foreground rounded-lg hover:bg-(--color-elevated) transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-(--color-error) rounded-full border-2 border-(--color-surface)"></span>
              </button>

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
    </div>
  )
}
