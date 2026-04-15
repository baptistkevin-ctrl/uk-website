import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    // Limit to 50 products per batch request
    const limitedIds = ids.slice(0, 50)

    const supabase = getSupabaseAdmin()

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, price_pence, compare_at_price_pence, image_url, stock_quantity, track_inventory, allow_backorder, is_active')
      .in('id', limitedIds)
      .eq('is_active', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: products ?? [] })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
