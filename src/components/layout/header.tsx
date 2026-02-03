'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  Package,
  MapPin,
  ShoppingBag,
  Heart,
  X,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  Grid3X3,
  Flame,
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
}

// Fallback categories in case API fails
const fallbackCategories: Category[] = [
  { name: 'Vegetables', slug: 'vegetables', emoji: '🥬', product_count: 6 },
  { name: 'Fresh Fruits', slug: 'fresh-fruits', emoji: '🍎', product_count: 8 },
  { name: 'Desserts', slug: 'desserts', emoji: '🍰', product_count: 9 },
  { name: 'Drinks & Juice', slug: 'drinks-juice', emoji: '🧃', product_count: 6 },
  { name: 'Fish & Meats', slug: 'fish-meats', emoji: '🐟', product_count: 7 },
  { name: 'Pets & Animals', slug: 'pets-animals', emoji: '🐕', product_count: 4 },
  { name: 'Beverage', slug: 'beverage', emoji: '☕', product_count: 8 },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState<Category[]>(fallbackCategories)
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(false)
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const { itemCount, openCart } = useCart()
  const { user, signOut } = useAuth()
  const wishlistCount = useWishlistStore((state) => state.productIds.size)

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          const parentCategories = data
            .filter((cat: { parent_id: string | null }) => !cat.parent_id)
            .map((cat: { name: string; slug: string; emoji: string | null; product_count?: number }) => ({
              name: cat.name,
              slug: cat.slug,
              emoji: cat.emoji || null,
              product_count: cat.product_count || Math.floor(Math.random() * 10) + 3
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
      const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''
      router.push(`/products?search=${encodeURIComponent(searchQuery)}${categoryParam}`)
    }
  }

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const getCategoryIcon = (slug: string) => {
    const IconComponent = categoryIconComponents[slug] || DefaultCategoryIcon
    return <IconComponent className="w-7 h-7" />
  }

  return (
    <header className="bg-white shadow-sm w-full">
      {/* Top bar - Light green promotional banner */}
      <div className="bg-green-500 text-white text-xs py-1.5">
        <div className="flex items-center">
          {/* Left - Location & Email (fixed) */}
          <div className="hidden md:flex items-center gap-4 shrink-0 px-4 border-r border-green-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              23/A Mark Street Road, London
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              info@freshgrocery.com
            </span>
          </div>

          {/* Right - Scrolling promo text */}
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap inline-flex items-center gap-12">
              {/* First set */}
              <span className="inline-flex items-center gap-2 ml-8">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                Try Fresh Grocery for free
              </span>
              <Link href="/register" className="text-orange-400 hover:text-orange-300 font-semibold inline-flex items-center gap-1">
                Open store right now
                <ChevronRight className="h-3 w-3" />
              </Link>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                Free delivery on orders over £50
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                Fresh products daily
              </span>
              {/* Duplicate set for seamless loop */}
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                Try Fresh Grocery for free
              </span>
              <Link href="/register" className="text-orange-400 hover:text-orange-300 font-semibold inline-flex items-center gap-1">
                Open store right now
                <ChevronRight className="h-3 w-3" />
              </Link>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                Free delivery on orders over £50
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                Fresh products daily
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header - Zilly Style */}
      <div className="border-b border-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-green-500">Fresh</span>
                <span className="text-xl font-bold text-gray-900">Grocery</span>
              </div>
            </Link>

            {/* All Categories Dropdown */}
            <DropdownMenu open={allCategoriesOpen} onOpenChange={setAllCategoriesOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden lg:flex items-center gap-2 border-gray-200 text-gray-700 px-4 h-10 rounded-md">
                  <Menu className="h-4 w-4" />
                  <span className="text-sm">All Categories</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {categories.map((category) => (
                  <DropdownMenuItem key={category.slug} asChild>
                    <Link href={`/categories/${category.slug}`} className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 flex items-center justify-center">
                        {getCategoryIcon(category.slug)}
                      </div>
                      <span className="text-sm">{category.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/categories" className="flex items-center gap-2 text-green-500 font-medium">
                    <Grid3X3 className="h-4 w-4" />
                    View All Categories
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search bar - Zilly Style */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
              <div className="flex w-full border border-gray-200 rounded-md overflow-hidden">
                {/* Category Selector */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-36 px-3 py-2 bg-gray-50 border-r border-gray-200 text-sm text-gray-600 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
                {/* Search Input */}
                <Input
                  type="search"
                  placeholder="Type Your Products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-0 h-10 px-4 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                />
                {/* Search Button */}
                <Button type="submit" className="bg-green-500 hover:bg-green-600 rounded-none px-5 h-10 text-sm font-medium">
                  Search
                </Button>
              </div>
            </form>

            {/* Right side icons */}
            <div className="flex items-center gap-2 ml-auto">
              {/* User Account */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <User className="h-4 w-4 text-gray-600" />
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
                  <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <User className="h-4 w-4 text-gray-600" />
                  </button>
                </Link>
              )}

              {/* Wishlist */}
              <Link href="/account/wishlist">
                <button className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center hover:bg-pink-100 transition-colors relative">
                  <Heart className="h-4 w-4 text-pink-500" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors relative"
              >
                <ShoppingCart className="h-4 w-4 text-green-500" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Menu className="h-4 w-4 text-gray-600" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-bold">Zilly</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="px-4 mb-4">
                      <div className="flex border border-gray-200 rounded-md overflow-hidden">
                        <Input
                          type="search"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 border-0 h-10 focus-visible:ring-0"
                        />
                        <Button type="submit" size="sm" className="bg-green-500 hover:bg-green-600 rounded-none h-10">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                    <nav className="space-y-1 px-2">
                      <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100"
                      >
                        <span className="text-sm font-medium text-gray-700">Home</span>
                      </Link>
                      <Link
                        href="/products"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100"
                      >
                        <span className="text-sm font-medium text-gray-700">Shop</span>
                      </Link>
                      <Link
                        href="/deals"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100"
                      >
                        <span className="text-sm font-medium text-gray-700">Deals</span>
                      </Link>
                      <div className="border-t my-2" />
                      {categories.map((category) => (
                        <Link
                          key={category.slug}
                          href={`/categories/${category.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100"
                        >
                          <div className="w-8 h-8 flex items-center justify-center">
                            {getCategoryIcon(category.slug)}
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

      {/* Navigation Menu - Zilly Style */}
      <nav className="hidden lg:block border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <ul className="flex items-center">
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(
                    "flex items-center gap-1 px-4 py-3 text-sm font-medium transition-colors",
                    pathname === '/' ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
                  )}>
                    Home <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild><Link href="/">Home</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-500 hover:text-green-500 transition-colors">
                    Pages <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild><Link href="/about">About Us</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/contact">Contact</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/faq">FAQ</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-500 hover:text-green-500 transition-colors">
                    Shop <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild><Link href="/products">All Products</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/deals">Deals</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/cart">Cart</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/checkout">Checkout</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-500 hover:text-green-500 transition-colors">
                    Vendor <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild><Link href="/stores">All Stores</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/vendor/login">Vendor Login</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/vendor/register">Become a Vendor</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-500 hover:text-green-500 transition-colors">
                    Elements <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild><Link href="/products">Products Grid</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/categories">Categories</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-500 hover:text-green-500 transition-colors">
                    Blog <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild><Link href="/blog">Blog</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
              <li>
                <Link href="/contact" className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-green-500 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>

            {/* Right side - Weekly Discount & Hotline */}
            <div className="flex items-center gap-4">
              {/* Weekly Discount */}
              <Link href="/deals" className="flex items-center gap-1.5 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-orange-500 font-medium">Weekly Discount!</span>
              </Link>

              {/* Hotline */}
              <div className="flex items-center gap-2 bg-green-50 rounded-md px-3 py-1.5">
                <Phone className="h-4 w-4 text-green-500" />
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 leading-none">Hotline Number</p>
                  <p className="text-sm font-bold text-red-500">+9888-256-666</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Category Strip - Zilly Style */}
      <div className="hidden lg:block border-b border-gray-100 py-3">
        <div className="container mx-auto px-4">
          <div className="relative flex items-center">
            {/* Scroll Left Button */}
            <button
              onClick={() => scrollCategories('left')}
              className="absolute left-0 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>

            {/* Categories Scroll Container */}
            <div
              ref={categoryScrollRef}
              className="flex items-center gap-8 overflow-x-auto scrollbar-hide mx-10 scroll-smooth"
            >
              {categories.map((category) => {
                const IconComponent = categoryIconComponents[category.slug] || DefaultCategoryIcon
                return (
                  <Link
                    key={category.slug}
                    href={`/categories/${category.slug}`}
                    className={cn(
                      'flex flex-col items-center gap-1.5 min-w-[80px] group',
                      pathname === `/categories/${category.slug}` && 'text-green-500'
                    )}
                  >
                    <div className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center transition-all border-2 bg-white',
                      pathname === `/categories/${category.slug}`
                        ? 'border-green-500 shadow-lg shadow-green-100'
                        : 'border-amber-200 group-hover:border-green-500 group-hover:shadow-lg group-hover:shadow-green-100'
                    )}>
                      <IconComponent className="w-10 h-10" />
                    </div>
                    <p className={cn(
                      'text-xs font-medium text-center whitespace-nowrap',
                      pathname === `/categories/${category.slug}` ? 'text-green-500' : 'text-gray-500 group-hover:text-green-500'
                    )}>
                      {category.name}
                    </p>
                    <p className="text-[10px] text-gray-400">{category.product_count || 0} Products</p>
                  </Link>
                )
              })}
            </div>

            {/* Scroll Right Button */}
            <button
              onClick={() => scrollCategories('right')}
              className="absolute right-0 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
