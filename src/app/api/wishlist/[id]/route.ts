import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )
}

// GET - Get a single wishlist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabaseAdmin = getSupabaseAdmin()

  // Check if it's a share token or ID
  const isShareToken = id.length === 32

  let query = supabaseAdmin
    .from('wishlists')
    .select(`
      *,
      user:user_id (full_name, avatar_url),
      wishlist_items (
        id,
        product_id,
        added_price_pence,
        notes,
        created_at,
        products:product_id (
          id,
          name,
          slug,
          price_pence,
          compare_at_price_pence,
          image_url,
          is_active,
          stock_quantity
        )
      )
    `)

  if (isShareToken) {
    query = query.eq('share_token', id).eq('is_public', true)
  } else {
    query = query.eq('id', id)
  }

  const { data: wishlist, error } = await query.single()

  if (error || !wishlist) {
    return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 })
  }

  // If not public and not a share token, check ownership
  if (!isShareToken && !wishlist.is_public) {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || wishlist.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  return NextResponse.json({ wishlist })
}

// PUT - Update a wishlist
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, is_public } = body

  const supabaseAdmin = getSupabaseAdmin()

  // Verify ownership
  const { data: existingWishlist } = await supabaseAdmin
    .from('wishlists')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existingWishlist || existingWishlist.user_id !== user.id) {
    return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name
  if (is_public !== undefined) updates.is_public = is_public

  const { data: wishlist, error } = await supabaseAdmin
    .from('wishlists')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Wishlist update error:', error)
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 })
  }

  return NextResponse.json({ wishlist })
}

// DELETE - Delete a wishlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Verify ownership
  const { data: existingWishlist } = await supabaseAdmin
    .from('wishlists')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existingWishlist || existingWishlist.user_id !== user.id) {
    return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 })
  }

  // Check if this is the only wishlist
  const { count } = await supabaseAdmin
    .from('wishlists')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (count && count <= 1) {
    return NextResponse.json({ error: 'Cannot delete your only wishlist' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('wishlists')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Wishlist delete error:', error)
    return NextResponse.json({ error: 'Failed to delete wishlist' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
