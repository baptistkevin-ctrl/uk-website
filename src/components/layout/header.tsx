'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  Package,
  MapPin,
  Settings,
  ShoppingBag,
  Truck,
  Percent,
  Heart,
  X,
  ChevronRight,
  Grid3X3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils/cn'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'

interface Category {
  name: string
  slug: string
  emoji: string | null
}

// Fallback categories in case API fails
const fallbackCategories: Category[] = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', emoji: '🥬' },
  { name: 'Meat & Poultry', slug: 'meat-poultry', emoji: '🥩' },
  { name: 'Fish & Seafood', slug: 'fish-seafood', emoji: '🐟' },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs', emoji: '🥛' },
  { name: 'Bakery', slug: 'bakery', emoji: '🥐' },
  { name: 'Frozen', slug: 'frozen', emoji: '🧊' },
  { name: 'Pantry', slug: 'pantry', emoji: '🥫' },
  { name: 'Drinks', slug: 'drinks', emoji: '🍹' },
  { name: 'Snacks & Sweets', slug: 'snacks-sweets', emoji: '🍿' },
  { name: 'Alcohol', slug: 'alcohol', emoji: '🍷' },
  { name: 'Household', slug: 'household', emoji: '🧹' },
  { name: 'Health & Beauty', slug: 'health-beauty', emoji: '💊' },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [categories, setCategories] = useState<Category[]>(fallbackCategories)
  const { itemCount, openCart } = useCart()
  const { user, signOut } = useAuth()

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          // Filter only parent categories (no parent_id) and map to required fields
          const parentCategories = data
            .filter((cat: { parent_id: string | null }) => !cat.parent_id)
            .map((cat: { name: string; slug: string; emoji: string | null }) => ({
              name: cat.name,
              slug: cat.slug,
              emoji: cat.emoji || null
            }))
          if (parentCategories.length > 0) {
            setCategories(parentCategories)
          }
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        // Keep using fallback categories
      }
    }
    fetchCategories()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchFocused(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
      {/* Top bar - Promo Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white text-sm py-2.5 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center gap-8 text-center animate-marquee">
            <span className="flex items-center gap-2 whitespace-nowrap">
              <Truck className="h-4 w-4" />
              Free delivery on orders over £50
            </span>
            <span className="hidden sm:inline text-emerald-300">|</span>
            <span className="hidden sm:flex items-center gap-2 whitespace-nowrap">
              <Percent className="h-4 w-4" />
              Fresh deals every day
            </span>
            <span className="hidden md:inline text-emerald-300">|</span>
            <span className="hidden md:flex items-center gap-2 whitespace-nowrap">
              <MapPin className="h-4 w-4" />
              Delivering across the UK
            </span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex h-16 lg:h-20 items-center justify-between gap-4">
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-emerald-50">
                  <Menu className="h-6 w-6 text-gray-700" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:w-[350px] p-0">
                <SheetHeader className="p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Fresh Groceries
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-[calc(100%-80px)]">
                  {/* Search in mobile */}
                  <div className="p-4 border-b">
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      if (searchQuery.trim()) {
                        router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
                        setMobileMenuOpen(false)
                      }
                    }}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="search"
                          placeholder="Search for groceries..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 h-11 bg-slate-50 border-slate-200"
                        />
                      </div>
                    </form>
                  </div>

                  <nav className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-1">
                      <Link
                        href="/products"
                        className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="font-medium">All Products</span>
                      </Link>
                      <Link
                        href="/categories"
                        className="flex items-center gap-3 py-3 px-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Grid3X3 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="font-medium">All Categories</span>
                      </Link>
                    </div>

                    <div className="px-4 py-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                        Categories
                      </p>
                      <div className="space-y-1">
                        {categories.map((category) => (
                          <Link
                            key={category.slug}
                            href={`/categories/${category.slug}`}
                            className="flex items-center justify-between py-2.5 px-3 text-gray-600 hover:bg-slate-50 hover:text-emerald-700 rounded-lg transition-colors group"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="flex items-center gap-3">
                              {category.emoji && <span className="text-lg">{category.emoji}</span>}
                              {category.name}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </nav>

                  <div className="p-4 border-t bg-slate-50">
                    {user ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                            <p className="text-xs text-gray-500">Member account</p>
                          </div>
                        </div>
                        <Link
                          href="/account"
                          className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          My Account
                        </Link>
                        <button
                          onClick={() => {
                            signOut()
                            setMobileMenuOpen(false)
                          }}
                          className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700">
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            Create Account
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 lg:gap-3 group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all">
                <ShoppingBag className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Fresh Groceries
                </span>
              </div>
            </Link>

            {/* Search bar - desktop */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  type="search"
                  placeholder="Search for groceries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={cn(
                    "pl-12 pr-4 h-12 bg-slate-50 border-slate-200 rounded-xl text-base transition-all",
                    searchFocused && "bg-white border-emerald-500 ring-2 ring-emerald-500/20"
                  )}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Right side actions */}
            <div className="flex items-center gap-1 lg:gap-2">
              {/* Search button - mobile/tablet */}
              <Link href="/products" className="lg:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-emerald-50">
                  <Search className="h-5 w-5 text-gray-700" />
                </Button>
              </Link>

              {/* Track Order - Desktop only */}
              <Link href="/track-order" className="hidden xl:block">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-emerald-700 hover:bg-emerald-50">
                  <Package className="h-4 w-4 mr-2" />
                  Track Order
                </Button>
              </Link>

              {/* Sell with us - Desktop only */}
              <Link href="/sell" className="hidden lg:block">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-emerald-700 hover:bg-emerald-50">
                  Sell with us
                </Button>
              </Link>

              {/* Vendor Login - Desktop only */}
              <Link href="/vendor/login" className="hidden lg:block">
                <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                  Vendor Login
                </Button>
              </Link>

              {/* User menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden sm:flex hover:bg-emerald-50 relative">
                      <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2">
                    <div className="px-2 py-3 mb-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                      <p className="font-semibold text-gray-900">Welcome back!</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild className="py-2.5 px-3 cursor-pointer rounded-lg">
                      <Link href="/account" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <span>My Account</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="py-2.5 px-3 cursor-pointer rounded-lg">
                      <Link href="/account/orders" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Package className="h-4 w-4 text-gray-600" />
                        </div>
                        <span>Orders</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="py-2.5 px-3 cursor-pointer rounded-lg">
                      <Link href="/account/addresses" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-gray-600" />
                        </div>
                        <span>Addresses</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem
                      onClick={signOut}
                      className="py-2.5 px-3 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" className="text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 font-medium">
                    Sign In
                  </Button>
                </Link>
              )}

              {/* Cart button */}
              <Button
                variant="ghost"
                className="relative hover:bg-emerald-50 h-10 w-10 lg:h-auto lg:w-auto lg:px-4"
                onClick={openCart}
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 text-gray-700" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-emerald-600/30">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline ml-2 font-medium text-gray-700">Cart</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Category navigation - desktop */}
      <nav className="hidden lg:block bg-slate-50 border-b border-slate-100">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            <li>
              <Link
                href="/products"
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                  pathname === '/products'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-gray-600 hover:bg-white hover:text-emerald-700 hover:shadow-sm'
                )}
              >
                <Package className="h-4 w-4" />
                All Products
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categories/${category.slug}`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                    pathname === `/categories/${category.slug}`
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'text-gray-600 hover:bg-white hover:text-emerald-700 hover:shadow-sm'
                  )}
                >
                  {category.emoji && <span>{category.emoji}</span>}
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}
