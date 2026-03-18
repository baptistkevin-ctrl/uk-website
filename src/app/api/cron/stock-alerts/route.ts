import { NextRequest, NextResponse } from 'next/server'
import {
  processBackInStockAlerts,
  checkLowStockAndAlert,
  getStockAlertStats
} from '@/lib/stock/stock-alert-processor'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for processing

// Verify cron secret — always required, even in development
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET is not set. Cron routes are disabled.')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

/**
 * GET - Trigger stock alert processing
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
 *
 * Query params:
 * - action: 'back_in_stock' | 'low_stock' | 'both' (default: 'both')
 *
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'both'

  const results: {
    backInStock?: Awaited<ReturnType<typeof processBackInStockAlerts>>
    lowStock?: Awaited<ReturnType<typeof checkLowStockAndAlert>>
    stats?: Awaited<ReturnType<typeof getStockAlertStats>>
  } = {}

  try {
    // Process back-in-stock alerts
    if (action === 'back_in_stock' || action === 'both') {
      results.backInStock = await processBackInStockAlerts()
    }

    // Check low stock and alert admins
    if (action === 'low_stock' || action === 'both') {
      results.lowStock = await checkLowStockAndAlert()
    }

    // Get current stats
    results.stats = await getStockAlertStats()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error) {
    console.error('Stock alert cron error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * POST - Manually trigger specific stock alert actions (admin only)
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action } = body

    if (!action || !['back_in_stock', 'low_stock', 'stats'].includes(action)) {
      return NextResponse.json({
        error: 'Invalid action. Use: back_in_stock, low_stock, or stats'
      }, { status: 400 })
    }

    let result

    switch (action) {
      case 'back_in_stock':
        result = await processBackInStockAlerts()
        break
      case 'low_stock':
        result = await checkLowStockAndAlert()
        break
      case 'stats':
        result = await getStockAlertStats()
        break
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Stock alert manual trigger error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
