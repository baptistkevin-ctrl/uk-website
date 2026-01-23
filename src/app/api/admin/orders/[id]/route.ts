import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// GET single order with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabaseAdmin = getSupabaseAdmin()

  // Get order
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 404 })
  }

  // Get order items
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', id)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ ...order, items })
}

// DELETE order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabaseAdmin = getSupabaseAdmin()

  // First delete order items
  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .delete()
    .eq('order_id', id)

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  // Then delete the order
  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .delete()
    .eq('id', id)

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
