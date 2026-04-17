import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'

export const dynamic = 'force-dynamic'

// GET single vendor by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const { id } = await params
  const supabaseAdmin = getSupabaseAdmin()

  const { data: vendor, error } = await supabaseAdmin
    .from('vendors')
    .select('*, user:user_id(email, full_name)')
    .eq('id', id)
    .single()

  if (error || !vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }

  // Fetch vendor product stats
  const { count: totalProducts } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', id)

  const { count: activeProducts } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', id)
    .eq('is_active', true)

  // Fetch vendor order stats
  const { data: orderStats } = await supabaseAdmin
    .from('order_items')
    .select('quantity, price_pence, order_id')
    .eq('vendor_id', id)

  const totalOrders = new Set(orderStats?.map(i => i.order_id) || []).size
  const totalRevenue = orderStats?.reduce((sum, i) => sum + (i.price_pence * i.quantity), 0) || 0

  return NextResponse.json({
    vendor,
    stats: {
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      totalOrders,
      totalRevenue,
    }
  })
}
