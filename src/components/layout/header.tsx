'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  LogOut,
  Package,
  MapPin,
  Heart,
  ChevronRight,
  ChevronLeft,
  Mail,
} from 'lucide-react'
import {
  categoryIconComponents,
  DefaultCategoryIcon,
} from '@/components/icons/category-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils/cn'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { useWishlistStore } from '@/hooks/use-wishlist'

interface Category {
  name: string
  slug: string
  emoji: string | null
  icon?: string
  product_count?: number
  id?: string
  parent_id?: string | null
  subcategories?: Category[]
}

// Fallback categories in case API fails
const fallbackCategories: Category[] = [
  { name: 'Vegetables', slug: 'vegetables', emoji: '🥬', product_count: 6 },
  { name: 'Fresh Fruits', slug: 'fresh-fruits', emoji: '🍎', product_count: 8 },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs', emoji: '🥛', product_count: 5 },
  { name: 'Meat & Poultry', slug: 'meat-poultry', emoji: '🥩', product_count: 7 },
  { name: 'Fish & Seafood', slug: 'fish-seafood', emoji: '🐟', product_count: 4 },
  { name: 'Bakery', slug: 'bakery', emoji: '🍞', product_count: 6 },
  { name: 'Frozen', slug: 'frozen', emoji: '🧊', product_count: 5 },
  { name: 'Desserts', slug: 'desserts', emoji: '🍰', product_count: 9 },
  { name: 'Drinks & Juice', slug: 'drinks-juice', emoji: '🧃', product_count: 6 },
  { name: 'Snacks', slug: 'snacks', emoji: '🍿', product_count: 5 },
  { name: 'Household', slug: 'household', emoji: '🏠', product_count: 4 },
  { name: 'Health & Beauty', slug: 'health-beauty', emoji: '💊', product_count: 3 },
  { name: 'Pets & Animals', slug: 'pets-animals', emoji: '🐕', product_count: 4 },
  { name: 'Beverage', slug: 'beverage', emoji: '☕', product_count: 8 },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>(fallbackCategories)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [allMenuOpen, setAllMenuOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const allMenuRef = useRef<HTMLDivElement>(null)
  const allMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { itemCount, openCart } = useCart()
  const { user, signOut } = useAuth()
  const wishlistCount = useWishlistStore((state) => state.productIds.size)

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          const allCategories = data.map((cat: { id: string; name: string; slug: string; emoji: string | null; product_count?: number; parent_id?: string | null }) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            emoji: cat.emoji || null,
            product_count: cat.product_count || 0,
            parent_id: cat.parent_id || null,
          }))
          const parentCategories = allCategories
            .filter((cat: Category) => !cat.parent_id)
            .map((parent: Category) => ({
              ...parent,
              subcategories: allCategories.filter((child: Category) => child.parent_id === parent.id)
            }))
          if (parentCategories.length > 0) {
            setCategories(parentCategories)
          }
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  // Check scroll position to show/hide arrows
  const updateArrows = useCallback(() => {
    const el = categoryScrollRef.current
    if (!el) return
    setShowLeftArrow(el.scrollLeft > 0)
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  useEffect(() => {
    const el = categoryScrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    updateArrows()
    return () => el.removeEventListener('scroll', updateArrows)
  }, [updateArrows, categories])

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 250
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const getCategoryIcon = (slug: string, size: string = "w-5 h-5") => {
    const IconComponent = categoryIconComponents[slug] || DefaultCategoryIcon
    return <IconComponent className={size} />
  }

  const handleAllMenuEnter = () => {
    if (allMenuTimeoutRef.current) {
      clearTimeout(allMenuTimeoutRef.current)
      allMenuTimeoutRef.current = null
    }
    setAllMenuOpen(true)
  }

  const handleAllMenuLeave = () => {
    allMenuTimeoutRef.current = setTimeout(() => {
      setAllMenuOpen(false)
      setHoveredCategory(null)
    }, 200)
  }

  return (
    <header className={cn(
      "bg-gradient-to-r from-orange-50 via-white to-orange-50 w-full z-50 transition-shadow duration-200",
      isScrolled ? "sticky top-0 shadow-md" : "shadow-sm"
    )}>
      {/* Top bar - desktop only info strip */}
      {!isScrolled && (
        <div className="hidden lg:block bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b border-orange-100 text-xs text-gray-500 py-1.5">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Delivering to London
              </span>
              <span className="hidden md:flex items-center gap-1">
                <Mail className="h-3 w-3" />
                info@freshgrocery.com
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/faq" className="hover:text-green-600 transition-colors">Help</Link>
              <span className="text-gray-300">|</span>
              <Link href="/delivery" className="hover:text-green-600 transition-colors">Free delivery over £50</Link>
            </div>
          </div>
        </div>
      )}

      {/* Main header bar - Tesco style */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FG</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-green-600">Fresh</span>
                <span className="text-xl font-bold text-gray-800">Grocery</span>
              </div>
            </Link>

            {/* Search bar - Tesco style: clean, full width, no category selector */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
              <div className="flex w-full border border-gray-300 rounded-full overflow-hidden hover:border-green-500 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                <Input
                  type="search"
                  placeholder="Search for groceries, brands, and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-0 h-10 px-5 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm bg-transparent"
                />
                <Button type="submit" className="bg-green-500 hover:bg-green-600 rounded-none rounded-r-full px-4 h-10">
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>

            {/* Right side icons - hidden on mobile (bottom nav handles these) */}
            <div className="hidden lg:flex items-center gap-1 ml-auto">
              {/* User Account */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex flex-col items-center justify-center px-3 py-1 hover:bg-gray-50 rounded-lg transition-colors min-w-[56px]">
                      <User className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                      <span className="text-[10px] text-gray-600 mt-0.5 leading-tight">Account</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="flex items-center gap-2">
                        <User className="h-4 w-4" /> My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/orders" className="flex items-center gap-2">
                        <Package className="h-4 w-4" /> Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/wishlist" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" /> Wishlist
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <button className="flex flex-col items-center justify-center px-3 py-1 hover:bg-gray-50 rounded-lg transition-colors min-w-[56px]">
                    <User className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                    <span className="text-[10px] text-gray-600 mt-0.5 leading-tight">Sign in</span>
                  </button>
                </Link>
              )}

              {/* Wishlist */}
              <Link href="/account/wishlist">
                <button className="flex flex-col items-center justify-center px-3 py-1 hover:bg-gray-50 rounded-lg transition-colors relative min-w-[56px]">
                  <Heart className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                  <span className="text-[10px] text-gray-600 mt-0.5 leading-tight">Favourites</span>
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-1 h-4 w-4 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="flex flex-col items-center justify-center px-3 py-1 hover:bg-gray-50 rounded-lg transition-colors relative min-w-[56px]"
              >
                <ShoppingCart className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                <span className="text-[10px] text-gray-600 mt-0.5 leading-tight">
                  {itemCount > 0 ? `£0.00` : 'Basket'}
                </span>
                {itemCount > 0 && (
                  <span className="absolute top-0 right-1 h-4 w-4 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden flex flex-col items-center justify-center px-3 py-1 hover:bg-gray-50 rounded-lg transition-colors">
                    <Menu className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
                    <span className="text-[10px] text-gray-600 mt-0.5 leading-tight">Menu</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">FG</span>
                      </div>
                      <span className="font-bold text-green-600">Fresh</span>
                      <span className="font-bold text-gray-800">Grocery</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="py-2">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="px-4 mb-3">
                      <div className="flex border border-gray-200 rounded-full overflow-hidden">
                        <Input
                          type="search"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 border-0 h-10 px-4 focus-visible:ring-0 text-sm"
                        />
                        <Button type="submit" size="sm" className="bg-green-500 hover:bg-green-600 rounded-none rounded-r-full h-10 px-3">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>

                    {/* Mobile Nav Links */}
                    <nav className="space-y-0.5 px-2">
                      <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                          pathname === '/' ? 'bg-green-50 text-green-600' : 'hover:bg-gray-50'
                        )}
                      >
                        <span className="text-sm font-medium">Home</span>
                      </Link>
                      <Link
                        href="/products"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50"
                      >
                        <span className="text-sm font-medium">Shop All</span>
                      </Link>
                      <Link
                        href="/deals"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50"
                      >
                        <span className="text-sm font-medium">Offers</span>
                      </Link>

                      {/* Category divider */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Categories</p>
                      </div>

                      {categories.map((category) => (
                        <Link
                          key={category.slug}
                          href={`/categories/${category.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                            pathname === `/categories/${category.slug}` ? 'bg-green-50 text-green-600' : 'hover:bg-gray-50'
                          )}
                        >
                          <div className="w-6 h-6 flex items-center justify-center">
                            {getCategoryIcon(category.slug, "w-5 h-5")}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{category.name}</span>
                        </Link>
                      ))}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - AliExpress style always visible */}
      <div className="lg:hidden border-b border-orange-100 px-3 py-2 bg-gradient-to-r from-orange-50 via-white to-orange-50">
        <form onSubmit={handleSearch} className="flex w-full">
          <div className="flex w-full border border-gray-200 rounded-full overflow-hidden bg-gray-50 focus-within:border-green-500 focus-within:bg-white transition-all">
            <Input
              type="search"
              placeholder="Search groceries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 h-9 px-4 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm bg-transparent"
            />
            <Button type="submit" className="bg-green-500 hover:bg-green-600 rounded-none rounded-r-full px-3 h-9">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Category Navigation Strip - Tesco style horizontal scroll */}
      <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="relative flex items-center">
            {/* Scroll Left Button */}
            {showLeftArrow && (
              <button
                onClick={() => scrollCategories('left')}
                className="absolute left-0 z-10 h-full px-1 bg-gradient-to-r from-orange-50 via-orange-50/80 to-transparent flex items-center"
              >
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              </button>
            )}

            {/* Categories Scroll Container */}
            <div
              ref={categoryScrollRef}
              className="flex items-center overflow-x-auto scrollbar-hide scroll-smooth py-1.5 lg:py-2 gap-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* All Categories link with hover flyout */}
              <div
                className="relative shrink-0"
                ref={allMenuRef}
                onMouseEnter={handleAllMenuEnter}
                onMouseLeave={handleAllMenuLeave}
              >
                <Link
                  href="/categories"
                  className={cn(
                    "flex items-center gap-1 lg:gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                    pathname === '/categories' || allMenuOpen
                      ? 'bg-green-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Menu className="h-4 w-4" />
                  All
                </Link>

                {/* Flyout mega menu */}
                {allMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 z-50 flex bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Left panel - category list */}
                    <div className="w-64 max-h-[70vh] overflow-y-auto border-r border-gray-100 py-2">
                      {categories.map((category) => (
                        <Link
                          key={category.slug}
                          href={`/categories/${category.slug}`}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                            hoveredCategory === category.slug
                              ? 'bg-green-50 text-green-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          )}
                          onMouseEnter={() => setHoveredCategory(category.slug)}
                        >
                          <span className="w-6 h-6 flex items-center justify-center shrink-0">
                            {getCategoryIcon(category.slug, "w-5 h-5")}
                          </span>
                          <span className="font-medium flex-1">{category.name}</span>
                          {category.subcategories && category.subcategories.length > 0 && (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </Link>
                      ))}

                      {/* View all link */}
                      <div className="border-t border-gray-100 mt-2 pt-2 px-4">
                        <Link
                          href="/categories"
                          className="flex items-center gap-2 py-2 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
                        >
                          View All Categories
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Right panel - subcategories */}
                    {hoveredCategory && (
                      <div className="w-56 max-h-[70vh] overflow-y-auto py-2 bg-gray-50/50">
                        {(() => {
                          const activeCategory = categories.find(c => c.slug === hoveredCategory)
                          if (!activeCategory?.subcategories?.length) {
                            return (
                              <div className="px-4 py-3">
                                <Link
                                  href={`/categories/${activeCategory?.slug}`}
                                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                                >
                                  Shop all {activeCategory?.name}
                                </Link>
                              </div>
                            )
                          }
                          return (
                            <>
                              <div className="px-4 py-2 mb-1">
                                <Link
                                  href={`/categories/${activeCategory.slug}`}
                                  className="text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-green-600 transition-colors"
                                >
                                  {activeCategory.name}
                                </Link>
                              </div>
                              {activeCategory.subcategories.map((sub) => (
                                <Link
                                  key={sub.slug}
                                  href={`/categories/${sub.slug}`}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-white hover:text-green-700 transition-colors"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                              <div className="border-t border-gray-200 mt-2 pt-2 px-4">
                                <Link
                                  href={`/categories/${activeCategory.slug}`}
                                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                                >
                                  See all {activeCategory.name} →
                                </Link>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Offers link */}
              <Link
                href="/deals"
                className={cn(
                  "flex items-center gap-1 lg:gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                  pathname === '/deals'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                Offers
              </Link>

              {/* Separator */}
              <div className="w-px h-5 bg-gray-200 shrink-0 mx-1" />

              {/* Category Items */}
              {categories.map((category) => {
                const isActive = pathname === `/categories/${category.slug}`
                return (
                  <Link
                    key={category.slug}
                    href={`/categories/${category.slug}`}
                    className={cn(
                      "flex items-center gap-1 lg:gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                      isActive
                        ? 'bg-green-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                      {getCategoryIcon(category.slug, "w-4 h-4")}
                    </span>
                    {category.name}
                  </Link>
                )
              })}
            </div>

            {/* Scroll Right Button */}
            {showRightArrow && (
              <button
                onClick={() => scrollCategories('right')}
                className="absolute right-0 z-10 h-full px-1 bg-gradient-to-l from-orange-50 via-orange-50/80 to-transparent flex items-center"
              >
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
