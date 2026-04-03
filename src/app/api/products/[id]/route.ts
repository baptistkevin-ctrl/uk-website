import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET single product (public)
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

// Helper to verify admin role
async function requireAdminAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = getSupabaseAdmin()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return null
  return user
}

// PUT update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminAuth()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  // Only allow specific fields to be updated
  const allowedFields = [
    'name', 'slug', 'description', 'price_pence', 'compare_at_price_pence',
    'images', 'is_active', 'stock_quantity', 'sku', 'weight_grams',
    'unit', 'unit_size', 'brand', 'dietary_info', 'storage_instructions',
    'ingredients', 'nutritional_info', 'metadata'
  ]

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json(data[0])
}

// DELETE product (admin only — soft-delete if referenced by orders)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdminAuth()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

      return NextResponse.json({ success: true, softDeleted: true })
    }

    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
