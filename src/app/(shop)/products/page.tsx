import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/product-card'
import { ProductFilters } from '@/components/products/product-filters'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingBasket,
  Sparkles,
  Search,
  X,
  Package,
  Leaf,
  Heart,
  Wheat,
  Star
} from 'lucide-react'

// ISR: revalidate product listing every 60 seconds
export const revalidate = 60

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    sort?: string
    page?: string
    vegan?: string
    vegetarian?: string
    gluten_free?: string
    organic?: string
  }>
}

export const metadata = {
  title: 'Products | Fresh Groceries',
  description: 'Browse our selection of fresh groceries and quality products.',
}

async function ProductGrid({ searchParams }: { searchParams: Awaited<ProductsPageProps['searchParams']> }) {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, vendor:vendors(id, business_name, slug, is_verified)')
    .eq('is_active', true)

  // Search filter
  if (searchParams.search) {
    query = query.ilike('name', `%${searchParams.search}%`)
  }

  // Dietary filters
  if (searchParams.vegan === 'true') {
    query = query.eq('is_vegan', true)
  }
  if (searchParams.vegetarian === 'true') {
    query = query.eq('is_vegetarian', true)
  }
  if (searchParams.gluten_free === 'true') {
    query = query.eq('is_gluten_free', true)
  }
  if (searchParams.organic === 'true') {
    query = query.eq('is_organic', true)
  }

  // Sorting
  switch (searchParams.sort) {
    case 'price_asc':
      query = query.order('price_pence', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price_pence', { ascending: false })
      break
    case 'name':
      query = query.order('name', { ascending: true })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    default:
      query = query.order('is_featured', { ascending: false }).order('name', { ascending: true })
  }

  const { data: products, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Products</h3>
        <p className="text-gray-500">Please try refreshing the page.</p>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {searchParams.search
            ? `We couldn't find any products matching "${searchParams.search}". Try adjusting your search or filters.`
            : 'Try adjusting your filters to see more products.'
          }
        </p>
        <Button asChild className="bg-green-500 hover:bg-green-600">
          <Link href="/products">
            <X className="mr-2 h-4 w-4" />
            Clear All Filters
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Results count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{products.length}</span> products
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}

function ProductGridSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            <Skeleton className="aspect-square" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function ActiveFilters({ searchParams }: { searchParams: Awaited<ProductsPageProps['searchParams']> }) {
  const activeFilters: { key: string; label: string; icon: React.ReactNode }[] = []

  if (searchParams.vegan === 'true') {
    activeFilters.push({ key: 'vegan', label: 'Vegan', icon: <Leaf className="h-3 w-3" /> })
  }
  if (searchParams.vegetarian === 'true') {
    activeFilters.push({ key: 'vegetarian', label: 'Vegetarian', icon: <Heart className="h-3 w-3" /> })
  }
  if (searchParams.gluten_free === 'true') {
    activeFilters.push({ key: 'gluten_free', label: 'Gluten Free', icon: <Wheat className="h-3 w-3" /> })
  }
  if (searchParams.organic === 'true') {
    activeFilters.push({ key: 'organic', label: 'Organic', icon: <Star className="h-3 w-3" /> })
  }

  if (activeFilters.length === 0 && !searchParams.search) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm text-gray-500">Active filters:</span>
      {searchParams.search && (
        <Badge variant="secondary" className="bg-green-100 text-green-600 hover:bg-emerald-200">
          <Search className="h-3 w-3 mr-1" />
          &ldquo;{searchParams.search}&rdquo;
        </Badge>
      )}
      {activeFilters.map((filter) => (
        <Badge key={filter.key} variant="secondary" className="bg-green-100 text-green-600">
          {filter.icon}
          <span className="ml-1">{filter.label}</span>
        </Badge>
      ))}
      <Link href="/products">
        <Badge variant="outline" className="cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200">
          <X className="h-3 w-3 mr-1" />
          Clear all
        </Badge>
      </Link>
    </div>
  )
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-500 via-green-600 to-teal-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[size:20px_20px]" />

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-emerald-300/10 rounded-full blur-lg" />

        <div className="container mx-auto px-4 py-12 lg:py-16 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ShoppingBasket className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Fresh Daily
              </Badge>
            </div>

            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              {params.search
                ? <>Search Results for <span className="text-emerald-200">&ldquo;{params.search}&rdquo;</span></>
                : <>Explore Our <span className="text-emerald-200">Fresh Products</span></>
              }
            </h1>
            <p className="text-lg text-green-100 max-w-2xl">
              Discover thousands of quality products, from fresh produce to pantry essentials.
              All delivered fresh to your doorstep.
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">5,000+ Products</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Leaf className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Organic Options</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Premium Quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24">
              <ProductFilters />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            <ActiveFilters searchParams={params} />
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid searchParams={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
