// Reorder Reminder Automation
// Automatically sends reminders for consumable products based on purchase frequency

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send-email'

interface ReorderProduct {
  product_id: string
  product_name: string
  product_slug: string
  product_image: string | null
  price_pence: number
  last_ordered_at: string
  average_days_between_orders: number
  times_ordered: number
}

interface UserReorderData {
  user_id: string
  email: string
  full_name: string
  products: ReorderProduct[]
}

// Product categories that are typically consumable (need reordering)
const CONSUMABLE_CATEGORIES = [
  'dairy',
  'bread',
  'eggs',
  'milk',
  'fruits',
  'vegetables',
  'beverages',
  'snacks',
  'cleaning',
  'toiletries',
  'baby',
  'pet-food'
]

/**
 * Calculate average days between orders for a product by user
 */
async function calculateReorderPatterns(): Promise<Map<string, UserReorderData>> {
  const supabase = getSupabaseAdmin()
  const userProducts = new Map<string, UserReorderData>()

  // Get order history with product details for the last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      user_id,
      created_at,
      profiles:user_id (
        email,
        full_name
      ),
      order_items (
        product_id,
        quantity,
        products (
          id,
          name,
          slug,
          image_url,
          price_pence,
          categories (slug)
        )
      )
    `)
    .eq('status', 'delivered')
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: true })

  if (error || !orders) return userProducts

  // Build purchase history per user per product
  const purchaseHistory = new Map<string, Map<string, Date[]>>()

  for (const order of orders) {
    if (!order.user_id || !order.profiles) continue

    const userId = order.user_id
    const profiles = order.profiles as { email: string; full_name: string }[] | { email: string; full_name: string } | null
    const profile = Array.isArray(profiles) ? profiles[0] : profiles
    if (!profile?.email) continue

    if (!purchaseHistory.has(userId)) {
      purchaseHistory.set(userId, new Map())
      userProducts.set(userId, {
        user_id: userId,
        email: profile.email,
        full_name: profile.full_name,
        products: []
      })
    }

    const userHistory = purchaseHistory.get(userId)!

    for (const item of order.order_items || []) {
      type ProductType = {
        id: string
        name: string
        slug: string
        image_url: string | null
        price_pence: number
        categories: { slug: string } | null
      }
      const productData = item.products as ProductType[] | ProductType | null
      const product = Array.isArray(productData) ? productData[0] : productData

      if (!product) continue

      // Check if product is consumable
      const categorySlug = product.categories?.slug || ''
      const isConsumable = CONSUMABLE_CATEGORIES.some(c =>
        categorySlug.toLowerCase().includes(c)
      )

      if (!isConsumable) continue

      if (!userHistory.has(product.id)) {
        userHistory.set(product.id, [])
      }
      userHistory.get(product.id)!.push(new Date(order.created_at))
    }
  }

  // Calculate average reorder intervals
  const now = new Date()

  for (const [userId, productHistory] of purchaseHistory) {
    const userData = userProducts.get(userId)!
    const productsToReorder: ReorderProduct[] = []

    for (const [productId, dates] of productHistory) {
      if (dates.length < 2) continue // Need at least 2 purchases to calculate interval

      // Calculate average days between orders
      let totalDays = 0
      for (let i = 1; i < dates.length; i++) {
        totalDays += (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
      }
      const avgDays = Math.round(totalDays / (dates.length - 1))

      // Get last order date
      const lastOrderDate = dates[dates.length - 1]
      const daysSinceLastOrder = Math.round(
        (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // If it's been close to or past the average reorder time, suggest reorder
      if (daysSinceLastOrder >= avgDays * 0.9) {
        // Get product details
        const { data: product } = await supabase
          .from('products')
          .select('id, name, slug, image_url, price_pence')
          .eq('id', productId)
          .eq('is_active', true)
          .gt('stock_quantity', 0)
          .single()

        if (product) {
          productsToReorder.push({
            product_id: product.id,
            product_name: product.name,
            product_slug: product.slug,
            product_image: product.image_url,
            price_pence: product.price_pence,
            last_ordered_at: lastOrderDate.toISOString(),
            average_days_between_orders: avgDays,
            times_ordered: dates.length
          })
        }
      }
    }

    if (productsToReorder.length > 0) {
      userData.products = productsToReorder
    } else {
      userProducts.delete(userId)
    }
  }

  return userProducts
}

/**
 * Generate reorder reminder email HTML
 */
function generateReorderEmailHtml(userData: UserReorderData): string {
  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  const productsHtml = userData.products.slice(0, 6).map(product => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="80">
              ${product.product_image
                ? `<img src="${product.product_image}" alt="${product.product_name}" width="64" height="64" style="border-radius: 8px; object-fit: cover;">`
                : '<div style="width: 64px; height: 64px; background: #e2e8f0; border-radius: 8px;"></div>'
              }
            </td>
            <td style="padding-left: 16px;">
              <p style="margin: 0 0 4px; font-weight: 600; color: #1e293b;">${product.product_name}</p>
              <p style="margin: 0 0 4px; font-size: 14px; color: #64748b;">
                You typically reorder every ${product.average_days_between_orders} days
              </p>
              <p style="margin: 0; font-weight: 600; color: #059669;">${formatPrice(product.price_pence)}</p>
            </td>
            <td width="120" style="text-align: right;">
              <a href="https://ukgrocerystore.com/products/${product.product_slug}?add_to_cart=1"
                 style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">
                Add to Cart
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
      <title>Time to Restock?</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px;">UK Grocery Store</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 48px;">🔄</span>
                    <h2 style="margin: 16px 0 8px; color: #1e293b; font-size: 24px;">Time to Restock?</h2>
                    <p style="margin: 0; color: #64748b; font-size: 16px;">
                      Hi ${userData.full_name}, based on your shopping habits, you might need these items soon!
                    </p>
                  </div>

                  <!-- Products -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    ${productsHtml}
                  </table>

                  <!-- CTA Button -->
                  <div style="text-align: center;">
                    <a href="https://ukgrocerystore.com/reorder?user=${userData.user_id}"
                       style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Quick Reorder All Items
                    </a>
                  </div>

                  <p style="margin: 24px 0 0; text-align: center; color: #94a3b8; font-size: 14px;">
                    We personalized these suggestions based on your order history.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;">
                    <a href="https://ukgrocerystore.com/account/notifications" style="color: #059669;">Manage notification preferences</a>
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
 * Process and send reorder reminders
 */
export async function processReorderReminders(): Promise<{
  processed: number
  sent: number
  errors: string[]
}> {
  const supabase = getSupabaseAdmin()
  const errors: string[] = []
  let processed = 0
  let sent = 0

  try {
    // Check if we already sent reminders today (limit to once per day)
    const today = new Date().toISOString().split('T')[0]
    const { data: recentReminders } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', 'reorder_reminder')
      .gte('created_at', `${today}T00:00:00Z`)
      .limit(1)

    // If already sent today, skip
    if (recentReminders && recentReminders.length > 0) {
      return { processed: 0, sent: 0, errors: ['Reorder reminders already sent today'] }
    }

    // Calculate which users need reorder reminders
    const userProducts = await calculateReorderPatterns()
    processed = userProducts.size

    for (const [userId, userData] of userProducts) {
      if (userData.products.length === 0) continue

      // Check user notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('reorder_reminders')
        .eq('user_id', userId)
        .single()

      // Skip if user has disabled reorder reminders
      if (prefs && prefs.reorder_reminders === false) continue

      try {
        const html = generateReorderEmailHtml(userData)

        const result = await sendEmail({
          to: userData.email,
          subject: `🔄 Time to restock? ${userData.products.length} items you might need`,
          html
        })

        if (result.success) {
          // Log notification
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'reorder_reminder',
            title: 'Reorder Reminder',
            message: `${userData.products.length} products suggested for reorder`,
            metadata: {
              products: userData.products.map(p => p.product_id),
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
 * Get reorder suggestions for a specific user (for API/frontend)
 */
export async function getReorderSuggestions(userId: string): Promise<ReorderProduct[]> {
  const userProducts = await calculateReorderPatterns()
  const userData = userProducts.get(userId)
  return userData?.products || []
}
