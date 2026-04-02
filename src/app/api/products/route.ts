import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin, requireVendor } from '@/lib/auth/verify'
import { productCreateSchema, validateData, formatZodErrors, uuidSchema } from '@/lib/validation/schemas'
import { sanitizeText, sanitizeRichHtml, sanitizeUrl, productAudit } from '@/lib/security'
import { cached, TTL, cacheInvalidateTag } from '@/lib/cache'
import { captureError } from '@/lib/error-tracking'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:products' })

export const dynamic = 'force-dynamic'

// GET all products - with server-side caching
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const includeInactive = searchParams.get('includeInactive') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  // Validate category UUID if provided
  if (category) {
    const categoryValidation = uuidSchema.safeParse(category)
    if (!categoryValidation.success) {
      return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 })
    }
  }

  try {
    const cacheKey = `api:products:${category || 'all'}:${includeInactive}:${limit}:${offset}`
    const data = await cached(
      cacheKey,
      async () => {
        const supabaseAdmin = getSupabaseAdmin()
        let query = supabaseAdmin
          .from('products')
          .select('*, product_categories(categories(id, name))', { count: 'exact' })

        if (category) {
          query = query.eq('product_categories.category_id', category)
        }

        if (!includeInactive) {
          query = query.eq('is_active', true)
        }

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (error) throw error

        // Enrich with vendor names
        const vendorIds = [...new Set((data || []).map(p => p.vendor_id).filter(Boolean))]
        let vendorMap: Record<string, string> = {}
        if (vendorIds.length > 0) {
          const { data: vendors } = await supabaseAdmin
            .from('vendors')
            .select('id, store_name')
            .in('id', vendorIds)
          if (vendors) {
            vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.store_name]))
          }
        }

        const enriched = (data || []).map(p => ({
          ...p,
          vendors: p.vendor_id ? { id: p.vendor_id, store_name: vendorMap[p.vendor_id] || null } : null
        }))

        return { products: enriched, total: count }
      },
      TTL.MEDIUM,
      ['products', category ? `category:${category}` : 'products:all']
    )

    return NextResponse.json(data.products, {
      headers: {
        'X-Total-Count': String(data.total || 0),
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    log.error('Products API error', { error: error instanceof Error ? error.message : String(error) })
    captureError(error instanceof Error ? error : new Error(String(error)), {
      context: 'api:products:get',
      extra: { category, limit, offset },
    })
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST new product (requires admin or vendor)
export async function POST(request: NextRequest) {
  // Try admin auth first, then vendor
  let auth = await requireAdmin(request)
  let isVendor = false

  if (!auth.success) {
    const vendorAuth = await requireVendor(request)
    if (!vendorAuth.success) {
      return NextResponse.json({ error: 'Unauthorized - Admin or vendor access required' }, { status: 403 })
    }
    auth = vendorAuth
    isVendor = true
  }

  const body = await request.json()

  // Validate with Zod schema
  const validation = validateData(productCreateSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodErrors(validation.errors) },
      { status: 400 }
    )
  }

  const validatedData = validation.data

  // Sanitize text fields
  const sanitizedProduct = {
    ...validatedData,
    name: sanitizeText(validatedData.name),
    description: validatedData.description ? sanitizeRichHtml(validatedData.description) : null,
    short_description: validatedData.short_description ? sanitizeText(validatedData.short_description) : null,
    brand: validatedData.brand ? sanitizeText(validatedData.brand) : null,
    image_url: validatedData.image_url ? sanitizeUrl(validatedData.image_url) : null,
    images: validatedData.images?.map(url => sanitizeUrl(url)).filter(Boolean) || [],
    meta_title: validatedData.meta_title ? sanitizeText(validatedData.meta_title) : null,
    meta_description: validatedData.meta_description ? sanitizeText(validatedData.meta_description) : null,
    // If vendor, automatically set vendor_id
    vendor_id: isVendor && 'vendorId' in auth ? auth.vendorId : validatedData.vendor_id
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert([sanitizedProduct])
    .select()
    .single()

  if (error) {
    log.error('Error creating product', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }

  // Log audit event
  if (auth.user && auth.profile) {
    await productAudit.logCreate(
      request,
      { id: auth.user.id, email: auth.user.email || '', role: auth.profile.role },
      data.id,
      data.name,
      sanitizedProduct
    )
  }

  // Invalidate product caches after creation
  await cacheInvalidateTag('products')

  return NextResponse.json(data, { status: 201 })
}
