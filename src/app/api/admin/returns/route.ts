import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { sanitizeSearchQuery } from '@/lib/security'

export const dynamic = 'force-dynamic'

// GET - List all returns (admin)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
  const offset = (page - 1) * limit

  const supabaseAdmin = getSupabaseAdmin()

  let query = supabaseAdmin
    .from('returns')
    .select(`
      *,
      orders (
        order_number,
        customer_name,
        customer_email,
        total_pence
      ),
      profiles:user_id (
        full_name,
        email
      ),
      return_items (
        quantity,
        refund_amount_pence,
        products (name)
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    const sanitized = sanitizeSearchQuery(search)
    if (sanitized) {
      query = query.or(`return_number.ilike.%${sanitized}%`)
    }
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    returns: data,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  })
}

// PUT - Update return status (admin)
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const body = await request.json()
  const { id, status, admin_notes, rejection_reason, return_tracking_number, return_carrier } = body

  if (!id) {
    return NextResponse.json({ error: 'Return ID required' }, { status: 400 })
  }

  const validStatuses = [
    'approved',
    'rejected',
    'items_received',
    'inspecting',
    'refund_processing',
    'refunded'
  ]

  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Get current return
  const { data: currentReturn, error: fetchError } = await supabaseAdmin
    .from('returns')
    .select('*, return_items(*)')
    .eq('id', id)
    .single()

  if (fetchError || !currentReturn) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    handled_by: auth.user?.id
  }

  if (status) updates.status = status
  if (admin_notes) updates.admin_notes = admin_notes
  if (rejection_reason) updates.rejection_reason = rejection_reason
  if (return_tracking_number) updates.return_tracking_number = return_tracking_number
  if (return_carrier) updates.return_carrier = return_carrier

  // If approving, set approved_at
  if (status === 'approved') {
    updates.approved_at = new Date().toISOString()
  }

  // If items received, set received_at
  if (status === 'items_received') {
    updates.received_at = new Date().toISOString()
  }

  // If refunded, process the refund
  if (status === 'refunded') {
    updates.refunded_at = new Date().toISOString()

    // If refund method is store_credit, create a store credit
    if (currentReturn.refund_method === 'store_credit') {
      await supabaseAdmin.from('store_credits').insert({
        user_id: currentReturn.user_id,
        return_id: currentReturn.id,
        amount_pence: currentReturn.refund_amount_pence,
        remaining_pence: currentReturn.refund_amount_pence,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      })
    }

    // If items should be restocked
    for (const item of currentReturn.return_items) {
      if (item.restock) {
        await supabaseAdmin
          .from('products')
          .update({
            stock_quantity: supabaseAdmin.rpc('increment_stock', {
              product_id: item.product_id,
              amount: item.quantity
            })
          })
          .eq('id', item.product_id)
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from('returns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
