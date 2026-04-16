import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/product-card'
import { StoreBanner, SortSelect } from '@/components/store'
import { VendorChatButton } from '@/components/chat/vendor-chat-button'
import { StoreReviews } from '@/components/store/StoreReviews'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, ArrowUpDown, CheckCircle, Star } from 'lucide-react'

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
        <p className="text-(--color-text-muted)">Error loading products. Please try again.</p>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16 bg-background rounded-xl">
        <div className="w-16 h-16 bg-(--color-elevated) rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-(--color-text-disabled)" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">No products yet</h3>
        <p className="text-(--color-text-muted) text-sm">This store hasn&apos;t added any products yet.</p>
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
        <div key={i} className="rounded-xl border bg-(--color-surface) overflow-hidden">
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

import { ChefHat, Clock, Users as UsersIcon } from 'lucide-react'
import Image from 'next/image'

async function StoreRecipes({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const supabase = await createClient()

  const { data: recipes } = await supabase
    .from('vendor_recipes')
    .select('id, title, slug, description, image_url, prep_time, cook_time, servings, difficulty')
    .eq('vendor_id', vendorId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6)

  if (!recipes || recipes.length === 0) return null

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-(--brand-primary-light) flex items-center justify-center">
          <ChefHat className="h-5 w-5 text-(--brand-primary)" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Recipes by {vendorName}</h2>
          <p className="text-sm text-(--color-text-muted)">Try these recipes using our products</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="group rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden hover:shadow-lg hover:border-(--brand-primary)/30 transition-all"
          >
            <div className="aspect-video bg-(--color-elevated) relative overflow-hidden">
              {recipe.image_url ? (
                <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="h-10 w-10 text-(--color-text-disabled)" />
                </div>
              )}
              <div className="absolute top-2 right-2 px-2.5 py-1 bg-(--color-surface)/90 backdrop-blur-sm rounded-md text-xs font-medium text-foreground">
                {recipe.difficulty}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground group-hover:text-(--brand-primary) transition-colors line-clamp-1">{recipe.title}</h3>
              {recipe.description && (
                <p className="text-sm text-(--color-text-muted) mt-1 line-clamp-2">{recipe.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-(--color-text-muted)">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {recipe.prep_time + recipe.cook_time} min</span>
                <span className="flex items-center gap-1"><UsersIcon className="h-3.5 w-3.5" /> {recipe.servings} servings</span>
              </div>
            </div>
          </div>
        ))}
      </div>
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
    <div className="min-h-screen bg-background">
      {/* Store Banner */}
      <StoreBanner vendor={vendorWithCount} />

      {/* Chat with Store Button */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <VendorChatButton
          vendorId={vendor.id}
          vendorName={vendor.business_name}
        />
      </div>

      {/* Products Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Products</h2>
            <p className="text-sm text-(--color-text-muted)">
              {productCount} products available
            </p>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-(--color-text-muted)" />
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

        {/* Vendor Recipes */}
        <Suspense fallback={null}>
          <StoreRecipes vendorId={vendor.id} vendorName={vendor.business_name} />
        </Suspense>

        {/* About This Seller */}
        <div className="mt-12 rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">About {vendor.business_name}</h2>
          {vendor.description && (
            <p className="text-(--color-text-secondary) mb-4">{vendor.description}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold font-mono text-foreground">{productCount || 0}</p>
              <p className="text-xs text-(--color-text-muted)">Products</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-5 w-5 fill-(--brand-amber) text-(--brand-amber)" />
                <p className="text-2xl font-bold font-mono text-foreground">{vendor.rating || 'N/A'}</p>
              </div>
              <p className="text-xs text-(--color-text-muted)">{vendor.review_count || 0} reviews</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold font-mono text-foreground">
                {new Date(vendor.created_at).getFullYear()}
              </p>
              <p className="text-xs text-(--color-text-muted)">Member Since</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              {vendor.is_verified ? (
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="h-5 w-5 text-(--color-success)" />
                  <p className="text-sm font-semibold text-(--color-success)">Verified</p>
                </div>
              ) : (
                <p className="text-sm text-(--color-text-muted)">Unverified</p>
              )}
              <p className="text-xs text-(--color-text-muted) mt-1">Seller Status</p>
            </div>
          </div>
        </div>

        {/* Store Reviews */}
        <StoreReviews storeSlug={slug} />
      </div>
    </div>
  )
}
