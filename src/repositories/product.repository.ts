/**
 * Product Repository — Solaris Data Layer
 *
 * ONLY database queries live here. No business logic.
 * Services call repositories, repositories talk to the database.
 */

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'repo:products' })

// Column lists — NEVER SELECT *
const PRODUCT_COLUMNS = `
  id, name, slug, description, short_description,
  price_pence, compare_at_price_pence, image_url, images,
  sku, barcode, stock_quantity, low_stock_threshold,
  track_inventory, allow_backorder, unit, unit_value,
  brand, is_active, is_featured, is_organic, is_vegan,
  is_vegetarian, is_gluten_free, approval_status,
  meta_title, meta_description, weight_grams,
  vendor_id, created_at, updated_at
` as const

const PRODUCT_LIST_COLUMNS = `
  id, name, slug, price_pence, compare_at_price_pence,
  image_url, stock_quantity, is_active, is_featured,
  approval_status, brand, vendor_id,
  vendors(id, store_name, slug),
  created_at, updated_at
` as const

const PRODUCT_DETAIL_COLUMNS = `
  ${PRODUCT_COLUMNS},
  vendors(id, store_name, slug),
  categories:product_categories(category:categories(id, name, slug))
` as const

export const productRepository = {
  async findById(id: string) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_DETAIL_COLUMNS)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      log.error('Failed to find product', { id, error: error.message })
      throw error
    }
    return data
  },

  async findBySlug(slug: string) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_DETAIL_COLUMNS)
      .eq('slug', slug)
      .single()

    if (error && error.code !== 'PGRST116') {
      log.error('Failed to find product by slug', { slug, error: error.message })
      throw error
    }
    return data
  },

  async findMany(params: {
    page: number
    limit: number
    search?: string
    includeInactive?: boolean
    vendorId?: string
    category?: string
  }) {
    const supabase = getSupabaseAdmin()
    const offset = (params.page - 1) * params.limit

    let query = supabase
      .from('products')
      .select(PRODUCT_LIST_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + params.limit - 1)

    if (!params.includeInactive) {
      query = query.eq('is_active', true)
    }
    if (params.vendorId) {
      query = query.eq('vendor_id', params.vendorId)
    }
    if (params.search) {
      query = query.ilike('name', `%${params.search}%`)
    }

    const { data, error, count } = await query
    if (error) {
      log.error('Failed to list products', { error: error.message })
      throw error
    }

    return { data: data || [], total: count || 0 }
  },

  async create(fields: Record<string, unknown>) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .insert(fields)
      .select(PRODUCT_COLUMNS)
      .single()

    if (error) {
      log.error('Failed to create product', { error: error.message })
      throw error
    }
    return data
  },

  async update(id: string, fields: Record<string, unknown>) {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(PRODUCT_COLUMNS)
      .single()

    if (error) {
      log.error('Failed to update product', { id, error: error.message })
      throw error
    }
    return data
  },

  async softDelete(id: string) {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      log.error('Failed to soft-delete product', { id, error: error.message })
      throw error
    }
  },

  async findStockInfo() {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('products')
      .select('id, stock_quantity, low_stock_threshold, is_active, approval_status')

    if (error) throw error
    return data || []
  },
}
