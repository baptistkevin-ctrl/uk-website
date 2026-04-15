import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10') || 10))

  let query = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      total_pence,
      created_at,
      items:order_items(
        id,
        product_id,
        quantity,
        price_pence,
        product:products(id, name, slug, price_pence, image_url)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: orders, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders: orders ?? [] })
}
