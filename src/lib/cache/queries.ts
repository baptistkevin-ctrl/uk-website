/**
 * Cached database queries for enterprise-scale performance.
 *
 * These functions wrap common Supabase queries with the caching layer,
 * reducing database load for high-traffic pages.
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { cached, cacheInvalidateTag, TTL } from './index'

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function getCachedProducts(options?: {
  categoryId?: string
  limit?: number
  offset?: number
  activeOnly?: boolean
}) {
  const { categoryId, limit = 50, offset = 0, activeOnly = true } = options || {}
  const key = `products:list:${categoryId || 'all'}:${limit}:${offset}:${activeOnly}`

  return cached(
    key,
    async () => {
      const supabase = getSupabaseAdmin()
      let query = supabase
        .from('products')
        .select('*, product_categories(categories(id, name))', { count: 'exact' })

      if (categoryId) query = query.eq('product_categories.category_id', categoryId)
      if (activeOnly) query = query.eq('is_active', true)

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { data: data || [], count: count || 0 }
    },
    TTL.MEDIUM,
    ['products', categoryId ? `category:${categoryId}` : 'products:all']
  )
}

export async function getCachedProductBySlug(slug: string) {
  return cached(
    `product:slug:${slug}`,
    async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(categories(id, name, slug))')
        .eq('slug', slug)
        .single()

      if (error) return null
      return data
    },
    TTL.MEDIUM,
    ['products', `product:${slug}`]
  )
}

export async function getCachedFeaturedProducts(limit: number = 12) {
  return cached(
    `products:featured:${limit}`,
    async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(categories(id, name))')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    },
    TTL.LONG,
    ['products', 'products:featured']
  )
}

export async function getCachedTrendingProducts(limit: number = 12) {
  return cached(
    `products:trending:${limit}`,
    async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(categories(id, name))')
        .eq('is_active', true)
        .order('view_count', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    },
    TTL.MEDIUM,
    ['products', 'products:trending']
  )
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCachedCategories() {
  return cached(
    'categories:all',
    async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    },
    TTL.VERY_LONG,
    ['categories']
  )
}

export async function getCachedCategoryBySlug(slug: string) {
  return cached(
    `category:slug:${slug}`,
    async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) return null
      return data
    },
    TTL.VERY_LONG,
    ['categories', `category:${slug}`]
  )
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export async function getCachedBrands() {
  return cached(
    'brands:all',
    async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('products')
        .select('brand')
        .eq('is_active', true)
        .not('brand', 'is', null)

      if (error) throw error
      const brands = (data || []).map((p) => p.brand as string)
      return [...new Set(brands)].sort()
    },
    TTL.LONG,
    ['brands', 'products']
  )
}

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------

export async function getCachedVendors(status?: string) {
  const key = `vendors:${status || 'all'}`
  return cached(
    key,
    async () => {
      const supabase = getSupabaseAdmin()
      let query = supabase.from('vendors').select('*').order('created_at', { ascending: false })
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    TTL.LONG,
    ['vendors']
  )
}

// ---------------------------------------------------------------------------
// Site Settings
// ---------------------------------------------------------------------------

export async function getCachedSiteSettings() {
  return cached(
    'site-settings',
    async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single()

      if (error) return null
      return data
    },
    TTL.VERY_LONG,
    ['settings']
  )
}

// ---------------------------------------------------------------------------
// Deals & Offers (active only)
// ---------------------------------------------------------------------------

export async function getCachedActiveDeals() {
  return cached(
    'deals:active',
    async () => {
      const supabase = getSupabaseAdmin()
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('deals')
        .select('*, products(name, slug, image_url, price, compare_at_price)')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('end_date', { ascending: true })

      if (error) throw error
      return data || []
    },
    TTL.SHORT,
    ['deals']
  )
}

export async function getCachedActiveOffers() {
  return cached(
    'offers:active',
    async () => {
      const supabase = getSupabaseAdmin()
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('multibuy_offers')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)

      if (error) throw error
      return data || []
    },
    TTL.MEDIUM,
    ['offers']
  )
}

// ---------------------------------------------------------------------------
// Hero Slides
// ---------------------------------------------------------------------------

export async function getCachedHeroSlides() {
  return cached(
    'hero-slides:active',
    async () => {
      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data || []
    },
    TTL.LONG,
    ['hero-slides']
  )
}

// ---------------------------------------------------------------------------
// Dashboard Stats (admin)
// ---------------------------------------------------------------------------

export async function getCachedDashboardStats() {
  return cached(
    'admin:dashboard-stats',
    async () => {
      const supabase = getSupabaseAdmin()

      const [products, orders, users, vendors] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('vendors').select('id', { count: 'exact', head: true }),
      ])

      return {
        totalProducts: products.count || 0,
        totalOrders: orders.count || 0,
        totalUsers: users.count || 0,
        totalVendors: vendors.count || 0,
      }
    },
    TTL.MEDIUM,
    ['dashboard']
  )
}

// ---------------------------------------------------------------------------
// Cache Invalidation Helpers
// ---------------------------------------------------------------------------

export async function invalidateProductCache() {
  await cacheInvalidateTag('products')
}

export async function invalidateCategoryCache() {
  await cacheInvalidateTag('categories')
}

export async function invalidateVendorCache() {
  await cacheInvalidateTag('vendors')
}

export async function invalidateDealCache() {
  await cacheInvalidateTag('deals')
}

export async function invalidateSettingsCache() {
  await cacheInvalidateTag('settings')
}

export async function invalidateAllCaches() {
  await Promise.all([
    cacheInvalidateTag('products'),
    cacheInvalidateTag('categories'),
    cacheInvalidateTag('vendors'),
    cacheInvalidateTag('deals'),
    cacheInvalidateTag('offers'),
    cacheInvalidateTag('settings'),
    cacheInvalidateTag('hero-slides'),
    cacheInvalidateTag('dashboard'),
  ])
}
