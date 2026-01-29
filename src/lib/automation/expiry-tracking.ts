// Expiry Date Tracking & Auto-Discount System
// Automatically discounts products nearing expiry to reduce waste

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send-email'

interface ExpiringProduct {
  id: string
  name: string
  slug: string
  image_url: string | null
  price_pence: number
  expiry_date: string
  stock_quantity: number
  days_until_expiry: number
  suggested_discount: number
  vendor_id?: string
}

// Discount tiers based on days until expiry
const EXPIRY_DISCOUNT_TIERS = [
  { maxDays: 1, discount: 75 },   // Expires tomorrow: 75% off
  { maxDays: 3, discount: 50 },   // Expires in 3 days: 50% off
  { maxDays: 7, discount: 30 },   // Expires in 7 days: 30% off
  { maxDays: 14, discount: 20 },  // Expires in 14 days: 20% off
  { maxDays: 30, discount: 10 },  // Expires in 30 days: 10% off
]

/**
 * Calculate suggested discount based on days until expiry
 */
function calculateDiscount(daysUntilExpiry: number): number {
  for (const tier of EXPIRY_DISCOUNT_TIERS) {
    if (daysUntilExpiry <= tier.maxDays) {
      return tier.discount
    }
  }
  return 0
}

/**
 * Get products nearing expiry
 */
export async function getExpiringProducts(
  maxDays: number = 30
): Promise<ExpiringProduct[]> {
  const supabase = getSupabaseAdmin()

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + maxDays)

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, image_url, price_pence, expiry_date, stock_quantity, vendor_id')
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .not('expiry_date', 'is', null)
    .lte('expiry_date', futureDate.toISOString())
    .gte('expiry_date', new Date().toISOString())
    .order('expiry_date', { ascending: true })

  if (error || !products) return []

  const now = new Date()

  return products.map(product => {
    const expiryDate = new Date(product.expiry_date)
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      ...product,
      days_until_expiry: daysUntilExpiry,
      suggested_discount: calculateDiscount(daysUntilExpiry)
    }
  })
}

/**
 * Apply automatic discounts to expiring products
 */
export async function applyExpiryDiscounts(
  autoApply: boolean = false
): Promise<{
  processed: number
  discounted: number
  errors: string[]
}> {
  const supabase = getSupabaseAdmin()
  const errors: string[] = []
  let processed = 0
  let discounted = 0

  try {
    const expiringProducts = await getExpiringProducts(14) // Products expiring within 14 days

    for (const product of expiringProducts) {
      processed++

      if (product.suggested_discount === 0) continue

      // Check if already has an expiry discount applied
      const { data: existingDiscount } = await supabase
        .from('product_discounts')
        .select('id, discount_percent')
        .eq('product_id', product.id)
        .eq('discount_type', 'expiry')
        .eq('is_active', true)
        .single()

      // If existing discount is already >= suggested, skip
      if (existingDiscount && existingDiscount.discount_percent >= product.suggested_discount) {
        continue
      }

      if (autoApply) {
        try {
          // Calculate discounted price
          const discountedPrice = Math.round(
            product.price_pence * (1 - product.suggested_discount / 100)
          )

          // Update or insert discount
          if (existingDiscount) {
            await supabase
              .from('product_discounts')
              .update({
                discount_percent: product.suggested_discount,
                discounted_price_pence: discountedPrice,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingDiscount.id)
          } else {
            // Try to insert into product_discounts, fallback to updating product price
            const { error: discountError } = await supabase.from('product_discounts').insert({
              product_id: product.id,
              discount_type: 'expiry',
              discount_percent: product.suggested_discount,
              discounted_price_pence: discountedPrice,
              reason: `Expiring in ${product.days_until_expiry} days`,
              expires_at: product.expiry_date,
              is_active: true
            })

            if (discountError) {
              // If product_discounts table doesn't exist, update compare_at_price
              await supabase
                .from('products')
                .update({
                  compare_at_price_pence: product.price_pence,
                  price_pence: discountedPrice,
                  updated_at: new Date().toISOString()
                })
                .eq('id', product.id)
            }
          }

          // Log the discount application (ignore errors)
          try {
            await supabase.from('audit_logs').insert({
              action: 'auto_expiry_discount',
              entity_type: 'products',
              entity_id: product.id,
              new_values: {
                discount_percent: product.suggested_discount,
                days_until_expiry: product.days_until_expiry,
                original_price: product.price_pence,
                discounted_price: discountedPrice
              }
            })
          } catch {
            // Ignore audit log errors
          }

          discounted++
        } catch (err) {
          errors.push(`Failed to apply discount to ${product.name}: ${err instanceof Error ? err.message : 'Unknown'}`)
        }
      }
    }

    return { processed, discounted, errors }
  } catch (error) {
    return {
      processed,
      discounted,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Generate expiry alert email for vendors/admins
 */
function generateExpiryAlertEmailHtml(products: ExpiringProduct[]): string {
  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  const productsHtml = products.map(product => {
    const urgencyColor = product.days_until_expiry <= 3 ? '#dc2626' :
                         product.days_until_expiry <= 7 ? '#f59e0b' : '#059669'

    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <p style="margin: 0 0 4px; font-weight: 600; color: #1e293b;">${product.name}</p>
          <p style="margin: 0; font-size: 14px; color: #64748b;">Stock: ${product.stock_quantity} units</p>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="background-color: ${urgencyColor}20; color: ${urgencyColor}; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
            ${product.days_until_expiry} day${product.days_until_expiry !== 1 ? 's' : ''}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="font-weight: 600; color: #059669;">${product.suggested_discount}% off</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          ${formatPrice(product.price_pence)}
        </td>
      </tr>
    `
  }).join('')

  const criticalCount = products.filter(p => p.days_until_expiry <= 3).length

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Expiry Alert</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 32px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px;">⚠️ Expiry Alert</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 32px;">
                  ${criticalCount > 0 ? `
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #991b1b; font-weight: 600;">
                      ⚠️ ${criticalCount} product${criticalCount > 1 ? 's' : ''} expiring within 3 days!
                    </p>
                  </div>
                  ` : ''}

                  <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">
                    The following ${products.length} products are approaching their expiry dates and may need discounting or removal:
                  </p>

                  <!-- Products Table -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <tr style="background-color: #f8fafc;">
                      <td style="padding: 12px; font-weight: 600; color: #64748b; font-size: 14px;">Product</td>
                      <td style="padding: 12px; font-weight: 600; color: #64748b; font-size: 14px; text-align: center;">Expires In</td>
                      <td style="padding: 12px; font-weight: 600; color: #64748b; font-size: 14px; text-align: center;">Suggested</td>
                      <td style="padding: 12px; font-weight: 600; color: #64748b; font-size: 14px; text-align: right;">Price</td>
                    </tr>
                    ${productsHtml}
                  </table>

                  <!-- CTA Button -->
                  <div style="text-align: center;">
                    <a href="https://ukgrocerystore.com/admin/products?filter=expiring"
                       style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Manage Expiring Products
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;">
                    Automatic expiry discounts are ${true ? 'enabled' : 'disabled'}
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
 * Send expiry alerts to admins and vendors
 */
export async function sendExpiryAlerts(): Promise<{
  sent: number
  errors: string[]
}> {
  const supabase = getSupabaseAdmin()
  const errors: string[] = []
  let sent = 0

  try {
    const expiringProducts = await getExpiringProducts(14)

    if (expiringProducts.length === 0) {
      return { sent: 0, errors: [] }
    }

    // Group by vendor
    const vendorProducts = new Map<string | null, ExpiringProduct[]>()

    for (const product of expiringProducts) {
      const vendorId = product.vendor_id || null

      if (!vendorProducts.has(vendorId)) {
        vendorProducts.set(vendorId, [])
      }
      vendorProducts.get(vendorId)!.push(product)
    }

    // Send to admins (all products)
    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .in('role', ['admin', 'super_admin'])
      .not('email', 'is', null)

    if (admins && admins.length > 0) {
      const adminEmails = admins.map(a => a.email).filter(Boolean) as string[]
      const html = generateExpiryAlertEmailHtml(expiringProducts)

      const result = await sendEmail({
        to: adminEmails,
        subject: `⚠️ Expiry Alert: ${expiringProducts.length} products expiring soon`,
        html
      })

      if (result.success) sent++
      else errors.push(`Failed to send admin alert: ${result.error}`)
    }

    // Send to vendors (their products only)
    for (const [vendorId, products] of vendorProducts) {
      if (!vendorId) continue

      const { data: vendor } = await supabase
        .from('vendors')
        .select('contact_email, business_name')
        .eq('id', vendorId)
        .single()

      if (!vendor?.contact_email) continue

      const html = generateExpiryAlertEmailHtml(products)

      const result = await sendEmail({
        to: vendor.contact_email,
        subject: `⚠️ Expiry Alert: ${products.length} of your products expiring soon`,
        html
      })

      if (result.success) sent++
      else errors.push(`Failed to send to vendor ${vendor.business_name}: ${result.error}`)
    }

    return { sent, errors }
  } catch (error) {
    return {
      sent,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Remove expired products from active listings
 */
export async function removeExpiredProducts(): Promise<{
  removed: number
  errors: string[]
}> {
  const supabase = getSupabaseAdmin()
  const errors: string[] = []

  try {
    const now = new Date().toISOString()

    // Find expired products
    const { data: expired } = await supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .lt('expiry_date', now)

    if (!expired || expired.length === 0) {
      return { removed: 0, errors: [] }
    }

    // Deactivate expired products
    const { error } = await supabase
      .from('products')
      .update({
        is_active: false,
        updated_at: now,
        deactivation_reason: 'expired'
      })
      .lt('expiry_date', now)
      .eq('is_active', true)

    if (error) {
      return { removed: 0, errors: [error.message] }
    }

    // Log the removal (ignore errors)
    for (const product of expired) {
      try {
        await supabase.from('audit_logs').insert({
          action: 'auto_expire_product',
          entity_type: 'products',
          entity_id: product.id,
          new_values: { deactivated: true, reason: 'expired' }
        })
      } catch {
        // Ignore audit log errors
      }
    }

    return { removed: expired.length, errors: [] }
  } catch (error) {
    return {
      removed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}
