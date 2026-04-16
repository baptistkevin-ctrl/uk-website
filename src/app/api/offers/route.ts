import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET active offers (optionally filtered by product IDs)
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const productIds = searchParams.get('products')?.split(',').filter(Boolean)

    let query = supabaseAdmin
      .from('multibuy_offers')
      .select('*')
      .eq('is_active', true)

    if (productIds && productIds.length > 0) {
      query = query.in('product_id', productIds)
    }

    const { data, error } = await query

    if (error) {
      // Table doesn't exist or query failed — return empty array
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json([])
      }
      console.error('Offers API error:', error.message)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (error) {
    // Graceful fallback — never 500 on offers
    return NextResponse.json([])
  }
}
