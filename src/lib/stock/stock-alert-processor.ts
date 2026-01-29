// Stock Alert Processor
// Handles sending notifications for back-in-stock alerts and low stock admin alerts

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendBackInStockEmail, sendLowStockAlertEmail } from '@/lib/email/send-email'

interface ProcessResult {
  success: boolean
  processed: number
  errors: string[]
}

interface Product {
  id: string
  name: string
  slug: string
  image_url: string | null
  price_pence: number
  stock_quantity: number
  low_stock_threshold: number
}

interface StockAlert {
  id: string
  product_id: string
  email: string
  status: string
  product: Product
}

/**
 * Process pending back-in-stock notifications
 * Called when products are restocked - sends emails to users who subscribed to alerts
 */
export async function processBackInStockAlerts(): Promise<ProcessResult> {
  const supabaseAdmin = getSupabaseAdmin()
  const errors: string[] = []
  let processed = 0

  try {
    // Get all alerts marked as 'notified' (trigger marked them, we need to send emails)
    const { data: alerts, error: fetchError } = await supabaseAdmin
      .from('stock_alerts')
      .select(`
        id,
        product_id,
        email,
        status,
        product:products (
          id,
          name,
          slug,
          image_url,
          price_pence,
          stock_quantity
        )
      `)
      .eq('status', 'notified')
      .limit(100)

    if (fetchError) {
      return { success: false, processed: 0, errors: [fetchError.message] }
    }

    if (!alerts || alerts.length === 0) {
      return { success: true, processed: 0, errors: [] }
    }

    // Process each alert
    for (const alert of alerts as unknown as StockAlert[]) {
      try {
        // Verify product is still in stock
        if (!alert.product || alert.product.stock_quantity <= 0) {
          continue
        }

        // Send email
        const result = await sendBackInStockEmail(
          alert.email,
          alert.product.name,
          alert.product.image_url,
          alert.product.slug,
          alert.product.price_pence
        )

        if (result.success) {
          // Record in history and update alert status
          await supabaseAdmin.from('stock_alert_history').insert({
            stock_alert_id: alert.id,
            product_id: alert.product_id,
            email: alert.email,
            notification_type: 'email',
            sent_at: new Date().toISOString()
          })

          // Mark as processed (can be 'notified' meaning email sent, or remove/mark complete)
          await supabaseAdmin
            .from('stock_alerts')
            .update({
              status: 'notified',
              notified_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', alert.id)

          processed++
        } else {
          errors.push(`Failed to send email to ${alert.email}: ${result.error}`)
        }
      } catch (err) {
        errors.push(`Error processing alert ${alert.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return { success: true, processed, errors }
  } catch (error) {
    return {
      success: false,
      processed,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Check for products with low stock and send admin alerts
 * Should be called periodically (e.g., once daily)
 */
export async function checkLowStockAndAlert(): Promise<ProcessResult> {
  const supabaseAdmin = getSupabaseAdmin()
  const errors: string[] = []

  try {
    // Get products where stock is at or below the low_stock_threshold
    const { data: lowStockProducts, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, stock_quantity, low_stock_threshold')
      .filter('is_active', 'eq', true)
      .filter('stock_quantity', 'lte', supabaseAdmin.rpc('get_low_stock_threshold'))
      .order('stock_quantity', { ascending: true })
      .limit(50)

    // Fallback query if RPC doesn't exist - get products with stock <= 10 or below their threshold
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, stock_quantity, low_stock_threshold')
      .eq('is_active', true)
      .or('stock_quantity.lte.10,stock_quantity.lte.low_stock_threshold')
      .order('stock_quantity', { ascending: true })
      .limit(50)

    if (productsError) {
      return { success: false, processed: 0, errors: [productsError.message] }
    }

    // Filter to only products actually below their threshold
    const lowStock = (products || []).filter(p =>
      p.stock_quantity <= (p.low_stock_threshold || 10)
    )

    if (lowStock.length === 0) {
      return { success: true, processed: 0, errors: [] }
    }

    // Get admin emails from profiles with admin role
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .in('role', ['admin', 'super_admin'])
      .not('email', 'is', null)

    if (adminsError) {
      return { success: false, processed: 0, errors: [adminsError.message] }
    }

    if (!admins || admins.length === 0) {
      return { success: true, processed: 0, errors: ['No admin emails found'] }
    }

    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[]

    // Check if we already sent an alert today to avoid spam
    const today = new Date().toISOString().split('T')[0]
    const { data: recentAlert } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('type', 'low_stock_admin_alert')
      .gte('created_at', `${today}T00:00:00Z`)
      .single()

    if (recentAlert) {
      return { success: true, processed: 0, errors: ['Alert already sent today'] }
    }

    // Send low stock alert email
    const result = await sendLowStockAlertEmail(adminEmails, lowStock.map(p => ({
      name: p.name,
      stock_quantity: p.stock_quantity,
      low_stock_threshold: p.low_stock_threshold || 10,
      slug: p.slug
    })))

    if (result.success) {
      // Log the notification (ignore errors)
      try {
        await supabaseAdmin.from('notifications').insert({
          type: 'low_stock_admin_alert',
          title: 'Low Stock Alert',
          message: `${lowStock.length} products need restocking`,
          metadata: {
            products: lowStock.map(p => p.id),
            admin_emails: adminEmails
          }
        })
      } catch {
        // Ignore notification log errors
      }

      return { success: true, processed: lowStock.length, errors: [] }
    } else {
      return { success: false, processed: 0, errors: [result.error || 'Failed to send email'] }
    }
  } catch (error) {
    return {
      success: false,
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Get stock alert statistics
 */
export async function getStockAlertStats() {
  const supabaseAdmin = getSupabaseAdmin()

  const [activeAlerts, notifiedAlerts, lowStockProducts, outOfStockProducts] = await Promise.all([
    supabaseAdmin.from('stock_alerts').select('id', { count: 'exact' }).eq('status', 'active'),
    supabaseAdmin.from('stock_alerts').select('id', { count: 'exact' }).eq('status', 'notified'),
    supabaseAdmin.from('products').select('id', { count: 'exact' }).eq('is_active', true).lte('stock_quantity', 10).gt('stock_quantity', 0),
    supabaseAdmin.from('products').select('id', { count: 'exact' }).eq('is_active', true).eq('stock_quantity', 0)
  ])

  return {
    active_alerts: activeAlerts.count || 0,
    notified_alerts: notifiedAlerts.count || 0,
    low_stock_products: lowStockProducts.count || 0,
    out_of_stock_products: outOfStockProducts.count || 0
  }
}
