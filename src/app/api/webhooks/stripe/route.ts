import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status === 'paid') {
        await createOrder(session)
      }
      break
    }

    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session
      await createOrder(session)
      break
    }

    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session
      console.error('Payment failed for session:', session.id)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function createOrder(session: Stripe.Checkout.Session) {
  const metadata = session.metadata
  const supabaseAdmin = getSupabaseAdmin()

  if (!metadata) {
    console.error('No metadata in session')
    return
  }

  // Idempotency check: skip if order already exists for this checkout session
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle()

  if (existingOrder) {
    console.log(`Order already exists for session ${session.id}, skipping duplicate`)
    return
  }

  // Validate required metadata fields
  if (!metadata.orderNumber || !metadata.subtotal || !metadata.total) {
    console.error('Missing required metadata fields in session:', session.id)
    return
  }

  try {
    // Safe JSON parsing with validation
    let items: Array<{ productId: string; name: string; price: number; quantity: number; image?: string; vendorId?: string }>
    let vendorBreakdown: Record<string, { amount: number; commission: number; net: number }>

    try {
      items = JSON.parse(metadata.items || '[]')
    } catch {
      console.error('Failed to parse items metadata for session:', session.id)
      return
    }

    try {
      vendorBreakdown = JSON.parse(metadata.vendorBreakdown || '{}')
    } catch {
      console.error('Failed to parse vendorBreakdown metadata for session:', session.id)
      vendorBreakdown = {}
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.error('No valid items in order metadata for session:', session.id)
      return
    }

    // Validate parsed numeric fields
    const subtotalParsed = parseInt(metadata.subtotal)
    const deliveryFeeParsed = parseInt(metadata.deliveryFee || '0')
    const totalParsed = parseInt(metadata.total)

    if (isNaN(subtotalParsed) || isNaN(deliveryFeeParsed) || isNaN(totalParsed)) {
      console.error('Invalid numeric metadata in session:', session.id)
      return
    }

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: metadata.orderNumber,
        user_id: metadata.userId || null,
        customer_email: session.customer_details?.email || session.customer_email || '',
        customer_name: metadata.customerName,
        customer_phone: metadata.customerPhone,
        delivery_address_line_1: metadata.deliveryAddressLine1,
        delivery_address_line_2: metadata.deliveryAddressLine2 || null,
        delivery_city: metadata.deliveryCity,
        delivery_county: metadata.deliveryCounty || null,
        delivery_postcode: metadata.deliveryPostcode,
        delivery_instructions: metadata.deliveryInstructions || null,
        subtotal_pence: subtotalParsed,
        delivery_fee_pence: deliveryFeeParsed,
        total_pence: totalParsed,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return
    }

    // Create order items with vendor info
    const orderItems = items.map((item: { productId: string; name: string; price: number; quantity: number; image?: string; vendorId?: string }) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      product_image_url: item.image || null,
      quantity: item.quantity,
      unit_price_pence: item.price,
      total_price_pence: item.price * item.quantity,
      vendor_id: item.vendorId || null,
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
    }

    // Update product stock
    for (const item of items) {
      await supabaseAdmin.rpc('decrement_stock', {
        product_id: item.productId,
        quantity: item.quantity,
      })
    }

    // Process vendor orders and transfers
    await processVendorPayments(order.id, vendorBreakdown, session.payment_intent as string, supabaseAdmin)

    console.log('Order created successfully:', order.order_number)
  } catch (error) {
    console.error('Error processing webhook:', error)
  }
}

async function processVendorPayments(
  orderId: string,
  vendorBreakdown: Record<string, { amount: number; commission: number; net: number }>,
  paymentIntentId: string,
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>
) {
  // Get vendor Stripe account IDs
  const vendorIds = Object.keys(vendorBreakdown).filter(id => id !== 'platform')

  if (vendorIds.length === 0) {
    console.log('No vendor items in this order')
    return
  }

  // Fetch vendor details
  const { data: vendors } = await supabaseAdmin
    .from('vendors')
    .select('id, stripe_account_id, commission_rate')
    .in('id', vendorIds)

  if (!vendors || vendors.length === 0) {
    console.log('No vendors found')
    return
  }

  // Create vendor orders and initiate transfers
  for (const vendor of vendors) {
    const breakdown = vendorBreakdown[vendor.id]
    if (!breakdown) continue

    // Create vendor order record
    const { data: vendorOrder, error: vendorOrderError } = await supabaseAdmin
      .from('vendor_orders')
      .insert({
        order_id: orderId,
        vendor_id: vendor.id,
        total_amount: breakdown.amount,
        commission_amount: breakdown.commission,
        vendor_amount: breakdown.net,
        status: 'pending',
      })
      .select()
      .single()

    if (vendorOrderError) {
      console.error(`Error creating vendor order for ${vendor.id}:`, vendorOrderError)
      continue
    }

    // If vendor has a Stripe Connect account, initiate transfer
    if (vendor.stripe_account_id && breakdown.net > 0) {
      try {
        const transfer = await getStripe().transfers.create({
          amount: breakdown.net,
          currency: 'gbp',
          destination: vendor.stripe_account_id,
          transfer_group: orderId,
          source_transaction: paymentIntentId,
          metadata: {
            order_id: orderId,
            vendor_id: vendor.id,
            vendor_order_id: vendorOrder.id,
          },
        })

        // Update vendor order with transfer info
        await supabaseAdmin
          .from('vendor_orders')
          .update({
            stripe_transfer_id: transfer.id,
            status: 'transferred',
          })
          .eq('id', vendorOrder.id)

        console.log(`Transfer ${transfer.id} created for vendor ${vendor.id}`)
      } catch (transferError) {
        console.error(`Error creating transfer for vendor ${vendor.id}:`, transferError)

        // Mark as pending payout (will need manual transfer)
        await supabaseAdmin
          .from('vendor_orders')
          .update({
            status: 'pending_payout',
          })
          .eq('id', vendorOrder.id)
      }
    } else {
      // Vendor doesn't have Stripe connected yet
      await supabaseAdmin
        .from('vendor_orders')
        .update({
          status: 'pending_payout',
        })
        .eq('id', vendorOrder.id)

      console.log(`Vendor ${vendor.id} doesn't have Stripe connected - marked as pending payout`)
    }
  }
}
