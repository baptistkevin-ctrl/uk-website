import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:returns' })

export const dynamic = 'force-dynamic'

// GET - Get single return details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: returnRequest, error } = await supabaseAdmin
    .from('returns')
    .select(`
      *,
      orders (
        order_number,
        total_pence,
        delivery_address,
        created_at
      ),
      return_items (
        id,
        quantity,
        condition,
        condition_notes,
        refund_amount_pence,
        restock,
        products (
          id,
          name,
          image_url,
          price_pence
        )
      ),
      return_status_history (
        id,
        old_status,
        new_status,
        notes,
        created_at
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !returnRequest) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 })
  }

  return NextResponse.json(returnRequest)
}

// PATCH - Cancel return request (user can only cancel pending returns)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action } = body

  if (action !== 'cancel') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Get return and verify ownership
  const { data: returnRequest, error: fetchError } = await supabaseAdmin
    .from('returns')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !returnRequest) {
    return NextResponse.json({ error: 'Return not found' }, { status: 404 })
  }

  // Can only cancel pending returns
  if (returnRequest.status !== 'pending') {
    return NextResponse.json(
      { error: 'Can only cancel pending return requests' },
      { status: 400 }
    )
  }

  // Update status to cancelled
  const { data, error } = await supabaseAdmin
    .from('returns')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    log.error('Error cancelling return', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to cancel return request' }, { status: 500 })
  }

  return NextResponse.json({
    return: data,
    message: 'Return request cancelled successfully'
  })
}
