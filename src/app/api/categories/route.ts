import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'

export const dynamic = 'force-dynamic'

// GET all categories (public)
export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const includeInactive = searchParams.get('includeInactive') === 'true'

  let query = supabaseAdmin
    .from('categories')
    .select('*, parent:parent_id(*)')
    .order('display_order', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Create new category (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { name, slug, description, image_url, emoji, parent_id, display_order, is_active } = body

    if (!name || typeof name !== 'string' || name.length > 200) {
      return NextResponse.json({ error: 'Valid name is required (max 200 chars)' }, { status: 400 })
    }

    if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Valid slug is required (lowercase, numbers, hyphens only)' }, { status: 400 })
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
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// PUT - Update category (admin only)
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { id, name, slug, description, image_url, emoji, parent_id, display_order, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Only allow specific fields to be updated
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.length > 200) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
      }
      updateData.name = name
    }
    if (slug !== undefined) {
      if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
      }
      updateData.slug = slug
    }
    if (description !== undefined) updateData.description = description
    if (image_url !== undefined) updateData.image_url = image_url
    if (emoji !== undefined) updateData.emoji = emoji
    if (parent_id !== undefined) {
      // Prevent circular reference
      if (parent_id === id) {
        return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 })
      }
      updateData.parent_id = parent_id
    }
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE - Delete category (admin only)
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

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
    if (error.code === '23503') {
      return NextResponse.json({ error: 'Cannot delete category with linked products. Remove products first.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
