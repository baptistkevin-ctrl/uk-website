// Fraud Detection Automation
// Automatically detects and flags suspicious orders and account activity

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send-email'

interface FraudSignal {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  score: number
  description: string
  data?: Record<string, unknown>
}

interface FraudCheckResult {
  order_id: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  signals: FraudSignal[]
  should_block: boolean
  should_review: boolean
}

// Fraud detection thresholds
const THRESHOLDS = {
  HIGH_VALUE_ORDER_PENCE: 50000, // £500
  VERY_HIGH_VALUE_ORDER_PENCE: 100000, // £1000
  MAX_ORDERS_PER_HOUR: 5,
  MAX_ORDERS_PER_DAY: 10,
  MAX_FAILED_PAYMENTS_PER_HOUR: 3,
  VELOCITY_WINDOW_MINUTES: 60,
  NEW_ACCOUNT_HOURS: 24,
  SUSPICIOUS_EMAIL_PATTERNS: [
    /\+[0-9]+@/, // Plus addressing
    /@temp/, // Temporary email
    /@disposable/,
    /@guerrillamail/,
    /@mailinator/,
    /@10minutemail/
  ],
  HIGH_RISK_COUNTRIES: ['NG', 'GH', 'KE', 'PH', 'IN'], // Based on chargeback data
  BLOCK_THRESHOLD: 80,
  REVIEW_THRESHOLD: 50
}

/**
 * Check for velocity-based fraud (too many orders in short time)
 */
async function checkVelocity(
  userId: string,
  ipAddress: string
): Promise<FraudSignal[]> {
  const supabase = getSupabaseAdmin()
  const signals: FraudSignal[] = []
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Check orders by user in last hour
  const { count: userOrdersHour } = await supabase
    .from('orders')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo.toISOString())

  if ((userOrdersHour || 0) >= THRESHOLDS.MAX_ORDERS_PER_HOUR) {
    signals.push({
      type: 'velocity_user_hour',
      severity: 'high',
      score: 25,
      description: `${userOrdersHour} orders in last hour (threshold: ${THRESHOLDS.MAX_ORDERS_PER_HOUR})`,
      data: { count: userOrdersHour }
    })
  }

  // Check orders by user in last day
  const { count: userOrdersDay } = await supabase
    .from('orders')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', oneDayAgo.toISOString())

  if ((userOrdersDay || 0) >= THRESHOLDS.MAX_ORDERS_PER_DAY) {
    signals.push({
      type: 'velocity_user_day',
      severity: 'medium',
      score: 15,
      description: `${userOrdersDay} orders in last 24 hours (threshold: ${THRESHOLDS.MAX_ORDERS_PER_DAY})`,
      data: { count: userOrdersDay }
    })
  }

  // Check orders from same IP
  if (ipAddress) {
    const { count: ipOrders } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo.toISOString())

    if ((ipOrders || 0) >= THRESHOLDS.MAX_ORDERS_PER_HOUR) {
      signals.push({
        type: 'velocity_ip',
        severity: 'high',
        score: 30,
        description: `${ipOrders} orders from same IP in last hour`,
        data: { ip: ipAddress, count: ipOrders }
      })
    }
  }

  // Check failed payments
  const { count: failedPayments } = await supabase
    .from('payment_attempts')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'failed')
    .gte('created_at', oneHourAgo.toISOString())

  if ((failedPayments || 0) >= THRESHOLDS.MAX_FAILED_PAYMENTS_PER_HOUR) {
    signals.push({
      type: 'failed_payments',
      severity: 'critical',
      score: 40,
      description: `${failedPayments} failed payment attempts in last hour`,
      data: { count: failedPayments }
    })
  }

  return signals
}

/**
 * Check for account-based fraud signals
 */
async function checkAccountRisk(
  userId: string
): Promise<FraudSignal[]> {
  const supabase = getSupabaseAdmin()
  const signals: FraudSignal[] = []

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, created_at, email_verified')
    .eq('id', userId)
    .single()

  if (!profile) return signals

  // Check for new account
  const accountAge = Date.now() - new Date(profile.created_at).getTime()
  const accountAgeHours = accountAge / (1000 * 60 * 60)

  if (accountAgeHours < THRESHOLDS.NEW_ACCOUNT_HOURS) {
    signals.push({
      type: 'new_account',
      severity: 'medium',
      score: 15,
      description: `Account created ${Math.round(accountAgeHours)} hours ago`,
      data: { age_hours: accountAgeHours }
    })
  }

  // Check email not verified
  if (!profile.email_verified) {
    signals.push({
      type: 'unverified_email',
      severity: 'low',
      score: 10,
      description: 'Email address not verified'
    })
  }

  // Check suspicious email patterns
  for (const pattern of THRESHOLDS.SUSPICIOUS_EMAIL_PATTERNS) {
    if (pattern.test(profile.email)) {
      signals.push({
        type: 'suspicious_email',
        severity: 'high',
        score: 25,
        description: 'Suspicious email pattern detected',
        data: { email: profile.email }
      })
      break
    }
  }

  return signals
}

/**
 * Check order-specific fraud signals
 */
async function checkOrderRisk(
  orderData: {
    total_pence: number
    shipping_address: Record<string, unknown>
    billing_address?: Record<string, unknown>
    items: Array<{ quantity: number; price_pence: number }>
  }
): Promise<FraudSignal[]> {
  const signals: FraudSignal[] = []

  // High value order
  if (orderData.total_pence >= THRESHOLDS.VERY_HIGH_VALUE_ORDER_PENCE) {
    signals.push({
      type: 'very_high_value',
      severity: 'high',
      score: 20,
      description: `Order value £${(orderData.total_pence / 100).toFixed(2)} exceeds £${THRESHOLDS.VERY_HIGH_VALUE_ORDER_PENCE / 100}`,
      data: { total: orderData.total_pence }
    })
  } else if (orderData.total_pence >= THRESHOLDS.HIGH_VALUE_ORDER_PENCE) {
    signals.push({
      type: 'high_value',
      severity: 'medium',
      score: 10,
      description: `Order value £${(orderData.total_pence / 100).toFixed(2)} exceeds £${THRESHOLDS.HIGH_VALUE_ORDER_PENCE / 100}`,
      data: { total: orderData.total_pence }
    })
  }

  // Shipping/billing mismatch
  if (orderData.billing_address) {
    const shippingPostcode = String(orderData.shipping_address.postcode || '').toUpperCase().replace(/\s/g, '')
    const billingPostcode = String(orderData.billing_address.postcode || '').toUpperCase().replace(/\s/g, '')

    if (shippingPostcode && billingPostcode && shippingPostcode !== billingPostcode) {
      signals.push({
        type: 'address_mismatch',
        severity: 'low',
        score: 5,
        description: 'Shipping and billing postcodes differ'
      })
    }
  }

  // Large quantity of single item
  const maxQuantity = Math.max(...orderData.items.map(i => i.quantity))
  if (maxQuantity >= 10) {
    signals.push({
      type: 'bulk_purchase',
      severity: 'low',
      score: 5,
      description: `Single item quantity of ${maxQuantity}`,
      data: { quantity: maxQuantity }
    })
  }

  return signals
}

/**
 * Check device/session fraud signals
 */
async function checkDeviceRisk(
  sessionData: {
    ip_address?: string
    user_agent?: string
    fingerprint?: string
  }
): Promise<FraudSignal[]> {
  const signals: FraudSignal[] = []

  // Check for VPN/proxy (simplified check)
  if (sessionData.ip_address) {
    // In production, use a service like MaxMind or IPinfo
    const suspiciousPatterns = [
      /^10\./,      // Private IP
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./
    ]

    // TOR exit nodes and known VPN IPs would be checked here
  }

  // Check for headless browser / bot
  if (sessionData.user_agent) {
    const botPatterns = [
      /headless/i,
      /phantom/i,
      /selenium/i,
      /puppeteer/i,
      /playwright/i,
      /webdriver/i
    ]

    for (const pattern of botPatterns) {
      if (pattern.test(sessionData.user_agent)) {
        signals.push({
          type: 'bot_detected',
          severity: 'critical',
          score: 50,
          description: 'Automated browser detected',
          data: { user_agent: sessionData.user_agent }
        })
        break
      }
    }
  }

  return signals
}

/**
 * Main fraud check function - analyze an order for fraud signals
 */
export async function checkOrderFraud(
  orderId: string,
  userId: string,
  orderData: {
    total_pence: number
    shipping_address: Record<string, unknown>
    billing_address?: Record<string, unknown>
    items: Array<{ quantity: number; price_pence: number }>
  },
  sessionData: {
    ip_address?: string
    user_agent?: string
    fingerprint?: string
  }
): Promise<FraudCheckResult> {
  const allSignals: FraudSignal[] = []

  // Run all fraud checks in parallel
  const [velocitySignals, accountSignals, orderSignals, deviceSignals] = await Promise.all([
    checkVelocity(userId, sessionData.ip_address || ''),
    checkAccountRisk(userId),
    checkOrderRisk(orderData),
    checkDeviceRisk(sessionData)
  ])

  allSignals.push(...velocitySignals, ...accountSignals, ...orderSignals, ...deviceSignals)

  // Calculate total risk score
  const riskScore = allSignals.reduce((sum, signal) => sum + signal.score, 0)

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (riskScore >= 80) riskLevel = 'critical'
  else if (riskScore >= 50) riskLevel = 'high'
  else if (riskScore >= 25) riskLevel = 'medium'

  const result: FraudCheckResult = {
    order_id: orderId,
    risk_score: Math.min(riskScore, 100),
    risk_level: riskLevel,
    signals: allSignals,
    should_block: riskScore >= THRESHOLDS.BLOCK_THRESHOLD,
    should_review: riskScore >= THRESHOLDS.REVIEW_THRESHOLD
  }

  // Store fraud check result
  const supabase = getSupabaseAdmin()
  await supabase.from('fraud_checks').insert({
    order_id: orderId,
    user_id: userId,
    risk_score: result.risk_score,
    risk_level: result.risk_level,
    signals: result.signals,
    should_block: result.should_block,
    should_review: result.should_review,
    ip_address: sessionData.ip_address,
    user_agent: sessionData.user_agent,
    created_at: new Date().toISOString()
  }) // Ignore errors - table may not exist

  // If high risk, notify admins
  if (result.should_review) {
    await notifyFraudAlert(result, userId, orderData)
  }

  return result
}

/**
 * Notify admins of high-risk orders
 */
async function notifyFraudAlert(
  result: FraudCheckResult,
  userId: string,
  orderData: { total_pence: number }
): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { data: admins } = await supabase
    .from('profiles')
    .select('email')
    .in('role', ['admin', 'super_admin'])
    .not('email', 'is', null)

  if (!admins || admins.length === 0) return

  const adminEmails = admins.map(a => a.email).filter(Boolean) as string[]

  const signalsHtml = result.signals
    .sort((a, b) => b.score - a.score)
    .map(s => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${s.type}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
          <span style="background-color: ${
            s.severity === 'critical' ? '#fef2f2' :
            s.severity === 'high' ? '#fff7ed' :
            s.severity === 'medium' ? '#fefce8' : '#f0fdf4'
          }; color: ${
            s.severity === 'critical' ? '#991b1b' :
            s.severity === 'high' ? '#9a3412' :
            s.severity === 'medium' ? '#854d0e' : '#166534'
          }; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
            ${s.severity}
          </span>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${s.description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600;">+${s.score}</td>
      </tr>
    `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Fraud Alert</title></head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <table width="600" style="margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <tr>
          <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #fff; font-size: 20px;">🚨 Fraud Alert</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #991b1b;">
                <strong>Risk Score:</strong> ${result.risk_score}/100 (${result.risk_level.toUpperCase()})
              </p>
              <p style="margin: 0; font-size: 14px; color: #991b1b;">
                <strong>Order Value:</strong> £${(orderData.total_pence / 100).toFixed(2)}
              </p>
            </div>

            <h3 style="margin: 0 0 12px; font-size: 16px; color: #1e293b;">Fraud Signals</h3>
            <table width="100%" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-size: 14px;">
              <tr style="background: #f8fafc;">
                <td style="padding: 8px; font-weight: 600;">Type</td>
                <td style="padding: 8px; font-weight: 600;">Severity</td>
                <td style="padding: 8px; font-weight: 600;">Description</td>
                <td style="padding: 8px; font-weight: 600; text-align: center;">Score</td>
              </tr>
              ${signalsHtml}
            </table>

            <div style="text-align: center; margin-top: 24px;">
              <a href="https://ukgrocerystore.com/admin/orders/${result.order_id}"
                 style="display: inline-block; background: #dc2626; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
                Review Order
              </a>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  await sendEmail({
    to: adminEmails,
    subject: `🚨 Fraud Alert: Risk Score ${result.risk_score}/100 - Order requires review`,
    html
  })
}

/**
 * Get fraud statistics for admin dashboard
 */
export async function getFraudStats(): Promise<{
  today: { checked: number; flagged: number; blocked: number }
  week: { checked: number; flagged: number; blocked: number }
  recent_alerts: Array<{
    order_id: string
    risk_score: number
    risk_level: string
    created_at: string
  }>
}> {
  const supabase = getSupabaseAdmin()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [todayStats, weekStats, recentAlerts] = await Promise.all([
    supabase
      .from('fraud_checks')
      .select('should_block, should_review', { count: 'exact' })
      .gte('created_at', today.toISOString()),

    supabase
      .from('fraud_checks')
      .select('should_block, should_review', { count: 'exact' })
      .gte('created_at', weekAgo.toISOString()),

    supabase
      .from('fraud_checks')
      .select('order_id, risk_score, risk_level, created_at')
      .eq('should_review', true)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const countFlagged = (data: Array<{ should_review: boolean }> | null) =>
    data?.filter(d => d.should_review).length || 0

  const countBlocked = (data: Array<{ should_block: boolean }> | null) =>
    data?.filter(d => d.should_block).length || 0

  return {
    today: {
      checked: todayStats.count || 0,
      flagged: countFlagged(todayStats.data),
      blocked: countBlocked(todayStats.data)
    },
    week: {
      checked: weekStats.count || 0,
      flagged: countFlagged(weekStats.data),
      blocked: countBlocked(weekStats.data)
    },
    recent_alerts: recentAlerts.data || []
  }
}
