import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import {
  processBackInStockAlerts,
  checkLowStockAndAlert,
  getStockAlertStats
} from '@/lib/stock/stock-alert-processor'
import { logAuditEvent } from '@/lib/security/audit'

export const dynamic = 'force-dynamic'

// GET - List all stock alerts with stats
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Build query
    let query = supabaseAdmin
      .from('stock_alerts')
      .select(`
        *,
        product:products(id, name, slug, image_url, stock_quantity, price_pence),
        user:profiles(id, full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: alerts, error } = await query

    if (error) {
      console.error('Error fetching stock alerts:', error)
      return NextResponse.json({ error: 'Failed to fetch stock alerts' }, { status: 500 })
    }

    // Get comprehensive stats
    const stats = await getStockAlertStats()
    const allAlerts = alerts || []

    return NextResponse.json({
      alerts: allAlerts,
      stats: {
        ...stats,
        total_alerts: allAlerts.length,
        unique_products: new Set(allAlerts.map(a => a.product_id)).size
      }
    })
  } catch (error) {
    console.error('Get stock alerts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Manually trigger stock alert processing
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  try {
    const body = await request.json()
    const { action } = body

    if (!action || !['process_back_in_stock', 'check_low_stock', 'process_all'].includes(action)) {
      return NextResponse.json({
        error: 'Invalid action. Use: process_back_in_stock, check_low_stock, or process_all'
      }, { status: 400 })
    }

    const results: {
      backInStock?: Awaited<ReturnType<typeof processBackInStockAlerts>>
      lowStock?: Awaited<ReturnType<typeof checkLowStockAndAlert>>
    } = {}

    if (action === 'process_back_in_stock' || action === 'process_all') {
      results.backInStock = await processBackInStockAlerts()
    }

    if (action === 'check_low_stock' || action === 'process_all') {
      results.lowStock = await checkLowStockAndAlert()
    }

    // Log audit event
    if (auth.user && auth.profile) {
      await logAuditEvent({
        userId: auth.user.id,
        userEmail: auth.profile.email,
        action: 'stock_alert_manual_trigger',
        entityType: 'stock_alerts',
        metadata: { action, results },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
    }

    return NextResponse.json({
      success: true,
      action,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Manual stock alert trigger error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Clear old/cancelled stock alerts
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const olderThanDays = parseInt(searchParams.get('older_than_days') || '30')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    // Delete old notified alerts
    const { count, error } = await supabaseAdmin
      .from('stock_alerts')
      .delete()
      .in('status', ['notified', 'cancelled', 'purchased'])
      .lt('updated_at', cutoffDate.toISOString())

    if (error) {
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
    }

    // Log audit event
    if (auth.user && auth.profile) {
      await logAuditEvent({
        userId: auth.user.id,
        userEmail: auth.profile.email,
        action: 'stock_alerts_cleanup',
        entityType: 'stock_alerts',
        metadata: { olderThanDays, deletedCount: count },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
    }

    return NextResponse.json({
      success: true,
      deleted: count || 0,
      message: `Deleted ${count || 0} old stock alerts`
    })
  } catch (error) {
    console.error('Stock alerts cleanup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
