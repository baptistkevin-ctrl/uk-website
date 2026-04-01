import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { orderAudit } from '@/lib/security'

export const dynamic = 'force-dynamic'

// GET single order with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const { id } = await params
  const supabaseAdmin = getSupabaseAdmin()

  // Get order
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (orderError) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Get order items
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', id)

  if (itemsError) {
    console.error('Failed to fetch order items:', itemsError)
    return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 })
  }

  return NextResponse.json({ ...order, items })
}

// DELETE order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const { id } = await params
  const supabaseAdmin = getSupabaseAdmin()

  // Get order details before deletion for audit log
  const { data: orderToDelete } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  // First delete order items
  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .delete()
    .eq('order_id', id)

  if (itemsError) {
    console.error('Failed to delete order items:', itemsError)
    return NextResponse.json({ error: 'Failed to delete order items' }, { status: 500 })
  }

  // Then delete the order
  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .delete()
    .eq('id', id)

  if (orderError) {
    console.error('Failed to delete order:', orderError)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }

  // Log audit event
  if (auth.user && auth.profile) {
    await orderAudit.logDelete(
      request,
      { id: auth.user.id, email: auth.user.email || '', role: auth.profile.role },
      id,
      orderToDelete?.order_number || id,
      orderToDelete || undefined
    )
  }

  return NextResponse.json({ success: true })
}
