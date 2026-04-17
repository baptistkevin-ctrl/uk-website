import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Return empty orders for unauthenticated users — don't 401
      return NextResponse.json({ orders: [] })
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
      // Table may not exist or query failed — return empty
      return NextResponse.json({ orders: [] })
    }

    return NextResponse.json({ orders: orders ?? [] })
  } catch {
    return NextResponse.json({ orders: [] })
  }
}
