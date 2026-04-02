import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { getStripe } from '@/lib/stripe/client'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:vendor-transfers' })

export const dynamic = 'force-dynamic'

// GET - list vendor orders with transfer status
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error!

  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending_payout'

  const { data, error } = await supabaseAdmin
    .from('vendor_orders')
    .select('*, vendor:vendor_id(id, business_name, stripe_account_id, commission_rate), order:order_id(id, order_number, total_pence, payment_status, stripe_payment_intent_id)')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - retry transfer for a specific vendor order or process all pending
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error!

  const supabaseAdmin = getSupabaseAdmin()
  const stripe = getStripe()

  try {
    const body = await request.json()
    const { vendor_order_id, process_all } = body

    const results: Array<{
      vendor_order_id: string
      vendor_name: string
      amount: number
      status: string
      message: string
    }> = []

    // Get vendor orders to process
    let query = supabaseAdmin
      .from('vendor_orders')
      .select('*, vendor:vendor_id(id, business_name, stripe_account_id, commission_rate), order:order_id(id, order_number, total_pence, payment_status, stripe_payment_intent_id)')

    if (process_all) {
      query = query.in('status', ['pending', 'pending_payout'])
    } else if (vendor_order_id) {
      query = query.eq('id', vendor_order_id)
    } else {
      return NextResponse.json({ error: 'Provide vendor_order_id or process_all: true' }, { status: 400 })
    }

    const { data: vendorOrders, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!vendorOrders || vendorOrders.length === 0) {
      return NextResponse.json({ message: 'No pending vendor orders found', results: [] })
    }

    for (const vo of vendorOrders) {
      const vendor = vo.vendor as { id?: string; business_name?: string; stripe_account_id?: string } | null
      const order = vo.order as { id?: string; order_number?: string; stripe_payment_intent_id?: string } | null

      if (!vendor?.stripe_account_id) {
        results.push({
          vendor_order_id: vo.id,
          vendor_name: vendor?.business_name || 'Unknown',
          amount: vo.vendor_amount,
          status: 'skipped',
          message: 'Vendor has no Stripe Connect account',
        })
        continue
      }

      if (!order?.stripe_payment_intent_id) {
        results.push({
          vendor_order_id: vo.id,
          vendor_name: vendor?.business_name || 'Unknown',
          amount: vo.vendor_amount,
          status: 'skipped',
          message: 'Order has no payment intent',
        })
        continue
      }

      if (vo.stripe_transfer_id) {
        results.push({
          vendor_order_id: vo.id,
          vendor_name: vendor?.business_name || 'Unknown',
          amount: vo.vendor_amount,
          status: 'skipped',
          message: `Already transferred: ${vo.stripe_transfer_id}`,
        })
        continue
      }

      try {
        // Get charge ID from payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id, {
          expand: ['latest_charge'],
        })

        let chargeId: string | null = null
        const latestCharge = paymentIntent.latest_charge
        if (typeof latestCharge === 'string') {
          chargeId = latestCharge
        } else if (latestCharge && typeof latestCharge === 'object' && 'id' in latestCharge) {
          chargeId = latestCharge.id
        }

        // Create transfer
        const transferParams: Record<string, unknown> = {
          amount: vo.vendor_amount,
          currency: 'gbp',
          destination: vendor.stripe_account_id,
          transfer_group: order.id,
          metadata: {
            order_id: order.id || '',
            order_number: order.order_number || '',
            vendor_id: vendor.id || '',
            vendor_order_id: vo.id,
            retry: 'true',
          },
        }

        if (chargeId) {
          transferParams.source_transaction = chargeId
        }

        const transfer = await stripe.transfers.create(transferParams as unknown as Parameters<typeof stripe.transfers.create>[0])

        // Update vendor order
        await supabaseAdmin
          .from('vendor_orders')
          .update({
            stripe_transfer_id: transfer.id,
            status: 'transferred',
            updated_at: new Date().toISOString(),
          })
          .eq('id', vo.id)

        results.push({
          vendor_order_id: vo.id,
          vendor_name: vendor.business_name || 'Unknown',
          amount: vo.vendor_amount,
          status: 'transferred',
          message: `Transfer ${transfer.id} created - ${vo.vendor_amount} pence sent to ${vendor.business_name || 'vendor'}`,
        })
      } catch (transferError: any) {
        results.push({
          vendor_order_id: vo.id,
          vendor_name: vendor?.business_name || 'Unknown',
          amount: vo.vendor_amount,
          status: 'error',
          message: transferError.message || 'Transfer failed',
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    })
  } catch (error) {
    log.error('Vendor transfer error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
