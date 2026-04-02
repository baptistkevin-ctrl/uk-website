import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { uuidSchema, formatZodErrors } from '@/lib/validation/schemas'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:wishlist:toggle' })

const wishlistToggleSchema = z.object({
  product_id: uuidSchema,
  wishlist_id: uuidSchema.optional(),
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

// POST - Toggle product in wishlist (add if not exists, remove if exists)
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Please sign in to use wishlist' }, { status: 401 })
  }

  const body = await request.json()

  const parsed = wishlistToggleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: formatZodErrors(parsed.error) }, { status: 400 })
  }

  const { product_id, wishlist_id } = parsed.data

  const supabaseAdmin = getSupabaseAdmin()

  // Get or create default wishlist if not specified
  let targetWishlistId = wishlist_id

  if (!targetWishlistId) {
    // Get or create default wishlist
    const { data: wishlists } = await supabaseAdmin
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    if (wishlists && wishlists.length > 0) {
      targetWishlistId = wishlists[0].id
    } else {
      // Create default wishlist
      const { data: newWishlist, error: createError } = await supabaseAdmin
        .from('wishlists')
        .insert({
          user_id: user.id,
          name: 'My Wishlist',
        })
        .select('id')
        .single()

      if (createError) {
        log.error('Wishlist creation error', { error: createError instanceof Error ? createError.message : String(createError) })
        return NextResponse.json({ error: 'Failed to create wishlist' }, { status: 500 })
      }

      targetWishlistId = newWishlist.id
    }
  }

  // Check if item already exists in wishlist
  const { data: existingItem } = await supabaseAdmin
    .from('wishlist_items')
    .select('id')
    .eq('wishlist_id', targetWishlistId)
    .eq('product_id', product_id)
    .single()

  if (existingItem) {
    // Remove from wishlist
    const { error } = await supabaseAdmin
      .from('wishlist_items')
      .delete()
      .eq('id', existingItem.id)

    if (error) {
      log.error('Wishlist item removal error', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
    }

    return NextResponse.json({ action: 'removed', product_id })
  } else {
    // Get product price to track price changes
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('price_pence')
      .eq('id', product_id)
      .single()

    // Add to wishlist
    const { error } = await supabaseAdmin
      .from('wishlist_items')
      .insert({
        wishlist_id: targetWishlistId,
        product_id,
        added_price_pence: product?.price_pence || null,
      })

    if (error) {
      log.error('Wishlist item addition error', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
    }

    return NextResponse.json({ action: 'added', product_id })
  }
}
