import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { checkRateLimit, rateLimitConfigs, addRateLimitHeaders } from '@/lib/security'

export const dynamic = 'force-dynamic'

// GET all categories
export async function GET(request: NextRequest) {
  // Rate limiting — 60 requests per minute per IP
  const rateLimit = checkRateLimit(request, rateLimitConfigs.categoriesGet)
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: 'Too many category requests. Please slow down.' },
      { status: 429 }
    )
    return addRateLimitHeaders(response, rateLimit)
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const includeInactive = searchParams.get('includeInactive') === 'true'

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('categories')
    .select('*, parent:parent_id(*)', { count: 'exact' })
    .order('display_order', { ascending: true })
    .range(offset, offset + limit - 1)

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }

  const total = count ?? 0
  return NextResponse.json({
    data: data ?? [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// POST - Create new category
export async function POST(request: Request) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { name, slug, description, image_url, emoji, parent_id, display_order, is_active } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name,
        slug,
        description: description || null,
        image_url: image_url || null,
        emoji: emoji || null,
        parent_id: parent_id || null,
        display_order: display_order || 0,
        is_active: is_active !== false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// PUT - Update category
export async function PUT(request: Request) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE - Delete category
export async function DELETE(request: Request) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
