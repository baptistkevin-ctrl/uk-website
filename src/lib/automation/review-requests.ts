// Review Request Automation
// Automatically sends review requests after order delivery

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendReviewRequestEmail } from '@/lib/email/send-email'

interface DeliveredOrder {
  id: string
  order_number: string
  user_id: string
  delivered_at: string
  order_items: Array<{
    id: string
    product_id: string
    product_name: string
    products: {
      id: string
      name: string
      slug: string
      image_url: string | null
    }
  }>
  profiles: {
    email: string
    full_name: string
  }
}

interface ReviewRequestResult {
  processed: number
  sent: number
  skipped: number
  errors: string[]
}

// Days after delivery to send review request
const REVIEW_REQUEST_DELAY_DAYS = 3

// Maximum review requests per order (don't spam with too many)
const MAX_REVIEWS_PER_ORDER = 3

/**
 * Check if user has already reviewed a product
 */
async function hasUserReviewedProduct(userId: string, productId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  const { data } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .limit(1)
    .single()

  return !!data
}

/**
 * Check if review request was already sent for this order item
 */
async function wasReviewRequestSent(orderId: string, productId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()

  const { data } = await supabase
    .from('notifications')
    .select('id')
    .eq('type', 'review_request')
    .contains('metadata', { order_id: orderId, product_id: productId })
    .limit(1)
    .single()

  return !!data
}

/**
 * Process delivered orders and send review requests
 */
export async function processReviewRequests(): Promise<ReviewRequestResult> {
  const supabase = getSupabaseAdmin()
  const errors: string[] = []
  let processed = 0
  let sent = 0
  let skipped = 0

  try {
    // Calculate the date range for orders to request reviews
    const now = new Date()
    const minDeliveryDate = new Date(now)
    minDeliveryDate.setDate(minDeliveryDate.getDate() - REVIEW_REQUEST_DELAY_DAYS - 7) // Up to 7 days after the delay

    const maxDeliveryDate = new Date(now)
    maxDeliveryDate.setDate(maxDeliveryDate.getDate() - REVIEW_REQUEST_DELAY_DAYS)

    // Get delivered orders within the date range
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        delivered_at,
        order_items (
          id,
          product_id,
          product_name,
          products (
            id,
            name,
            slug,
            image_url
          )
        ),
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq('status', 'delivered')
      .gte('delivered_at', minDeliveryDate.toISOString())
      .lte('delivered_at', maxDeliveryDate.toISOString())
      .order('delivered_at', { ascending: true })
      .limit(100)

    if (fetchError) {
      return { processed: 0, sent: 0, skipped: 0, errors: [fetchError.message] }
    }

    if (!orders || orders.length === 0) {
      return { processed: 0, sent: 0, skipped: 0, errors: [] }
    }

    for (const order of orders as unknown as DeliveredOrder[]) {
      if (!order.profiles?.email || !order.order_items?.length) continue

      processed++

      // Check user notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('review_requests')
        .eq('user_id', order.user_id)
        .single()

      if (prefs && prefs.review_requests === false) {
        skipped++
        continue
      }

      // Get products that haven't been reviewed yet
      const productsToReview: typeof order.order_items = []

      for (const item of order.order_items) {
        if (!item.products) continue

        // Check if already reviewed
        const hasReviewed = await hasUserReviewedProduct(order.user_id, item.product_id)
        if (hasReviewed) continue

        // Check if request already sent
        const requestSent = await wasReviewRequestSent(order.id, item.product_id)
        if (requestSent) continue

        productsToReview.push(item)
      }

      // Limit to max reviews per order
      const itemsToRequest = productsToReview.slice(0, MAX_REVIEWS_PER_ORDER)

      for (const item of itemsToRequest) {
        try {
          const reviewUrl = `https://ukgrocerystore.com/products/${item.products.slug}?review=1&order=${order.order_number}`

          const result = await sendReviewRequestEmail(
            order.profiles.email,
            order.profiles.full_name,
            order.order_number,
            item.products.name,
            item.products.image_url,
            reviewUrl
          )

          if (result.success) {
            // Log notification
            await supabase.from('notifications').insert({
              user_id: order.user_id,
              type: 'review_request',
              title: 'Review Request',
              message: `Please review ${item.products.name}`,
              metadata: {
                order_id: order.id,
                order_number: order.order_number,
                product_id: item.product_id,
                product_name: item.products.name,
                email_sent: true
              }
            }) // Ignore errors

            sent++
          } else {
            errors.push(`Failed to send review request for order ${order.order_number}: ${result.error}`)
          }
        } catch (err) {
          errors.push(`Error for order ${order.order_number}: ${err instanceof Error ? err.message : 'Unknown'}`)
        }
      }
    }

    return { processed, sent, skipped, errors }
  } catch (error) {
    return {
      processed,
      sent,
      skipped,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Get pending review requests for a user (products they haven't reviewed yet)
 */
export async function getPendingReviewsForUser(userId: string): Promise<Array<{
  order_id: string
  order_number: string
  product_id: string
  product_name: string
  product_slug: string
  product_image: string | null
  delivered_at: string
}>> {
  const supabase = getSupabaseAdmin()

  // Get delivered orders from the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      delivered_at,
      order_items (
        product_id,
        product_name,
        products (
          id,
          name,
          slug,
          image_url
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'delivered')
    .gte('delivered_at', thirtyDaysAgo.toISOString())
    .order('delivered_at', { ascending: false })

  if (!orders) return []

  // Get user's existing reviews
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('product_id')
    .eq('user_id', userId)

  const reviewedProductIds = new Set(existingReviews?.map(r => r.product_id) || [])

  const pendingReviews: Array<{
    order_id: string
    order_number: string
    product_id: string
    product_name: string
    product_slug: string
    product_image: string | null
    delivered_at: string
  }> = []

  for (const order of orders) {
    for (const item of order.order_items || []) {
      type ProductType = {
        id: string
        name: string
        slug: string
        image_url: string | null
      }
      const productData = item.products as ProductType[] | ProductType | null
      const product = Array.isArray(productData) ? productData[0] : productData

      if (!product || reviewedProductIds.has(item.product_id)) continue

      pendingReviews.push({
        order_id: order.id,
        order_number: order.order_number,
        product_id: item.product_id,
        product_name: product.name,
        product_slug: product.slug,
        product_image: product.image_url,
        delivered_at: order.delivered_at
      })
    }
  }

  return pendingReviews
}
