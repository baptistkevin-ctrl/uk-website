import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// GET all hero slides
export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()

  const { data, error } = await supabaseAdmin
    .from('hero_slides')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Create new hero slide
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// PUT - Update hero slide
export async function PUT(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Slide ID is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('hero_slides')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE - Delete hero slide
export async function DELETE(request: NextRequest) {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
