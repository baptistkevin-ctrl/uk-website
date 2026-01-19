'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  MapPin,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils/cn'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'

const categories = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs' },
  { name: 'Meat & Seafood', slug: 'meat-seafood' },
  { name: 'Bakery', slug: 'bakery' },
  { name: 'Frozen Foods', slug: 'frozen-foods' },
  { name: 'Beverages', slug: 'beverages' },
  { name: 'Snacks', slug: 'snacks' },
  { name: 'Pantry', slug: 'pantry' },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { itemCount, openCart } = useCart()
  const { user, signOut } = useAuth()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      {/* Top bar */}
      <div className="bg-green-700 text-white text-sm py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <p>Free delivery on orders over £50</p>
          <p>Delivering across the UK</p>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <Link
                    href="/"
                    className="text-xl font-bold text-green-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    FreshMart
                  </Link>
                </div>
                <nav className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    <Link
                      href="/products"
                      className="block py-2 text-gray-600 hover:text-green-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      All Products
                    </Link>
                    <div className="py-2">
                      <p className="font-medium text-gray-900 mb-2">Categories</p>
                      {categories.map((category) => (
                        <Link
                          key={category.slug}
                          href={`/categories/${category.slug}`}
                          className="block py-1.5 pl-4 text-gray-600 hover:text-green-700"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </nav>
                <div className="p-4 border-t">
                  {user ? (
                    <div className="space-y-2">
                      <Link
                        href="/account"
                        className="block py-2 text-gray-600 hover:text-green-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Account
                      </Link>
                      <button
                        onClick={() => {
                          signOut()
                          setMobileMenuOpen(false)
                        }}
                        className="block py-2 text-gray-600 hover:text-green-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full">Sign In</Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
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
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-green-700">FreshMart</span>
          </Link>

          {/* Search bar - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search for groceries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </form>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search button - mobile */}
            <Link href="/products" className="md:hidden">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            {/* User menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden sm:flex">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-medium">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/addresses" className="cursor-pointer">
                      <MapPin className="mr-2 h-4 w-4" />
                      Addresses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Cart button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Category navigation - desktop */}
      <nav className="hidden lg:block border-t bg-gray-50">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-1 overflow-x-auto py-2">
            <li>
              <Link
                href="/products"
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-green-100 hover:text-green-700',
                  pathname === '/products' && 'bg-green-100 text-green-700'
                )}
              >
                All Products
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categories/${category.slug}`}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-green-100 hover:text-green-700 whitespace-nowrap',
                    pathname === `/categories/${category.slug}` &&
                      'bg-green-100 text-green-700'
                  )}
                >
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
