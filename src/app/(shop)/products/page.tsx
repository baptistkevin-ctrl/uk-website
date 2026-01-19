import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/product-card'
import { ProductFilters } from '@/components/products/product-filters'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

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
  title: 'Products',
  description: 'Browse our selection of fresh groceries and quality products.',
}

async function ProductGrid({ searchParams }: { searchParams: Awaited<ProductsPageProps['searchParams']> }) {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*')
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
      <div className="text-center py-12">
        <p className="text-gray-500">Error loading products. Please try again.</p>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <p className="text-gray-500 mb-4">No products found.</p>
        {searchParams.search && (
          <p className="text-sm text-gray-400 mb-4">
            Try adjusting your search or filters.
          </p>
        )}
        <Button asChild>
          <Link href="/products">Clear Filters</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-white overflow-hidden">
          <Skeleton className="aspect-square" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {params.search ? `Search results for "${params.search}"` : 'All Products'}
        </h1>
        <p className="text-gray-600">
          Browse our selection of fresh groceries and quality products.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <ProductFilters />
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid searchParams={params} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
