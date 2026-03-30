import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/product-card'
import { StoreBanner, SortSelect } from '@/components/store'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, ArrowUpDown } from 'lucide-react'

// ISR: revalidate store pages every 2 minutes
export const revalidate = 120

interface StorePageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    sort?: string
    page?: string
    category?: string
  }>
}

export async function generateMetadata({ params }: StorePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('business_name, description')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (!vendor) {
    return {
      title: 'Store Not Found',
    }
  }

  return {
    title: `${vendor.business_name} | Store`,
    description: vendor.description || `Shop products from ${vendor.business_name}`,
  }
}

async function StoreProducts({
  vendorId,
  searchParams,
}: {
  vendorId: string
  searchParams: Awaited<StorePageProps['searchParams']>
}) {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_active', true)

  // Sorting
  switch (searchParams.sort) {
    case 'price_asc':
      query = query.order('price_pence', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price_pence', { ascending: false })
      break
    case 'rating':
      query = query.order('avg_rating', { ascending: false })
      break
    case 'popular':
      query = query.order('review_count', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data: products, error } = await query

  if (error) {
    console.error('Error fetching store products:', error)
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Error loading products. Please try again.</p>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">No products yet</h3>
        <p className="text-gray-500 text-sm">This store hasn&apos;t added any products yet.</p>
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

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-white overflow-hidden">
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
  )
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { slug } = await params
  const search = await searchParams
  const supabase = await createClient()

  // Get vendor info
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select(`
      id,
      business_name,
      slug,
      description,
      logo_url,
      banner_url,
      city,
      rating,
      review_count,
      is_verified,
      created_at
    `)
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (error || !vendor) {
    notFound()
  }

  // Get product count
  const { count: productCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id)
    .eq('is_active', true)

  const vendorWithCount = {
    ...vendor,
    product_count: productCount || 0,
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Banner */}
      <StoreBanner vendor={vendorWithCount} />

      {/* Products Section */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Products</h2>
            <p className="text-sm text-gray-500">
              {productCount} products available
            </p>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
            <SortSelect
              options={sortOptions}
              currentSort={search.sort || 'newest'}
            />
          </div>
        </div>

        {/* Products Grid */}
        <Suspense fallback={<ProductsSkeleton />}>
          <StoreProducts vendorId={vendor.id} searchParams={search} />
        </Suspense>
      </div>
    </div>
  )
}
