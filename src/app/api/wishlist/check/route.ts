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

// GET - Check if products are in user's wishlist
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ wishlistProductIds: [] })
  }

  const searchParams = request.nextUrl.searchParams
  const productIds = searchParams.get('product_ids')?.split(',').filter(Boolean) || []

  if (productIds.length === 0) {
    return NextResponse.json({ wishlistProductIds: [] })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Get user's wishlists
  const { data: wishlists } = await supabaseAdmin
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)

  if (!wishlists || wishlists.length === 0) {
    return NextResponse.json({ wishlistProductIds: [] })
  }

  const wishlistIds = wishlists.map(w => w.id)

  // Check which products are in wishlists
  const { data: items } = await supabaseAdmin
    .from('wishlist_items')
    .select('product_id')
    .in('wishlist_id', wishlistIds)
    .in('product_id', productIds)

  const wishlistProductIds = items?.map(item => item.product_id) || []

  return NextResponse.json({ wishlistProductIds })
}
