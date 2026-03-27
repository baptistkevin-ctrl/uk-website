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
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`[WEBHOOK] checkout.session.completed: ${session.id}, payment_status=${session.payment_status}`)

        if (session.payment_status === 'paid') {
          await createOrder(session)
        }
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`[WEBHOOK] async_payment_succeeded: ${session.id}`)
        await createOrder(session)
        break
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.error('Payment failed for session:', session.id)
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await updateVendorStripeStatus(account)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error(`[WEBHOOK] CRITICAL ERROR processing ${event.type}:`, error)
    // Return 500 so Stripe retries the webhook
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function updateVendorStripeStatus(account: Stripe.Account) {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Find vendor by stripe_account_id
    const { data: vendor, error } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('stripe_account_id', account.id)
      .single()

    if (error || !vendor) {
      console.log(`No vendor found for Stripe account ${account.id}`)
      return
    }

    // Update vendor with latest Stripe status
    const { error: updateError } = await supabaseAdmin
      .from('vendors')
      .update({
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_onboarding_complete: account.details_submitted && account.charges_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendor.id)

    if (updateError) {
      console.error('Error updating vendor Stripe status:', updateError)
      return
    }

    console.log(`Updated Stripe status for vendor ${vendor.id}: charges=${account.charges_enabled}, payouts=${account.payouts_enabled}, onboarding=${account.details_submitted && account.charges_enabled}`)
  } catch (error) {
    console.error('Error in updateVendorStripeStatus:', error)
  }
}

async function createOrder(session: Stripe.Checkout.Session) {
  console.log(`[createOrder] START for session ${session.id}`)
  const metadata = session.metadata
  const supabaseAdmin = getSupabaseAdmin()

  if (!metadata) {
    console.error('[createOrder] No metadata in session')
    throw new Error('No metadata in session')
  }

  // Idempotency check: skip if order already exists for this checkout session
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle()

  if (existingOrder) {
    console.log(`[createOrder] Order already exists for session ${session.id}, skipping duplicate`)
    return // This is OK - not an error, just a duplicate
  }

  // Validate required metadata fields
  if (!metadata.orderNumber || !metadata.subtotal || !metadata.total) {
    console.error('[createOrder] Missing required metadata fields:', JSON.stringify({ orderNumber: metadata.orderNumber, subtotal: metadata.subtotal, total: metadata.total }))
    throw new Error(`Missing required metadata fields in session: ${session.id}`)
  }

  // Safe JSON parsing with validation
  let items: Array<{ productId: string; name: string; price: number; quantity: number; image?: string; vendorId?: string }>
  let vendorBreakdown: Record<string, { amount: number; commission: number; net: number }>

  try {
    items = JSON.parse(metadata.items || '[]')
  } catch {
    console.error('[createOrder] Failed to parse items metadata')
    throw new Error(`Failed to parse items metadata for session: ${session.id}`)
  }

  try {
    vendorBreakdown = JSON.parse(metadata.vendorBreakdown || '{}')
  } catch {
    console.error('[createOrder] Failed to parse vendorBreakdown metadata, using empty')
    vendorBreakdown = {}
  }

  if (!Array.isArray(items) || items.length === 0) {
    console.error('[createOrder] No valid items in order metadata')
    throw new Error(`No valid items in order metadata for session: ${session.id}`)
  }

  // Validate parsed numeric fields
  const subtotalParsed = parseInt(metadata.subtotal)
  const deliveryFeeParsed = parseInt(metadata.deliveryFee || '0')
  const totalParsed = parseInt(metadata.total)

  if (isNaN(subtotalParsed) || isNaN(deliveryFeeParsed) || isNaN(totalParsed)) {
    console.error('[createOrder] Invalid numeric metadata')
    throw new Error(`Invalid numeric metadata in session: ${session.id}`)
  }

  // Create order
  // userId can be empty string from metadata - treat as null for FK constraint
  const userId = metadata.userId && metadata.userId.length > 0 ? metadata.userId : null
  const customerEmail = session.customer_details?.email || metadata.customerEmail || ''

  console.log(`[createOrder] Creating order ${metadata.orderNumber}: userId=${userId}, email=${customerEmail}, total=${totalParsed}`)

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      order_number: metadata.orderNumber,
      user_id: userId,
      customer_email: customerEmail,
      customer_name: metadata.customerName || 'Customer',
      customer_phone: metadata.customerPhone || '',
      delivery_address_line_1: metadata.deliveryAddressLine1 || '',
      delivery_address_line_2: metadata.deliveryAddressLine2 || null,
      delivery_city: metadata.deliveryCity || '',
      delivery_county: metadata.deliveryCounty || null,
      delivery_postcode: metadata.deliveryPostcode || '',
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
    console.error('[createOrder] Error creating order:', orderError.message, orderError.details, orderError.hint, orderError.code)
    throw new Error(`Failed to create order: ${orderError.message}`)
  }

  console.log(`[createOrder] Order created: ${order.order_number} (${order.id})`)

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
    console.error('[createOrder] Error creating order items:', itemsError)
  }

  // Update product stock (non-critical, don't throw)
  for (const item of items) {
    try {
      await supabaseAdmin.rpc('decrement_stock', {
        product_id: item.productId,
        quantity: item.quantity,
      })
    } catch (stockError) {
      console.error('[createOrder] Error decrementing stock:', stockError)
    }
  }

  // Process vendor orders and transfers (non-critical for order creation, don't throw)
  try {
    await processVendorPayments(order.id, vendorBreakdown, session.payment_intent as string, items, supabaseAdmin)
  } catch (vendorError) {
    console.error('[createOrder] Error processing vendor payments:', vendorError)
    // Don't throw - order was created successfully, vendor payments can be retried
  }

  console.log(`[createOrder] SUCCESS: ${order.order_number}`)
}

async function processVendorPayments(
  orderId: string,
  vendorBreakdown: Record<string, { amount: number; commission: number; net: number }>,
  paymentIntentId: string,
  orderItems: Array<{ productId: string; vendorId?: string; price: number; quantity: number }>,
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>
) {
  // Build vendor breakdown from order items if metadata was truncated/empty
  let effectiveBreakdown = vendorBreakdown
  const vendorIdsFromBreakdown = Object.keys(effectiveBreakdown).filter(id => id !== 'platform')

  if (vendorIdsFromBreakdown.length === 0 && orderItems.length > 0) {
    // Rebuild breakdown from order items
    console.log('Rebuilding vendor breakdown from order items')
    const itemsByVendor: Record<string, number> = {}
    for (const item of orderItems) {
      if (item.vendorId) {
        itemsByVendor[item.vendorId] = (itemsByVendor[item.vendorId] || 0) + (item.price * item.quantity)
      }
    }

    // Fetch commission rates
    const vIds = Object.keys(itemsByVendor)
    if (vIds.length > 0) {
      const { data: vendors } = await supabaseAdmin
        .from('vendors')
        .select('id, commission_rate')
        .in('id', vIds)

      effectiveBreakdown = {}
      for (const vid of vIds) {
        const amount = itemsByVendor[vid]
        const rate = vendors?.find(v => v.id === vid)?.commission_rate || 12.5
        const commission = Math.round(amount * (rate / 100))
        effectiveBreakdown[vid] = { amount, commission, net: amount - commission }
      }
    }
  }

  const vendorIds = Object.keys(effectiveBreakdown).filter(id => id !== 'platform')

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

  // Get the charge ID from the payment intent (Stripe transfers need charge ID, not PI ID)
  let chargeId: string | null = null
  if (paymentIntentId) {
    try {
      const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge'],
      })
      const latestCharge = paymentIntent.latest_charge
      if (typeof latestCharge === 'string') {
        chargeId = latestCharge
      } else if (latestCharge && typeof latestCharge === 'object' && 'id' in latestCharge) {
        chargeId = latestCharge.id
      }
      console.log(`Resolved charge ID: ${chargeId} from payment intent: ${paymentIntentId}`)
    } catch (piError) {
      console.error('Error retrieving payment intent for charge ID:', piError)
    }
  }

  // Create vendor orders and initiate transfers
  for (const vendor of vendors) {
    const breakdown = effectiveBreakdown[vendor.id]
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
        // Build transfer params - use charge ID if available, otherwise skip source_transaction
        const transferParams: Stripe.TransferCreateParams = {
          amount: breakdown.net,
          currency: 'gbp',
          destination: vendor.stripe_account_id,
          transfer_group: orderId,
          metadata: {
            order_id: orderId,
            vendor_id: vendor.id,
            vendor_order_id: vendorOrder.id,
          },
        }

        // source_transaction requires a charge ID (ch_), not payment intent (pi_)
        if (chargeId) {
          transferParams.source_transaction = chargeId
        }

        const transfer = await getStripe().transfers.create(transferParams)

        // Update vendor order with transfer info
        await supabaseAdmin
          .from('vendor_orders')
          .update({
            stripe_transfer_id: transfer.id,
            status: 'transferred',
          })
          .eq('id', vendorOrder.id)

        console.log(`Transfer ${transfer.id} created for vendor ${vendor.id}: ${breakdown.net} pence (${breakdown.amount} total - ${breakdown.commission} commission)`)
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
