// Vendor Performance Scoring System
// Automatically calculates and tracks vendor performance metrics

import { getSupabaseAdmin } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send-email'

interface VendorMetrics {
  vendor_id: string
  business_name: string

  // Order metrics
  total_orders: number
  orders_last_30_days: number
  total_revenue_pence: number
  revenue_last_30_days_pence: number

  // Fulfillment metrics
  on_time_delivery_rate: number  // Percentage 0-100
  order_accuracy_rate: number    // Percentage 0-100
  average_processing_time_hours: number

  // Customer satisfaction
  average_rating: number         // 1-5 scale
  total_reviews: number
  positive_review_rate: number   // Percentage 0-100

  // Return/refund metrics
  return_rate: number            // Percentage 0-100
  refund_rate: number            // Percentage 0-100

  // Product metrics
  active_products: number
  out_of_stock_products: number
  stock_availability_rate: number // Percentage 0-100

  // Response metrics
  average_response_time_hours: number
  question_answer_rate: number   // Percentage 0-100

  // Overall score
  performance_score: number      // 0-100
  performance_grade: 'A' | 'B' | 'C' | 'D' | 'F'
  trend: 'up' | 'down' | 'stable'
}

// Scoring weights
const SCORING_WEIGHTS = {
  on_time_delivery: 20,
  order_accuracy: 15,
  customer_rating: 20,
  return_rate: 15,
  stock_availability: 10,
  response_time: 10,
  processing_time: 10
}

// Performance thresholds
const THRESHOLDS = {
  ON_TIME_DELIVERY_TARGET: 95,
  ORDER_ACCURACY_TARGET: 98,
  RATING_TARGET: 4.5,
  RETURN_RATE_MAX: 5,
  STOCK_AVAILABILITY_TARGET: 95,
  RESPONSE_TIME_MAX_HOURS: 24,
  PROCESSING_TIME_MAX_HOURS: 48
}

/**
 * Calculate performance score based on metrics
 */
function calculatePerformanceScore(metrics: Partial<VendorMetrics>): number {
  let score = 0

  // On-time delivery (0-20 points)
  const otdScore = Math.min(
    (metrics.on_time_delivery_rate || 0) / THRESHOLDS.ON_TIME_DELIVERY_TARGET * SCORING_WEIGHTS.on_time_delivery,
    SCORING_WEIGHTS.on_time_delivery
  )
  score += otdScore

  // Order accuracy (0-15 points)
  const accuracyScore = Math.min(
    (metrics.order_accuracy_rate || 0) / THRESHOLDS.ORDER_ACCURACY_TARGET * SCORING_WEIGHTS.order_accuracy,
    SCORING_WEIGHTS.order_accuracy
  )
  score += accuracyScore

  // Customer rating (0-20 points)
  const ratingScore = Math.min(
    ((metrics.average_rating || 0) / 5) * SCORING_WEIGHTS.customer_rating,
    SCORING_WEIGHTS.customer_rating
  )
  score += ratingScore

  // Return rate (0-15 points, lower is better)
  const returnScore = Math.max(
    SCORING_WEIGHTS.return_rate - ((metrics.return_rate || 0) / THRESHOLDS.RETURN_RATE_MAX * SCORING_WEIGHTS.return_rate),
    0
  )
  score += returnScore

  // Stock availability (0-10 points)
  const stockScore = Math.min(
    (metrics.stock_availability_rate || 0) / THRESHOLDS.STOCK_AVAILABILITY_TARGET * SCORING_WEIGHTS.stock_availability,
    SCORING_WEIGHTS.stock_availability
  )
  score += stockScore

  // Response time (0-10 points, faster is better)
  const responseScore = Math.max(
    SCORING_WEIGHTS.response_time - ((metrics.average_response_time_hours || 0) / THRESHOLDS.RESPONSE_TIME_MAX_HOURS * SCORING_WEIGHTS.response_time),
    0
  )
  score += responseScore

  // Processing time (0-10 points, faster is better)
  const processingScore = Math.max(
    SCORING_WEIGHTS.processing_time - ((metrics.average_processing_time_hours || 0) / THRESHOLDS.PROCESSING_TIME_MAX_HOURS * SCORING_WEIGHTS.processing_time),
    0
  )
  score += processingScore

  return Math.round(Math.min(score, 100))
}

/**
 * Convert score to grade
 */
function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

/**
 * Calculate vendor metrics from database
 */
export async function calculateVendorMetrics(vendorId: string): Promise<VendorMetrics | null> {
  const supabase = getSupabaseAdmin()

  // Get vendor info
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name')
    .eq('id', vendorId)
    .single()

  if (!vendor) return null

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Get order metrics
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      total_pence,
      status,
      created_at,
      shipped_at,
      delivered_at,
      estimated_delivery_at,
      order_items!inner (
        vendor_id
      )
    `)
    .eq('order_items.vendor_id', vendorId)

  const allOrders = orders || []
  const recentOrders = allOrders.filter(o => new Date(o.created_at) >= thirtyDaysAgo)

  // Calculate order metrics
  const totalOrders = allOrders.length
  const ordersLast30Days = recentOrders.length
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total_pence || 0), 0)
  const revenueLast30Days = recentOrders.reduce((sum, o) => sum + (o.total_pence || 0), 0)

  // Calculate on-time delivery rate
  const deliveredOrders = allOrders.filter(o => o.status === 'delivered' && o.delivered_at)
  const onTimeDeliveries = deliveredOrders.filter(o => {
    if (!o.estimated_delivery_at) return true // No estimate = assume on time
    return new Date(o.delivered_at) <= new Date(o.estimated_delivery_at)
  })
  const onTimeDeliveryRate = deliveredOrders.length > 0
    ? (onTimeDeliveries.length / deliveredOrders.length) * 100
    : 100

  // Calculate average processing time
  const processedOrders = allOrders.filter(o => o.shipped_at)
  const processingTimes = processedOrders.map(o => {
    return (new Date(o.shipped_at).getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60)
  })
  const avgProcessingTime = processingTimes.length > 0
    ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
    : 0

  // Get review metrics
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('vendor_id', vendorId)
    .eq('status', 'approved')

  const allReviews = reviews || []
  const totalReviews = allReviews.length
  const averageRating = totalReviews > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 5
  const positiveReviews = allReviews.filter(r => r.rating >= 4).length
  const positiveReviewRate = totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 100

  // Get return metrics
  const { data: returns } = await supabase
    .from('returns')
    .select('id, order_id')
    .in('order_id', allOrders.map(o => o.id))
    .not('status', 'eq', 'cancelled')

  const returnRate = totalOrders > 0 ? ((returns?.length || 0) / totalOrders) * 100 : 0

  // Get product metrics
  const { data: products } = await supabase
    .from('products')
    .select('id, stock_quantity, is_active')
    .eq('vendor_id', vendorId)

  const activeProducts = products?.filter(p => p.is_active).length || 0
  const outOfStock = products?.filter(p => p.is_active && p.stock_quantity <= 0).length || 0
  const stockAvailability = activeProducts > 0
    ? ((activeProducts - outOfStock) / activeProducts) * 100
    : 100

  // Get Q&A response metrics
  const { data: questions } = await supabase
    .from('product_questions')
    .select(`
      id,
      created_at,
      status,
      product_answers (
        id,
        created_at,
        vendor_id
      )
    `)
    .in('product_id', products?.map(p => p.id) || [])

  const vendorAnswers = questions?.filter(q =>
    q.product_answers?.some((a: { vendor_id: string }) => a.vendor_id === vendorId)
  ) || []

  const questionAnswerRate = (questions?.length || 0) > 0
    ? (vendorAnswers.length / questions!.length) * 100
    : 100

  // Calculate average response time
  const responseTimes = vendorAnswers.map(q => {
    const answer = (q.product_answers as Array<{ created_at: string; vendor_id: string }>)
      .find(a => a.vendor_id === vendorId)
    if (!answer) return 0
    return (new Date(answer.created_at).getTime() - new Date(q.created_at).getTime()) / (1000 * 60 * 60)
  }).filter(t => t > 0)

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0

  // Build metrics object
  const metrics: VendorMetrics = {
    vendor_id: vendorId,
    business_name: vendor.business_name,
    total_orders: totalOrders,
    orders_last_30_days: ordersLast30Days,
    total_revenue_pence: totalRevenue,
    revenue_last_30_days_pence: revenueLast30Days,
    on_time_delivery_rate: Math.round(onTimeDeliveryRate * 10) / 10,
    order_accuracy_rate: 98, // Would need order accuracy tracking
    average_processing_time_hours: Math.round(avgProcessingTime * 10) / 10,
    average_rating: Math.round(averageRating * 10) / 10,
    total_reviews: totalReviews,
    positive_review_rate: Math.round(positiveReviewRate * 10) / 10,
    return_rate: Math.round(returnRate * 10) / 10,
    refund_rate: Math.round(returnRate * 10) / 10, // Simplified
    active_products: activeProducts,
    out_of_stock_products: outOfStock,
    stock_availability_rate: Math.round(stockAvailability * 10) / 10,
    average_response_time_hours: Math.round(avgResponseTime * 10) / 10,
    question_answer_rate: Math.round(questionAnswerRate * 10) / 10,
    performance_score: 0,
    performance_grade: 'C',
    trend: 'stable'
  }

  // Calculate overall score
  metrics.performance_score = calculatePerformanceScore(metrics)
  metrics.performance_grade = scoreToGrade(metrics.performance_score)

  return metrics
}

/**
 * Update all vendor scores
 */
export async function updateAllVendorScores(): Promise<{
  processed: number
  updated: number
  errors: string[]
}> {
  const supabase = getSupabaseAdmin()
  const errors: string[] = []
  let processed = 0
  let updated = 0

  try {
    // Get all active vendors
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, business_name')
      .eq('status', 'approved')

    if (!vendors) {
      return { processed: 0, updated: 0, errors: ['No vendors found'] }
    }

    for (const vendor of vendors) {
      processed++

      try {
        const metrics = await calculateVendorMetrics(vendor.id)
        if (!metrics) continue

        // Get previous score for trend
        const { data: previous } = await supabase
          .from('vendor_metrics')
          .select('performance_score')
          .eq('vendor_id', vendor.id)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .single()

        let trend: 'up' | 'down' | 'stable' = 'stable'
        if (previous) {
          const diff = metrics.performance_score - previous.performance_score
          if (diff >= 2) trend = 'up'
          else if (diff <= -2) trend = 'down'
        }
        metrics.trend = trend

        // Store metrics
        const { error: metricsError } = await supabase.from('vendor_metrics').insert({
          ...metrics,
          vendor_id: vendor.id,
          calculated_at: new Date().toISOString()
        })

        // Update vendor table directly if metrics table doesn't exist
        if (metricsError) {
          await supabase
            .from('vendors')
            .update({
              performance_score: metrics.performance_score,
              performance_grade: metrics.performance_grade,
              updated_at: new Date().toISOString()
            })
            .eq('id', vendor.id)
        }

        updated++

        // Notify vendor if grade dropped
        if (previous && trend === 'down') {
          await notifyVendorPerformanceDrop(vendor.id, metrics)
        }
      } catch (err) {
        errors.push(`Error for ${vendor.business_name}: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }

    return { processed, updated, errors }
  } catch (error) {
    return {
      processed,
      updated,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Get vendor leaderboard
 */
export async function getVendorLeaderboard(limit: number = 10): Promise<VendorMetrics[]> {
  const supabase = getSupabaseAdmin()

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id')
    .eq('status', 'approved')
    .limit(50)

  if (!vendors) return []

  const metricsPromises = vendors.map(v => calculateVendorMetrics(v.id))
  const allMetrics = await Promise.all(metricsPromises)

  return allMetrics
    .filter((m): m is VendorMetrics => m !== null)
    .sort((a, b) => b.performance_score - a.performance_score)
    .slice(0, limit)
}

/**
 * Notify vendor of performance drop
 */
async function notifyVendorPerformanceDrop(vendorId: string, metrics: VendorMetrics): Promise<void> {
  const supabase = getSupabaseAdmin()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('contact_email, business_name')
    .eq('id', vendorId)
    .single()

  if (!vendor?.contact_email) return

  const issues: string[] = []

  if (metrics.on_time_delivery_rate < THRESHOLDS.ON_TIME_DELIVERY_TARGET) {
    issues.push(`On-time delivery: ${metrics.on_time_delivery_rate}% (target: ${THRESHOLDS.ON_TIME_DELIVERY_TARGET}%)`)
  }
  if (metrics.average_rating < THRESHOLDS.RATING_TARGET) {
    issues.push(`Customer rating: ${metrics.average_rating}/5 (target: ${THRESHOLDS.RATING_TARGET})`)
  }
  if (metrics.return_rate > THRESHOLDS.RETURN_RATE_MAX) {
    issues.push(`Return rate: ${metrics.return_rate}% (max: ${THRESHOLDS.RETURN_RATE_MAX}%)`)
  }
  if (metrics.stock_availability_rate < THRESHOLDS.STOCK_AVAILABILITY_TARGET) {
    issues.push(`Stock availability: ${metrics.stock_availability_rate}% (target: ${THRESHOLDS.STOCK_AVAILABILITY_TARGET}%)`)
  }

  const issuesHtml = issues.map(i => `<li style="color: #dc2626; margin: 4px 0;">${i}</li>`).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, sans-serif; background: #f8fafc; padding: 40px 20px;">
      <table width="600" style="margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden;">
        <tr>
          <td style="background: #f59e0b; padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #fff; font-size: 20px;">📊 Performance Alert</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px;">
            <p style="font-size: 16px; color: #1e293b;">
              Hi ${vendor.business_name},
            </p>
            <p style="color: #475569;">
              Your vendor performance score has dropped. Here's your current standing:
            </p>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">Performance Score</p>
              <p style="margin: 0; font-size: 48px; font-weight: 700; color: ${
                metrics.performance_grade === 'A' ? '#059669' :
                metrics.performance_grade === 'B' ? '#10b981' :
                metrics.performance_grade === 'C' ? '#f59e0b' : '#dc2626'
              };">
                ${metrics.performance_score}/100 (${metrics.performance_grade})
              </p>
            </div>

            ${issues.length > 0 ? `
            <h3 style="color: #1e293b; margin-bottom: 8px;">Areas Needing Improvement:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${issuesHtml}
            </ul>
            ` : ''}

            <div style="text-align: center; margin-top: 24px;">
              <a href="https://ukgrocerystore.com/vendor/performance" style="display: inline-block; background: #059669; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">
                View Full Report
              </a>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  await sendEmail({
    to: vendor.contact_email,
    subject: `📊 Performance Alert: Your score dropped to ${metrics.performance_score}/100`,
    html
  })
}

/**
 * Get vendors needing attention (low performance)
 */
export async function getVendorsNeedingAttention(): Promise<VendorMetrics[]> {
  const leaderboard = await getVendorLeaderboard(100)
  return leaderboard.filter(v => v.performance_score < 70 || v.performance_grade === 'D' || v.performance_grade === 'F')
}
