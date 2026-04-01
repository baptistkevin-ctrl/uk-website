// Abandoned Cart Recovery Automation
// Automatically sends reminder emails to recover abandoned carts

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send-email'

interface AbandonedCart {
  id: string
  user_id: string | null
  guest_email: string | null
  cart_items: Array<{
    product_id: string
    name: string
    price_pence: number
    quantity: number
    image_url?: string
  }>
  cart_total_pence: number
  recovery_status: string
  reminder_count: number
  abandoned_at: string
  user?: {
    email: string
    full_name: string
  }
}

interface RecoverySettings {
  is_enabled: boolean
  reminder_1_delay_hours: number
  reminder_2_delay_hours: number
  reminder_3_delay_hours: number
  final_offer_delay_hours: number
  final_offer_discount_percent: number
  min_cart_value_pence: number
}

const DEFAULT_SETTINGS: RecoverySettings = {
  is_enabled: true,
  reminder_1_delay_hours: 1,
  reminder_2_delay_hours: 24,
  reminder_3_delay_hours: 72,
  final_offer_delay_hours: 168,
  final_offer_discount_percent: 10,
  min_cart_value_pence: 1000
}

/**
 * Get cart recovery settings from database
 */
async function getRecoverySettings(): Promise<RecoverySettings> {
  const supabase = getSupabaseAdmin()

  const { data } = await supabase
    .from('cart_recovery_settings')
    .select('setting_key, setting_value')

  if (!data || data.length === 0) return DEFAULT_SETTINGS

  const settings = { ...DEFAULT_SETTINGS }
  for (const row of data) {
    const key = row.setting_key as keyof RecoverySettings
    if (key in settings) {
      const value = row.setting_value
      if (typeof value === 'string') {
        if (value === 'true') (settings as Record<string, unknown>)[key] = true
        else if (value === 'false') (settings as Record<string, unknown>)[key] = false
        else if (!isNaN(Number(value))) (settings as Record<string, unknown>)[key] = Number(value)
        else (settings as Record<string, unknown>)[key] = value
      } else {
        (settings as Record<string, unknown>)[key] = value
      }
    }
  }

  return settings
}

/**
 * Generate abandoned cart email HTML
 */
function generateCartEmailHtml(
  cart: AbandonedCart,
  reminderType: 'reminder_1' | 'reminder_2' | 'reminder_3' | 'final_offer',
  discountCode?: string,
  discountPercent?: number
): string {
  const customerName = cart.user?.full_name || 'Valued Customer'
  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

  const subjects = {
    reminder_1: 'Did you forget something?',
    reminder_2: 'Your cart is waiting for you!',
    reminder_3: 'Last chance to complete your order',
    final_offer: `${discountPercent}% OFF - Complete your order now!`
  }

  const messages = {
    reminder_1: 'We noticed you left some items in your cart. They\'re still waiting for you!',
    reminder_2: 'Your cart misses you! Complete your order before your items sell out.',
    reminder_3: 'This is your final reminder - your cart items may not be available much longer.',
    final_offer: `As a special offer, use code <strong>${discountCode}</strong> for ${discountPercent}% off your order!`
  }

  const itemsHtml = cart.cart_items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; align-items: center;">
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" width="60" height="60" style="border-radius: 8px; margin-right: 12px;">` : ''}
          <div>
            <p style="margin: 0; font-weight: 600; color: #1e293b;">${item.name}</p>
            <p style="margin: 4px 0 0; color: #64748b;">Qty: ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">
        ${formatPrice(item.price_pence * item.quantity)}
      </td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${subjects[reminderType]}</title>
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
                  <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px;">${subjects[reminderType]}</h2>
                  <p style="margin: 0 0 24px; color: #475569; line-height: 1.6;">
                    Hi ${customerName},<br><br>
                    ${messages[reminderType]}
                  </p>

                  ${discountCode ? `
                  <div style="background-color: #fef3c7; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #92400e;">Use code at checkout:</p>
                    <p style="margin: 0; font-size: 28px; font-weight: 700; color: #92400e; letter-spacing: 2px;">${discountCode}</p>
                    <p style="margin: 8px 0 0; font-size: 14px; color: #92400e;">for ${discountPercent}% off!</p>
                  </div>
                  ` : ''}

                  <!-- Cart Items -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 12px; background-color: #f8fafc; font-weight: 600; color: #64748b;">Items in your cart</td>
                      <td style="padding: 12px; background-color: #f8fafc; text-align: right; font-weight: 600; color: #64748b;">Price</td>
                    </tr>
                    ${itemsHtml}
                    <tr>
                      <td style="padding: 16px 12px; font-weight: 700; font-size: 18px; color: #1e293b;">Total</td>
                      <td style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 18px; color: #059669;">${formatPrice(cart.cart_total_pence)}</td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <div style="text-align: center;">
                    <a href="https://ukgrocerystore.com/cart?recover=${cart.id}"
                       style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Complete Your Order
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;">
                    <a href="https://ukgrocerystore.com/unsubscribe?cart=${cart.id}" style="color: #059669;">Unsubscribe</a> from cart reminders
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
 * Generate a unique discount code for final offer
 */
function generateDiscountCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const randomBytes = new Uint8Array(6)
  crypto.getRandomValues(randomBytes)
  let code = 'CART-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomBytes[i] % chars.length)
  }
  return code
}

/**
 * Process abandoned carts and send recovery emails
 */
export async function processAbandonedCarts(): Promise<{
  processed: number
  sent: number
  errors: string[]
}> {
  const supabase = getSupabaseAdmin()
  const settings = await getRecoverySettings()

  if (!settings.is_enabled) {
    return { processed: 0, sent: 0, errors: ['Cart recovery is disabled'] }
  }

  const errors: string[] = []
  let processed = 0
  let sent = 0

  try {
    // Get abandoned carts that need reminders
    const { data: carts, error: fetchError } = await supabase
      .from('abandoned_carts')
      .select(`
        *,
        user:profiles(email, full_name)
      `)
      .eq('recovery_status', 'abandoned')
      .lt('reminder_count', 4)
      .gte('cart_total_pence', settings.min_cart_value_pence)
      .order('abandoned_at', { ascending: true })
      .limit(50)

    if (fetchError) {
      return { processed: 0, sent: 0, errors: [fetchError.message] }
    }

    if (!carts || carts.length === 0) {
      return { processed: 0, sent: 0, errors: [] }
    }

    const now = new Date()

    for (const cart of carts as unknown as AbandonedCart[]) {
      processed++

      const email = cart.user?.email || cart.guest_email
      if (!email) continue

      const abandonedAt = new Date(cart.abandoned_at)
      const hoursSinceAbandoned = (now.getTime() - abandonedAt.getTime()) / (1000 * 60 * 60)

      let reminderType: 'reminder_1' | 'reminder_2' | 'reminder_3' | 'final_offer' | null = null
      let discountCode: string | undefined
      let discountPercent: number | undefined

      // Determine which reminder to send based on time and count
      if (cart.reminder_count === 0 && hoursSinceAbandoned >= settings.reminder_1_delay_hours) {
        reminderType = 'reminder_1'
      } else if (cart.reminder_count === 1 && hoursSinceAbandoned >= settings.reminder_2_delay_hours) {
        reminderType = 'reminder_2'
      } else if (cart.reminder_count === 2 && hoursSinceAbandoned >= settings.reminder_3_delay_hours) {
        reminderType = 'reminder_3'
      } else if (cart.reminder_count === 3 && hoursSinceAbandoned >= settings.final_offer_delay_hours) {
        reminderType = 'final_offer'
        discountCode = generateDiscountCode()
        discountPercent = settings.final_offer_discount_percent
      }

      if (!reminderType) continue

      try {
        // Generate and send email
        const html = generateCartEmailHtml(cart, reminderType, discountCode, discountPercent)
        const subjects = {
          reminder_1: 'Did you forget something? 🛒',
          reminder_2: 'Your cart is waiting for you!',
          reminder_3: 'Last chance to complete your order',
          final_offer: `🎁 ${discountPercent}% OFF - Complete your order now!`
        }

        const result = await sendEmail({
          to: email,
          subject: subjects[reminderType],
          html
        })

        if (result.success) {
          // Log the email
          await supabase.from('cart_recovery_emails').insert({
            abandoned_cart_id: cart.id,
            email_type: reminderType,
            subject: subjects[reminderType],
            discount_code: discountCode,
            discount_percent: discountPercent
          })

          // Update cart reminder count
          await supabase
            .from('abandoned_carts')
            .update({
              reminder_count: cart.reminder_count + 1,
              last_reminder_at: now.toISOString(),
              recovery_status: reminderType === 'final_offer' ? 'reminded' : 'abandoned',
              updated_at: now.toISOString()
            })
            .eq('id', cart.id)

          // If discount code was generated, create it in discounts table
          if (discountCode && discountPercent) {
            // Try to create discount code, ignore if discounts table doesn't exist
            try {
              await supabase.from('discounts').insert({
                code: discountCode,
                type: 'percentage',
                value: discountPercent,
                min_order_pence: settings.min_cart_value_pence,
                max_uses: 1,
                current_uses: 0,
                is_active: true,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                metadata: { source: 'cart_recovery', cart_id: cart.id }
              })
            } catch {
              // Ignore if discounts table doesn't exist
            }
          }

          sent++
        } else {
          errors.push(`Failed to send email to ${email}: ${result.error}`)
        }
      } catch (err) {
        errors.push(`Error processing cart ${cart.id}: ${err instanceof Error ? err.message : 'Unknown'}`)
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
 * Mark cart as recovered when order is placed
 */
export async function markCartAsRecovered(cartId: string, orderId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  await supabase
    .from('abandoned_carts')
    .update({
      recovery_status: 'recovered',
      recovered_order_id: orderId,
      updated_at: new Date().toISOString()
    })
    .eq('id', cartId)
}

/**
 * Create abandoned cart record
 */
export async function createAbandonedCart(
  userId: string | null,
  sessionId: string | null,
  guestEmail: string | null,
  items: AbandonedCart['cart_items'],
  totalPence: number
): Promise<string | null> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('abandoned_carts')
    .insert({
      user_id: userId,
      session_id: sessionId,
      guest_email: guestEmail,
      cart_items: items,
      cart_total_pence: totalPence,
      recovery_status: 'abandoned',
      abandoned_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create abandoned cart:', error)
    return null
  }

  return data.id
}
