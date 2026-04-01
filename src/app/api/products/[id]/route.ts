import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { cacheInvalidateTag } from '@/lib/cache'

export const dynamic = 'force-dynamic'

// Whitelist of fields that can be updated via this endpoint
const ALLOWED_UPDATE_FIELDS = new Set([
  'name', 'slug', 'description', 'short_description', 'price_pence',
  'compare_at_price_pence', 'image_url', 'images', 'sku', 'barcode',
  'stock_quantity', 'low_stock_threshold', 'track_inventory', 'allow_backorder',
  'unit', 'unit_value', 'brand', 'is_active', 'is_featured',
  'is_organic', 'is_vegan', 'is_vegetarian', 'is_gluten_free',
  'meta_title', 'meta_description', 'weight_grams',
])

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, product_categories(categories(id, name))')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// PUT update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return auth.error || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  // Only allow whitelisted fields
  const sanitizedUpdate: Record<string, unknown> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED_UPDATE_FIELDS.has(key)) {
      sanitizedUpdate[key] = body[key]
    }
  }

  if (Object.keys(sanitizedUpdate).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  sanitizedUpdate.updated_at = new Date().toISOString()

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('products')
    .update(sanitizedUpdate)
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  await cacheInvalidateTag('products')
  return NextResponse.json(data[0])
}

// DELETE product (admin only, soft-delete if referenced by orders)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) {
    return auth.error || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabaseAdmin = getSupabaseAdmin()

  // Try hard delete first
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    // Foreign key violation — product has order_items referencing it
    // Soft-delete by deactivating instead
    if (error.code === '23503') {
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ is_active: false })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to deactivate product' }, { status: 500 })
      }

      await cacheInvalidateTag('products')
      return NextResponse.json({ success: true, softDeleted: true })
    }

    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }

  await cacheInvalidateTag('products')
  return NextResponse.json({ success: true })
}
