'use server'

import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { generateOrderNumber } from '@/lib/utils/format'

interface CheckoutItem {
  productId: string
  name: string
  price: number // in pence
  quantity: number
  image?: string | null
}

interface CustomerInfo {
  email: string
  name: string
  phone: string
}

interface DeliveryAddress {
  line1: string
  line2?: string
  city: string
  county?: string
  postcode: string
  instructions?: string
}

interface CreateCheckoutSessionParams {
  items: CheckoutItem[]
  customerInfo: CustomerInfo
  deliveryAddress: DeliveryAddress
  deliveryFee: number
}

export async function createCheckoutSession({
  items,
  customerInfo,
  deliveryAddress,
  deliveryFee,
}: CreateCheckoutSessionParams): Promise<{ url?: string; error?: string; orderNumber?: string }> {
  try {
    const supabase = await createClient()

    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = subtotal + deliveryFee

    // Create order number
    const orderNumber = generateOrderNumber()

    // Create line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: item.price, // Already in pence
      },
      quantity: item.quantity,
    }))

    // Add delivery fee as a line item if applicable
    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Delivery Fee',
            images: [],
          },
          unit_amount: deliveryFee,
        },
        quantity: 1,
      })
    }

    // Create Stripe Checkout Session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerInfo.email,
      line_items: lineItems,
      metadata: {
        orderNumber,
        userId: user?.id || '',
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        deliveryAddressLine1: deliveryAddress.line1,
        deliveryAddressLine2: deliveryAddress.line2 || '',
        deliveryCity: deliveryAddress.city,
        deliveryCounty: deliveryAddress.county || '',
        deliveryPostcode: deliveryAddress.postcode,
        deliveryInstructions: deliveryAddress.instructions || '',
        subtotal: subtotal.toString(),
        deliveryFee: deliveryFee.toString(),
        total: total.toString(),
        items: JSON.stringify(items),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${orderNumber}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
    })

    return { url: session.url!, orderNumber }
  } catch (error) {
    console.error('Checkout error:', error)
    return { error: 'Failed to create checkout session. Please try again.' }
  }
}
