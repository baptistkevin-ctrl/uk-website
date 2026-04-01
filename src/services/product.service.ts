/**
 * Product Service — Solaris Service Layer
 *
 * All product business logic lives here.
 * API routes call this service and convert Results to HTTP responses.
 */

import { ok, fail } from '@/lib/utils/result'
import type { Result } from '@/lib/utils/result'
import { logger } from '@/lib/utils/logger'
import { productRepository } from '@/repositories/product.repository'

const log = logger.child({ context: 'products' })

// Types
export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  price_pence: number
  compare_at_price_pence: number | null
  image_url: string | null
  images: string[] | null
  sku: string | null
  barcode: string | null
  stock_quantity: number | null
  is_active: boolean
  is_featured: boolean
  vendor_id: string | null
  brand: string | null
  created_at: string
  updated_at: string
}

// Whitelist of fields that can be set on create/update
const ALLOWED_FIELDS = new Set([
  'name', 'slug', 'description', 'short_description', 'price_pence',
  'compare_at_price_pence', 'image_url', 'images', 'sku', 'barcode',
  'stock_quantity', 'low_stock_threshold', 'track_inventory', 'allow_backorder',
  'unit', 'unit_value', 'brand', 'is_active', 'is_featured',
  'is_organic', 'is_vegan', 'is_vegetarian', 'is_gluten_free',
  'meta_title', 'meta_description', 'weight_grams',
])

/**
 * Filter an object to only include whitelisted fields.
 * Prevents mass assignment attacks.
 */
function sanitizeFields(input: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (ALLOWED_FIELDS.has(key)) {
      sanitized[key] = value
    }
  }
  return sanitized
}

export const productService = {
  /**
   * Get a single product by ID.
   */
  async getById(productId: string): Promise<Result<Product>> {
    try {
      const data = await productRepository.findById(productId)
      if (!data) {
        log.warn('Product not found', { productId })
        return fail('Product not found', 'NOT_FOUND')
      }
      return ok(data as unknown as Product)
    } catch (error) {
      log.error('Failed to get product', { productId, error: (error as Error).message })
      return fail('Failed to fetch product', 'INTERNAL_ERROR')
    }
  },

  /**
   * List products with pagination and optional filters.
   */
  async list(options: {
    page?: number
    limit?: number
    category?: string
    search?: string
    includeInactive?: boolean
    vendorId?: string
  }): Promise<Result<{ products: Product[]; total: number }>> {
    try {
      const page = options.page || 1
      const limit = Math.min(options.limit || 20, 200)

      const result = await productRepository.findMany({
        page,
        limit,
        search: options.search,
        includeInactive: options.includeInactive,
        vendorId: options.vendorId,
      })

      return ok({ products: result.data as unknown as Product[], total: result.total })
    } catch (error) {
      log.error('Failed to list products', { error: (error as Error).message })
      return fail('Failed to fetch products', 'INTERNAL_ERROR')
    }
  },

  /**
   * Create a new product.
   */
  async create(input: Record<string, unknown>, vendorId?: string): Promise<Result<Product>> {
    const fields = sanitizeFields(input)

    if (!fields.name || !fields.price_pence) {
      return fail('Name and price are required', 'VALIDATION_ERROR')
    }

    if (vendorId) {
      fields.vendor_id = vendorId
    }

    try {
      const data = await productRepository.create(fields)
      log.info('Product created', { productId: data.id, name: fields.name })
      return ok(data as unknown as Product)
    } catch (error) {
      log.error('Failed to create product', { error: (error as Error).message })
      return fail('Failed to create product', 'INTERNAL_ERROR')
    }
  },

  /**
   * Update a product. Only whitelisted fields are applied.
   */
  async update(productId: string, input: Record<string, unknown>): Promise<Result<Product>> {
    const fields = sanitizeFields(input)

    if (Object.keys(fields).length === 0) {
      return fail('No valid fields to update', 'VALIDATION_ERROR')
    }

    try {
      const data = await productRepository.update(productId, fields)
      log.info('Product updated', { productId, fields: Object.keys(fields) })
      return ok(data as unknown as Product)
    } catch (error) {
      if ((error as { code?: string }).code === 'PGRST116') {
        return fail('Product not found', 'NOT_FOUND')
      }
      log.error('Failed to update product', { productId, error: (error as Error).message })
      return fail('Failed to update product', 'INTERNAL_ERROR')
    }
  },

  /**
   * Soft-delete a product (set is_active = false).
   */
  async softDelete(productId: string): Promise<Result<{ deleted: true }>> {
    try {
      await productRepository.softDelete(productId)
      log.info('Product soft-deleted', { productId })
      return ok({ deleted: true as const })
    } catch (error) {
      log.error('Failed to soft-delete product', { productId, error: (error as Error).message })
      return fail('Failed to delete product', 'INTERNAL_ERROR')
    }
  },
}
