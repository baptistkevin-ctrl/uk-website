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

  try {
    // Parse items from metadata
    const items = JSON.parse(metadata.items || '[]')

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
        subtotal_pence: parseInt(metadata.subtotal),
        delivery_fee_pence: parseInt(metadata.deliveryFee),
        total_pence: parseInt(metadata.total),
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

    // Create order items
    const orderItems = items.map((item: { productId: string; name: string; price: number; quantity: number; image?: string }) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      product_image_url: item.image || null,
      quantity: item.quantity,
      unit_price_pence: item.price,
      total_price_pence: item.price * item.quantity,
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

    console.log('Order created successfully:', order.order_number)
  } catch (error) {
    console.error('Error processing webhook:', error)
  }
}
