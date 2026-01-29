import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET - Get public store info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabaseAdmin = getSupabaseAdmin()

  // Get vendor by slug
  const { data: vendor, error } = await supabaseAdmin
    .from('vendors')
    .select(`
      id,
      business_name,
      slug,
      description,
      logo_url,
      banner_url,
      city,
      rating,
      review_count,
      is_verified,
      created_at
    `)
    .eq('slug', slug)
    .eq('status', 'approved')
    .single()

  if (error || !vendor) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }

  // Get product count
  const { count: productCount } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id)
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  return NextResponse.json({
    vendor: {
      ...vendor,
      product_count: productCount || 0,
    },
  })
}
