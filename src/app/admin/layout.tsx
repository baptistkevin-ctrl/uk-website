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
  ChevronRight,
  Store,
  Bell,
  User,
  Image as ImageIcon,
  Tag,
  Users,
  FileText,
  Loader2,
} from 'lucide-react'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/vendors', label: 'Vendors', icon: Store },
  { href: '/admin/vendor-applications', label: 'Applications', icon: FileText },
  { href: '/admin/offers', label: 'Multi-Buy Offers', icon: Tag },
  { href: '/admin/hero-slides', label: 'Hero Slides', icon: ImageIcon },
  { href: '/admin/delivery', label: 'Delivery', icon: Truck },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        router.push('/login?redirect=/admin')
        return
      }

      try {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          setIsAdmin(true)
        } else {
          // Not an admin, redirect to home
          router.push('/')
        }
      } catch (error) {
        console.error('Admin check error:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [user, router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Checking access...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">FreshMart</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <link.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                <span>{link.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 group"
          >
            <Store className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
            <span>View Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 group mt-1"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
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
              <button className="relative p-2.5 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {/* Profile */}
              <button className="flex items-center gap-3 p-2 pr-4 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-900">Admin</p>
                  <p className="text-xs text-slate-500">Super Admin</p>
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
