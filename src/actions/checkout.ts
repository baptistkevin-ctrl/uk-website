'use server'

import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { generateOrderNumber } from '@/lib/utils/format'

// Stripe metadata values have a 500-char limit. This function safely truncates
// JSON by removing array items from the end rather than slicing mid-string.
function safeJsonMetadata(data: unknown): string {
  const json = JSON.stringify(data)
  if (json.length <= 500) return json

  // If it's an array, remove items from the end until it fits
  if (Array.isArray(data)) {
    const arr = [...data]
    while (arr.length > 0) {
      arr.pop()
      const trimmed = JSON.stringify(arr)
      if (trimmed.length <= 500) return trimmed
    }
    return '[]'
  }

  // For objects, remove keys from the end until it fits
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data as Record<string, unknown>)
    const obj = { ...(data as Record<string, unknown>) }
    while (keys.length > 0) {
      delete obj[keys.pop()!]
      const trimmed = JSON.stringify(obj)
      if (trimmed.length <= 500) return trimmed
    }
    return '{}'
  }

  return json.slice(0, 500)
}

interface CheckoutItem {
  productId: string
  name: string
  price: number // in pence
  quantity: number
  image?: string | null
  vendorId?: string | null
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
    const supabaseAdmin = getSupabaseAdmin()

    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Validate delivery fee
    if (typeof deliveryFee !== 'number' || deliveryFee < 0) {
      return { error: 'Invalid delivery fee' }
    }
    if (deliveryFee > 5000) {
      return { error: 'Delivery fee exceeds maximum allowed' }
    }

    // Validate items array
    if (!items || items.length === 0) {
      return { error: 'No items in cart' }
    }

    // Fetch product details with vendor info, price, and stock
    const productIds = items.map(item => item.productId)
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, vendor_id, price_pence, stock_quantity, is_active, name')
      .in('id', productIds)

    // Build product lookup map for validation
    const productMap = new Map<string, NonNullable<typeof products>[number]>()
    products?.forEach(p => productMap.set(p.id, p))

    // Validate each item against database
    for (const item of items) {
      const dbProduct = productMap.get(item.productId)

      if (!dbProduct) {
        return { error: `Product not found: ${item.productId}` }
      }

      if (!dbProduct.is_active) {
        return { error: `Product is no longer available: ${dbProduct.name}` }
      }

      // Reject if client price is higher than DB price (prevents overcharging)
      if (item.price > dbProduct.price_pence) {
        return { error: `Price has changed for ${dbProduct.name}. Please refresh your cart.` }
      }

      // If client price is lower, validate it's from a real offer (prevent price manipulation)
      if (item.price < dbProduct.price_pence) {
        const { data: validOffer } = await supabaseAdmin
          .from('multibuy_offers')
          .select('offer_price_pence, quantity')
          .eq('product_id', item.productId)
          .eq('is_active', true)
          .single()

        // Allow lower price only if a valid active offer exists for this product
        if (!validOffer) {
          // No valid offer — use DB price instead of rejecting (prevents cart breakage)
          item.price = dbProduct.price_pence
        }
      }

      if (item.quantity < 1) {
        return { error: `Invalid quantity for ${dbProduct.name}` }
      }

      if (dbProduct.stock_quantity !== null && dbProduct.stock_quantity < item.quantity) {
        return { error: `Insufficient stock for ${dbProduct.name}. Only ${dbProduct.stock_quantity} available.` }
      }
    }

    // Create a map of product to vendor
    const productVendorMap = new Map<string, string | null>()
    products?.forEach(p => {
      productVendorMap.set(p.id, p.vendor_id)
    })

    // Enrich items with vendor IDs
    const enrichedItems = items.map(item => ({
      ...item,
      vendorId: productVendorMap.get(item.productId) || null
    }))

    // Get unique vendor IDs and fetch their commission rates
    const vendorIds = [...new Set(enrichedItems.map(i => i.vendorId).filter(Boolean))] as string[]

    let vendorCommissions: Record<string, number> = {}
    if (vendorIds.length > 0) {
      const { data: vendors } = await supabaseAdmin
        .from('vendors')
        .select('id, commission_rate, stripe_account_id')
        .in('id', vendorIds)

      vendors?.forEach(v => {
        vendorCommissions[v.id] = v.commission_rate || 12.5
      })
    }

    // Calculate totals using DB prices (never trust client prices)
    const subtotal = enrichedItems.reduce((sum, item) => {
      const dbProduct = productMap.get(item.productId)!
      return sum + dbProduct.price_pence * item.quantity
    }, 0)
    const total = subtotal + deliveryFee

    // Calculate vendor amounts for metadata (using DB prices, not client prices)
    const vendorBreakdown: Record<string, { amount: number; commission: number; net: number }> = {}
    enrichedItems.forEach(item => {
      const dbProduct = productMap.get(item.productId)!
      const itemTotal = dbProduct.price_pence * item.quantity
      const vendorId = item.vendorId || 'platform'
      const commissionRate = item.vendorId ? (vendorCommissions[item.vendorId] || 12.5) : 0
      const commission = Math.round(itemTotal * (commissionRate / 100))
      const net = itemTotal - commission

      if (!vendorBreakdown[vendorId]) {
        vendorBreakdown[vendorId] = { amount: 0, commission: 0, net: 0 }
      }
      vendorBreakdown[vendorId].amount += itemTotal
      vendorBreakdown[vendorId].commission += commission
      vendorBreakdown[vendorId].net += net
    })

    // Create order number
    const orderNumber = generateOrderNumber()

    // Recalculate subtotal using validated item prices (includes offer discounts)
    const validatedSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const validatedTotal = validatedSubtotal + deliveryFee

    // Create line items for Stripe using validated prices
    const lineItems = items.map((item) => {
      const dbProduct = productMap.get(item.productId)!
      return {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: item.name || dbProduct.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: item.price, // Validated price (DB price or verified offer price)
        },
        quantity: item.quantity,
      }
    })

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
        items: safeJsonMetadata(enrichedItems.map(i => ({
          productId: i.productId,
          name: i.name.slice(0, 20),
          price: i.price,
          quantity: i.quantity,
          vendorId: i.vendorId || undefined,
        }))),
        vendorBreakdown: safeJsonMetadata(vendorBreakdown),
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
