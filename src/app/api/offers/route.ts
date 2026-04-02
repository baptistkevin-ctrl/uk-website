import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:offers' })

export const dynamic = 'force-dynamic'

// GET active offers (optionally filtered by product IDs)
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const productIds = searchParams.get('products')?.split(',').filter(Boolean)

  // Validate that all product IDs are valid UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (productIds && productIds.some(id => !uuidRegex.test(id))) {
    return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('multibuy_offers')
    .select('*')
    .eq('is_active', true)
    .or('start_date.is.null,start_date.lte.now()')
    .or('end_date.is.null,end_date.gte.now()')

  if (productIds && productIds.length > 0) {
    query = query.in('product_id', productIds)
  }

  const { data, error } = await query

  if (error) {
    log.error('Error fetching offers', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
  }

  return NextResponse.json(data)
}
