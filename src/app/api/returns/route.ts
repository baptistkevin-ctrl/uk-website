import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'
import { sanitizeText, checkRateLimit, rateLimitConfigs, addRateLimitHeaders } from '@/lib/security'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:returns' })

export const dynamic = 'force-dynamic'

// Validation schema for creating a return
const createReturnSchema = z.object({
  order_id: z.string().uuid(),
  reason: z.enum([
    'damaged',
    'wrong_item',
    'not_as_described',
    'quality_issue',
    'changed_mind',
    'expired',
    'missing_items',
    'other'
  ]),
  reason_details: z.string().max(2000).optional(),
  refund_method: z.enum(['original_payment', 'store_credit', 'bank_transfer', 'replacement']).optional(),
  items: z.array(z.object({
    order_item_id: z.string().uuid(),
    quantity: z.number().int().min(1)
  })).min(1),
  images: z.array(z.string().url()).max(5).optional()
})

// GET - List user's returns
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = (page - 1) * limit

  const supabaseAdmin = getSupabaseAdmin()

  let query = supabaseAdmin
    .from('returns')
    .select(`
      *,
      orders (
        order_number,
        total_pence,
        created_at
      ),
      return_items (
        id,
        quantity,
        refund_amount_pence,
        products (
          name,
          image_url
        )
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    log.error('Error fetching returns', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
  }

  return NextResponse.json({
    returns: data,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  })
}

// POST - Create a new return request
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimit = checkRateLimit(request, rateLimitConfigs.api)
  if (!rateLimit.allowed) {
    return addRateLimitHeaders(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 }),
      rateLimit
    )
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Validate input
  const validation = createReturnSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { order_id, reason, reason_details, refund_method, items, images } = validation.data

  const supabaseAdmin = getSupabaseAdmin()

  // Verify order belongs to user and is eligible for return
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', order_id)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Check if order is delivered (only delivered orders can be returned)
  if (order.status !== 'delivered') {
    return NextResponse.json(
      { error: 'Only delivered orders can be returned' },
      { status: 400 }
    )
  }

  // Check if within return window (e.g., 30 days)
  const deliveredAt = order.delivered_at ? new Date(order.delivered_at) : new Date(order.updated_at)
  const returnWindowDays = 30
  const returnDeadline = new Date(deliveredAt)
  returnDeadline.setDate(returnDeadline.getDate() + returnWindowDays)

  if (new Date() > returnDeadline) {
    return NextResponse.json(
      { error: `Return window has expired. Returns must be requested within ${returnWindowDays} days of delivery.` },
      { status: 400 }
    )
  }

  // Check if return already exists for this order
  const { data: existingReturn } = await supabaseAdmin
    .from('returns')
    .select('id, status')
    .eq('order_id', order_id)
    .not('status', 'in', '("cancelled","rejected")')
    .single()

  if (existingReturn) {
    return NextResponse.json(
      { error: 'A return request already exists for this order' },
      { status: 400 }
    )
  }

  // Validate items being returned
  const orderItemIds = order.order_items.map((item: { id: string }) => item.id)
  for (const item of items) {
    if (!orderItemIds.includes(item.order_item_id)) {
      return NextResponse.json(
        { error: `Item ${item.order_item_id} is not part of this order` },
        { status: 400 }
      )
    }

    const orderItem = order.order_items.find((oi: { id: string }) => oi.id === item.order_item_id)
    if (item.quantity > orderItem.quantity) {
      return NextResponse.json(
        { error: `Cannot return more items than ordered` },
        { status: 400 }
      )
    }
  }

  // Calculate refund amount
  let totalRefund = 0
  const returnItems = items.map(item => {
    const orderItem = order.order_items.find((oi: { id: string }) => oi.id === item.order_item_id)
    const itemRefund = Math.round((orderItem.price_pence / orderItem.quantity) * item.quantity)
    totalRefund += itemRefund

    return {
      order_item_id: item.order_item_id,
      product_id: orderItem.product_id,
      quantity: item.quantity,
      refund_amount_pence: itemRefund
    }
  })

  // Create return request
  const { data: returnRequest, error: returnError } = await supabaseAdmin
    .from('returns')
    .insert({
      order_id,
      user_id: user.id,
      reason,
      reason_details: reason_details ? sanitizeText(reason_details) : null,
      refund_method: refund_method || 'original_payment',
      refund_amount_pence: totalRefund,
      images: images || [],
      status: 'pending'
    })
    .select()
    .single()

  if (returnError) {
    return NextResponse.json({ error: returnError.message }, { status: 500 })
  }

  // Create return items
  const { error: itemsError } = await supabaseAdmin
    .from('return_items')
    .insert(returnItems.map(item => ({
      ...item,
      return_id: returnRequest.id
    })))

  if (itemsError) {
    // Rollback return if items fail
    await supabaseAdmin.from('returns').delete().eq('id', returnRequest.id)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({
    return: returnRequest,
    message: 'Return request submitted successfully. You will receive an email with further instructions.'
  }, { status: 201 })
}
