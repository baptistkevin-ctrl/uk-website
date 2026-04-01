import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { formatZodErrors } from '@/lib/validation/schemas'

const createWishlistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  is_public: z.boolean().optional(),
})

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

// GET - Get user's wishlists with items
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to view your wishlist' }, { status: 401 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Get wishlists with items and product details
  const { data: wishlists, error } = await supabaseAdmin
    .from('wishlists')
    .select(`
      *,
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
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Wishlist fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch wishlists' }, { status: 500 })
  }

  // If no wishlists exist, create a default one
  if (!wishlists || wishlists.length === 0) {
    const { data: newWishlist, error: createError } = await supabaseAdmin
      .from('wishlists')
      .insert({
        user_id: user.id,
        name: 'My Wishlist',
      })
      .select(`
        *,
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
      .single()

    if (createError) {
      console.error('Wishlist creation error:', createError)
      return NextResponse.json({ error: 'Failed to create wishlist' }, { status: 500 })
    }

    return NextResponse.json({ wishlists: [newWishlist] })
  }

  return NextResponse.json({ wishlists })
}

// POST - Create a new wishlist
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to create a wishlist' }, { status: 401 })
  }

  const body = await request.json()

  const parsed = createWishlistSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: formatZodErrors(parsed.error) }, { status: 400 })
  }

  const { name, is_public } = parsed.data

  const supabaseAdmin = getSupabaseAdmin()

  const { data: wishlist, error } = await supabaseAdmin
    .from('wishlists')
    .insert({
      user_id: user.id,
      name: name || 'My Wishlist',
      is_public: is_public || false,
    })
    .select()
    .single()

  if (error) {
    console.error('Wishlist creation error:', error)
    return NextResponse.json({ error: 'Failed to create wishlist' }, { status: 500 })
  }

  return NextResponse.json({ wishlist })
}
