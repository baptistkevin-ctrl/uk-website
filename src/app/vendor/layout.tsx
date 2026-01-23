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
  ChevronDown
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

const vendorNavItems = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/products', label: 'Products', icon: Package },
  { href: '/vendor/orders', label: 'Orders', icon: ShoppingCart },
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
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [vendorData, setVendorData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Skip auth check for vendor login page
    if (pathname === '/vendor/login') {
      setLoading(false)
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
      } catch (error) {
        console.error('Vendor check error:', error)
        router.push('/sell')
      } finally {
        setLoading(false)
      }
    }

    checkVendorAccess()
  }, [user, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  // Render login page without sidebar
  if (pathname === '/vendor/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <Link href="/vendor/dashboard" className="flex items-center gap-2">
          <Store className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-gray-900">Vendor Portal</span>
        </Link>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b hidden lg:block">
            <Link href="/vendor/dashboard" className="flex items-center gap-2">
              <Store className="h-8 w-8 text-emerald-600" />
              <div>
                <span className="font-bold text-gray-900 block">Vendor Portal</span>
                <span className="text-xs text-gray-500">{vendorData?.business_name}</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-16 lg:mt-0">
            {vendorNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
            >
              <Store className="h-5 w-5" />
              View Store
            </Link>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
