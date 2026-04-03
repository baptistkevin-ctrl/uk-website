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

// POST - Add item to wishlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: wishlistId } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { product_id, notes } = body

  if (!product_id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Verify wishlist ownership
  const { data: wishlist } = await supabaseAdmin
    .from('wishlists')
    .select('user_id')
    .eq('id', wishlistId)
    .single()

  if (!wishlist || wishlist.user_id !== user.id) {
    return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 })
  }

  // Get product price for price tracking
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('price_pence')
    .eq('id', product_id)
    .single()

  // Add item
  const { data: item, error } = await supabaseAdmin
    .from('wishlist_items')
    .upsert({
      wishlist_id: wishlistId,
      product_id,
      added_price_pence: product?.price_pence || null,
      notes
    }, {
      onConflict: 'wishlist_id,product_id'
    })
    .select()
    .single()

  if (error) {
    console.error('Add item error:', error)
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
  }

  return NextResponse.json({ success: true, item })
}

// DELETE - Remove item from wishlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: wishlistId } = await params
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Verify wishlist ownership
  const { data: wishlist } = await supabaseAdmin
    .from('wishlists')
    .select('user_id')
    .eq('id', wishlistId)
    .single()

  if (!wishlist || wishlist.user_id !== user.id) {
    return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from('wishlist_items')
    .delete()
    .eq('wishlist_id', wishlistId)
    .eq('product_id', productId)

  if (error) {
    console.error('Remove item error:', error)
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
