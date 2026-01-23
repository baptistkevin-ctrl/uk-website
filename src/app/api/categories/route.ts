import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// GET all categories
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Create new category
export async function POST(request: Request) {
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// PUT - Update category
export async function PUT(request: Request) {
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE - Delete category
export async function DELETE(request: Request) {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
