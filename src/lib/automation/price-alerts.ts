// Price Drop Alert Automation
// Notifies users when products they've viewed or wishlisted drop in price

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send-email'

interface PriceAlert {
  id: string
  user_id: string
  product_id: string
  target_price_pence: number | null
  created_at: string
}

interface ProductWithPrice {
  id: string
  name: string
  slug: string
  image_url: string | null
  price_pence: number
  compare_at_price_pence?: number | null
  old_price_pence?: number
}

interface UserPriceAlertData {
  user_id: string
  email: string
  full_name: string
  products: Array<{
    product: ProductWithPrice
    old_price: number
    new_price: number
    savings_percent: number
  }>
}

/**
 * Track product price changes
 */
export async function trackPriceChanges(): Promise<{
  tracked: number
  priceDrops: number
}> {
  const supabase = getSupabaseAdmin()

  // Get all active products with their current prices
  const { data: products, error } = await supabase
    .from('products')
    .select('id, price_pence')
    .eq('is_active', true)

  if (error || !products) {
    return { tracked: 0, priceDrops: 0 }
  }

  let priceDrops = 0

  // Check each product against price history
  for (const product of products) {
    // Get the last recorded price
    const { data: lastPrice } = await supabase
      .from('price_history')
      .select('price_pence')
      .eq('product_id', product.id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()

    // If price has changed, record it
    if (!lastPrice || lastPrice.price_pence !== product.price_pence) {
      await supabase.from('price_history').insert({
        product_id: product.id,
        price_pence: product.price_pence,
        recorded_at: new Date().toISOString()
      }) // Ignore errors

      // If price dropped, count it
      if (lastPrice && lastPrice.price_pence > product.price_pence) {
        priceDrops++
      }
    }
  }

  return { tracked: products.length, priceDrops }
}

/**
 * Generate price drop alert email HTML
 */
function generatePriceDropEmailHtml(userData: UserPriceAlertData): string {
  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  const productsHtml = userData.products.map(item => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="80">
              ${item.product.image_url
                ? `<img src="${item.product.image_url}" alt="${item.product.name}" width="64" height="64" style="border-radius: 8px; object-fit: cover;">`
                : '<div style="width: 64px; height: 64px; background: #e2e8f0; border-radius: 8px;"></div>'
              }
            </td>
            <td style="padding-left: 16px;">
              <p style="margin: 0 0 4px; font-weight: 600; color: #1e293b;">${item.product.name}</p>
              <p style="margin: 0;">
                <span style="text-decoration: line-through; color: #94a3b8; font-size: 14px;">${formatPrice(item.old_price)}</span>
                <span style="color: #dc2626; font-weight: 700; font-size: 18px; margin-left: 8px;">${formatPrice(item.new_price)}</span>
              </p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #059669; font-weight: 600;">
                Save ${item.savings_percent}%
              </p>
            </td>
            <td width="100" style="text-align: right;">
              <a href="https://ukgrocerystore.com/products/${item.product.slug}"
                 style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">
                Buy Now
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Price Drop Alert!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 32px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px;">🔔 Price Drop Alert!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px;">
                  <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                    Great news, ${userData.full_name}! Products you've been watching just dropped in price.
                    Don't miss out on these savings!
                  </p>

                  <!-- Products -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    ${productsHtml}
                  </table>

                  <!-- CTA Button -->
                  <div style="text-align: center;">
                    <a href="https://ukgrocerystore.com/deals"
                       style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      View All Deals
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;">
                    <a href="https://ukgrocerystore.com/account/price-alerts" style="color: #059669;">Manage price alerts</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Process price drop alerts and notify users
 */
export async function processPriceDropAlerts(): Promise<{
  processed: number
  sent: number
  errors: string[]
}> {
  const supabase = getSupabaseAdmin()
  const errors: string[] = []
  let processed = 0
  let sent = 0

  try {
    // Get products that had price drops in the last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // Find products where current price is less than yesterday's price
    const { data: priceDrops } = await supabase
      .from('price_history')
      .select('product_id, price_pence, recorded_at')
      .gte('recorded_at', yesterday.toISOString())
      .order('recorded_at', { ascending: false })

    if (!priceDrops || priceDrops.length === 0) {
      return { processed: 0, sent: 0, errors: [] }
    }

    // Get unique products with price drops
    const productPrices = new Map<string, { old: number; new: number }>()

    for (const record of priceDrops) {
      if (!productPrices.has(record.product_id)) {
        // First record (newest) is the new price
        productPrices.set(record.product_id, { old: 0, new: record.price_pence })
      } else {
        // Subsequent records are older prices
        const current = productPrices.get(record.product_id)!
        if (record.price_pence > current.new && current.old === 0) {
          current.old = record.price_pence
        }
      }
    }

    // Filter to only actual price drops
    const actualDrops = Array.from(productPrices.entries())
      .filter(([_, prices]) => prices.old > prices.new)
      .map(([productId, prices]) => ({ productId, ...prices }))

    if (actualDrops.length === 0) {
      return { processed: 0, sent: 0, errors: [] }
    }

    // Get users watching these products (from wishlists or price alerts)
    const productIds = actualDrops.map(d => d.productId)

    const { data: watchingUsers } = await supabase
      .from('wishlists')
      .select(`
        user_id,
        product_id,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .in('product_id', productIds)

    if (!watchingUsers || watchingUsers.length === 0) {
      return { processed: 0, sent: 0, errors: [] }
    }

    // Get product details
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, image_url, price_pence')
      .in('id', productIds)
      .eq('is_active', true)

    const productMap = new Map(products?.map(p => [p.id, p]) || [])

    // Group by user
    const userAlerts = new Map<string, UserPriceAlertData>()

    for (const watch of watchingUsers) {
      const profiles = watch.profiles as { email: string; full_name: string }[] | { email: string; full_name: string } | null
      const profile = Array.isArray(profiles) ? profiles[0] : profiles
      if (!profile?.email) continue

      const product = productMap.get(watch.product_id)
      const priceDrop = actualDrops.find(d => d.productId === watch.product_id)
      if (!product || !priceDrop) continue

      if (!userAlerts.has(watch.user_id)) {
        userAlerts.set(watch.user_id, {
          user_id: watch.user_id,
          email: profile.email,
          full_name: profile.full_name,
          products: []
        })
      }

      const savingsPercent = Math.round(((priceDrop.old - priceDrop.new) / priceDrop.old) * 100)

      userAlerts.get(watch.user_id)!.products.push({
        product,
        old_price: priceDrop.old,
        new_price: priceDrop.new,
        savings_percent: savingsPercent
      })
    }

    processed = userAlerts.size

    // Send emails
    for (const [userId, userData] of userAlerts) {
      // Check notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('price_alerts')
        .eq('user_id', userId)
        .single()

      if (prefs && prefs.price_alerts === false) continue

      try {
        const html = generatePriceDropEmailHtml(userData)

        const result = await sendEmail({
          to: userData.email,
          subject: `🔔 Price Drop! ${userData.products.length} item${userData.products.length > 1 ? 's' : ''} you're watching`,
          html
        })

        if (result.success) {
          // Log notification
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'price_drop',
            title: 'Price Drop Alert',
            message: `${userData.products.length} products dropped in price`,
            metadata: {
              products: userData.products.map(p => ({
                id: p.product.id,
                old_price: p.old_price,
                new_price: p.new_price
              })),
              email_sent: true
            }
          }) // Ignore errors

          sent++
        } else {
          errors.push(`Failed to send to ${userData.email}: ${result.error}`)
        }
      } catch (err) {
        errors.push(`Error for user ${userId}: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }

    return { processed, sent, errors }
  } catch (error) {
    return {
      processed,
      sent,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Create a price alert for a user
 */
export async function createPriceAlert(
  userId: string,
  productId: string,
  targetPricePence?: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin()

  // Check if alert already exists
  const { data: existing } = await supabase
    .from('price_alerts')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()

  if (existing) {
    return { success: true } // Already exists
  }

  const { error } = await supabase.from('price_alerts').insert({
    user_id: userId,
    product_id: productId,
    target_price_pence: targetPricePence || null
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
