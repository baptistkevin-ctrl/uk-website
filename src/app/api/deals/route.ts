import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET - Get active flash deals
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const featured = searchParams.get('featured') === 'true'
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const offset = (page - 1) * limit

  const supabaseAdmin = getSupabaseAdmin()

  let query = supabaseAdmin
    .from('flash_deals')
    .select(`
      *,
      products:product_id (
        id,
        name,
        slug,
        price_pence,
        compare_at_price_pence,
        image_url,
        stock_quantity,
        is_active,
        avg_rating,
        review_count
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .lte('starts_at', new Date().toISOString())
    .gte('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true })

  if (featured) {
    query = query.eq('is_featured', true)
  }

  const { data: deals, error, count } = await query
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Deals fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }

  // Filter out deals where max_quantity is reached
  const activeDeals = deals?.filter(deal => {
    if (deal.max_quantity === null) return true
    return deal.claimed_quantity < deal.max_quantity
  }) || []

  return NextResponse.json({
    deals: activeDeals,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  })
}
