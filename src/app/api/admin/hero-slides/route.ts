import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'

export const dynamic = 'force-dynamic'

// GET all hero slides
export async function GET() {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('hero_slides')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching hero slides:', error)
    return NextResponse.json({ error: 'Failed to fetch hero slides' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Create new hero slide
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { title, subtitle, image_url, button_text, button_link, is_active, display_order } = body

    if (!title || !image_url) {
      return NextResponse.json(
        { error: 'Title and image URL are required' },
        { status: 400 }
      )
    }

    // Get max display order
    const { data: maxOrderData } = await supabaseAdmin
      .from('hero_slides')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const newOrder = display_order ?? (maxOrderData ? maxOrderData.display_order + 1 : 1)

    const { data, error } = await supabaseAdmin
      .from('hero_slides')
      .insert({
        title,
        subtitle,
        image_url,
        button_text,
        button_link,
        is_active: is_active !== false,
        display_order: newOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating hero slide:', error)
      return NextResponse.json({ error: 'Failed to create hero slide' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// PUT - Update hero slide
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Slide ID is required' }, { status: 400 })
    }

    const allowedFields = ['title', 'subtitle', 'image_url', 'button_text', 'button_link', 'is_active', 'display_order']
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field]
    }

    const { data, error } = await supabaseAdmin
      .from('hero_slides')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating hero slide:', error)
      return NextResponse.json({ error: 'Failed to update hero slide' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE - Delete hero slide
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Slide ID is required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('hero_slides')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting hero slide:', error)
    return NextResponse.json({ error: 'Failed to delete hero slide' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
