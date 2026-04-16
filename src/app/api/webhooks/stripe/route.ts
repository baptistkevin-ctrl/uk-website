import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import { captureError } from '@/lib/error-tracking'

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

  // Two webhook endpoints: one for platform account events, one for connected account events
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_ACCOUNT,
  ].filter(Boolean) as string[]

  if (secrets.length === 0) {
    captureError('No STRIPE_WEBHOOK_SECRET configured', { context: 'webhook:stripe', level: 'fatal' })
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event | null = null

  for (const secret of secrets) {
    try {
      event = getStripe().webhooks.constructEvent(body, signature, secret)
      break
    } catch {
      // Try next secret
    }
  }

  if (!event) {
    captureError(new Error('Webhook signature verification failed with all secrets'), {
      context: 'webhook:stripe:signature',
      level: 'warning',
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`[WEBHOOK] checkout.session.completed: ${session.id}, payment_status=${session.payment_status}`)

        if (session.payment_status === 'paid') {
          await createOrder(session, event.id)
        }
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`[WEBHOOK] async_payment_succeeded: ${session.id}`)
        await createOrder(session, event.id)
        break
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        captureError(`Payment failed for session: ${session.id}`, {
          context: 'webhook:stripe:payment_failed',
          level: 'warning',
          extra: { sessionId: session.id, customerEmail: session.customer_details?.email },
        })
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
    captureError(error instanceof Error ? error : new Error(String(error)), {
      context: 'webhook:stripe:processing',
      level: 'fatal',
      extra: { eventType: event.type, eventId: event.id },
    })
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
      captureError(new Error(`Failed to update vendor Stripe status: ${updateError.message}`), {
        context: 'webhook:stripe:vendor_update',
        extra: { vendorId: vendor.id, accountId: account.id },
      })
      return
    }

    console.log(`Updated Stripe status for vendor ${vendor.id}: charges=${account.charges_enabled}, payouts=${account.payouts_enabled}`)
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      context: 'webhook:stripe:vendor_status',
      extra: { accountId: account.id },
    })
  }
}

async function createOrder(session: Stripe.Checkout.Session, eventId: string) {
  console.log(`[createOrder] START for session ${session.id} (event: ${eventId})`)
  const metadata = session.metadata
  const supabaseAdmin = getSupabaseAdmin()

  if (!metadata) {
    throw new Error(`No metadata in session ${session.id}`)
  }

  // DB-level idempotency: skip if order already exists for this checkout session
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id, order_number')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle()

  if (existingOrder) {
    console.log(`[createOrder] Order ${existingOrder.order_number} already exists for session ${session.id}, skipping`)
    return
  }

  // Validate required metadata fields
  if (!metadata.orderNumber || !metadata.subtotal || !metadata.total) {
    throw new Error(`Missing required metadata fields in session: ${session.id}`)
  }

  // Safe JSON parsing with validation
  let items: Array<{ productId: string; name: string; price: number; quantity: number; image?: string; vendorId?: string }>
  let vendorBreakdown: Record<string, { amount: number; commission: number; net: number }>

  try {
    items = JSON.parse(metadata.items || '[]')
  } catch {
    throw new Error(`Failed to parse items metadata for session: ${session.id}`)
  }

  try {
    vendorBreakdown = JSON.parse(metadata.vendorBreakdown || '{}')
  } catch {
    vendorBreakdown = {}
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(`No valid items in order metadata for session: ${session.id}`)
  }

  // Validate parsed numeric fields
  const subtotalParsed = parseInt(metadata.subtotal)
  const deliveryFeeParsed = parseInt(metadata.deliveryFee || '0')
  const totalParsed = parseInt(metadata.total)

  if (isNaN(subtotalParsed) || isNaN(deliveryFeeParsed) || isNaN(totalParsed)) {
    throw new Error(`Invalid numeric metadata in session: ${session.id}`)
  }

  // userId can be empty string from metadata - treat as null for FK constraint
  const userId = metadata.userId && metadata.userId.length > 0 ? metadata.userId : null
  const customerEmail = session.customer_details?.email || metadata.customerEmail || ''

  console.log(`[createOrder] Creating order ${metadata.orderNumber}: userId=${userId}, email=${customerEmail}, total=${totalParsed}`)

  // Create order
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
    captureError(new Error(`Failed to create order: ${orderError.message}`), {
      context: 'webhook:stripe:create_order',
      extra: { sessionId: session.id, orderNumber: metadata.orderNumber, code: orderError.code },
    })
    throw new Error(`Failed to create order: ${orderError.message}`)
  }

  console.log(`[createOrder] Order created: ${order.order_number} (${order.id})`)

  // Create order items with vendor info
  const orderItems = items.map((item) => ({
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
    captureError(new Error(`Failed to create order items: ${itemsError.message}`), {
      context: 'webhook:stripe:order_items',
      extra: { orderId: order.id },
    })
  }

  // Update product stock atomically (non-critical, don't throw)
  for (const item of items) {
    try {
      const { error: rpcError } = await supabaseAdmin.rpc('decrement_stock', {
        p_product_id: item.productId,
        p_quantity: item.quantity,
      })

      if (rpcError) {
        captureError(new Error(`Stock decrement RPC failed: ${rpcError.message}`), {
          context: 'webhook:stripe:stock_update',
          extra: { productId: item.productId, orderId: order.id },
        })
      }
    } catch (stockError) {
      captureError(stockError instanceof Error ? stockError : new Error(String(stockError)), {
        context: 'webhook:stripe:stock_update',
        extra: { productId: item.productId, orderId: order.id },
      })
    }
  }

  // Process vendor orders and transfers (non-critical for order creation)
  try {
    await processVendorPayments(order.id, vendorBreakdown, session.payment_intent as string, items, supabaseAdmin)
  } catch (vendorError) {
    captureError(vendorError instanceof Error ? vendorError : new Error(String(vendorError)), {
      context: 'webhook:stripe:vendor_payments',
      extra: { orderId: order.id },
    })
  }

  // Award loyalty points (non-critical, logged-in users only)
  if (userId) {
    try {
      const { awardOrderPoints } = await import('@/lib/automation/loyalty-points')
      // Check if this is the user's first order
      const { count } = await supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('id', order.id)

      const isFirstOrder = (count || 0) === 0
      const result = await awardOrderPoints(userId, order.id, totalParsed, isFirstOrder)
      if (result.success) {
        console.log(`[createOrder] Awarded ${result.points_awarded} loyalty points to user ${userId}`)
      }
    } catch (loyaltyError) {
      captureError(loyaltyError instanceof Error ? loyaltyError : new Error(String(loyaltyError)), {
        context: 'webhook:stripe:loyalty_points',
        extra: { orderId: order.id, userId },
      })
    }
  }

  // Send order confirmation email (non-critical)
  try {
    await sendOrderConfirmationEmail(order, items, customerEmail)
  } catch (emailError) {
    captureError(emailError instanceof Error ? emailError : new Error(String(emailError)), {
      context: 'webhook:stripe:confirmation_email',
      extra: { orderId: order.id, email: customerEmail },
    })
  }

  console.log(`[createOrder] SUCCESS: ${order.order_number}`)
}

async function sendOrderConfirmationEmail(
  order: { id: string; order_number: string; total_pence: number; delivery_address_line_1: string; delivery_postcode: string },
  items: Array<{ name: string; price: number; quantity: number }>,
  customerEmail: string
) {
  if (!process.env.RESEND_API_KEY || !customerEmail) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const itemRows = items
    .map((item) => `${item.name} x${item.quantity} - £${(item.price * item.quantity / 100).toFixed(2)}`)
    .join('\n')

  await resend.emails.send({
    from: 'Fresh Groceries <orders@freshgroceries.co.uk>',
    to: customerEmail,
    subject: `Order Confirmed - ${order.order_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e, #14b8a6); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed!</h1>
        </div>
        <div style="padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
          <p style="color: #374151; font-size: 16px;">Thank you for your order. We're getting it ready for delivery.</p>

          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">Order Number</p>
            <p style="margin: 0; font-size: 20px; color: #22c55e; font-weight: bold;">${order.order_number}</p>
          </div>

          <h3 style="color: #1f2937; margin: 24px 0 12px;">Items</h3>
          <pre style="background: #f8fafc; padding: 16px; border-radius: 8px; font-size: 14px; color: #374151; white-space: pre-wrap;">${itemRows}</pre>

          <div style="border-top: 2px solid #e2e8f0; margin: 24px 0; padding-top: 16px;">
            <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0;">
              Total: £${(order.total_pence / 100).toFixed(2)}
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Delivering to: ${order.delivery_address_line_1}, ${order.delivery_postcode}
          </p>

          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/track-order"
               style="display: inline-block; background: #22c55e; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Track Your Order
            </a>
          </div>
        </div>
        <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
          Fresh Groceries - Quality groceries delivered to your door
        </div>
      </div>
    `,
  })

  console.log(`[createOrder] Confirmation email sent to ${customerEmail}`)
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
    console.log('Rebuilding vendor breakdown from order items')
    const itemsByVendor: Record<string, number> = {}
    for (const item of orderItems) {
      if (item.vendorId) {
        itemsByVendor[item.vendorId] = (itemsByVendor[item.vendorId] || 0) + (item.price * item.quantity)
      }
    }

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
    .select('id, stripe_account_id, commission_rate, email, business_name')
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
      captureError(piError instanceof Error ? piError : new Error(String(piError)), {
        context: 'webhook:stripe:resolve_charge',
        extra: { paymentIntentId, orderId },
      })
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
      captureError(new Error(`Failed to create vendor order: ${vendorOrderError.message}`), {
        context: 'webhook:stripe:vendor_order',
        extra: { vendorId: vendor.id, orderId },
      })
      continue
    }

    // Notify vendor of new order via email
    try {
      const { sendEmail } = await import('@/lib/email/send-email')
      if (vendor.email) {
        await sendEmail({
          to: vendor.email,
          subject: `New Order Received - ${breakdown.amount ? `£${(breakdown.amount / 100).toFixed(2)}` : 'New Sale'}`,
          html: `<h2>You have a new order!</h2>
            <p>A customer has placed an order that includes your products.</p>
            <p><strong>Order Total:</strong> £${(breakdown.amount / 100).toFixed(2)}</p>
            <p><strong>Your Earnings:</strong> £${(breakdown.net / 100).toFixed(2)}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://uk-grocery-store.com'}/vendor/orders">View Order in Dashboard</a></p>`,
        })
      }
    } catch {
      // Non-critical
    }

    // If vendor has a Stripe Connect account, initiate transfer
    if (vendor.stripe_account_id && breakdown.net > 0) {
      try {
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

        if (chargeId) {
          transferParams.source_transaction = chargeId
        }

        const transfer = await getStripe().transfers.create(transferParams)

        await supabaseAdmin
          .from('vendor_orders')
          .update({
            stripe_transfer_id: transfer.id,
            status: 'transferred',
          })
          .eq('id', vendorOrder.id)

        console.log(`Transfer ${transfer.id} created for vendor ${vendor.id}: ${breakdown.net}p`)

        // Notify vendor of payout
        try {
          const { sendEmail } = await import('@/lib/email/send-email')
          if (vendor.email) {
            await sendEmail({
              to: vendor.email,
              subject: `Payout Processed - £${(breakdown.net / 100).toFixed(2)}`,
              html: `<h2>Payment Sent!</h2>
                <p>A payout of <strong>£${(breakdown.net / 100).toFixed(2)}</strong> has been transferred to your Stripe account.</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://uk-grocery-store.com'}/vendor/payouts">View Payout History</a></p>`,
            })
          }
        } catch {
          // Non-critical
        }
      } catch (transferError) {
        captureError(transferError instanceof Error ? transferError : new Error(String(transferError)), {
          context: 'webhook:stripe:transfer',
          extra: { vendorId: vendor.id, orderId, amount: breakdown.net },
        })

        await supabaseAdmin
          .from('vendor_orders')
          .update({ status: 'pending_payout' })
          .eq('id', vendorOrder.id)
      }
    } else {
      await supabaseAdmin
        .from('vendor_orders')
        .update({ status: 'pending_payout' })
        .eq('id', vendorOrder.id)

      console.log(`Vendor ${vendor.id} no Stripe connected - marked as pending payout`)
    }
  }
}
