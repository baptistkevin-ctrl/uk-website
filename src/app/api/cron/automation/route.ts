import { NextRequest, NextResponse } from 'next/server'
import {
  processAbandonedCarts,
  processReorderReminders,
  processReviewRequests,
  trackPriceChanges,
  processPriceDropAlerts,
  applyExpiryDiscounts,
  sendExpiryAlerts,
  removeExpiredProducts,
  processExpiredPoints,
  processBirthdayBonuses,
  updateAllVendorScores
} from '@/lib/automation'
import {
  processBackInStockAlerts,
  checkLowStockAndAlert
} from '@/lib/stock/stock-alert-processor'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max

// Verify cron secret
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return process.env.NODE_ENV === 'development'
  }

  return authHeader === `Bearer ${cronSecret}`
}

type AutomationTask =
  | 'abandoned_carts'
  | 'reorder_reminders'
  | 'review_requests'
  | 'price_tracking'
  | 'price_drop_alerts'
  | 'expiry_discounts'
  | 'expiry_alerts'
  | 'remove_expired'
  | 'expired_points'
  | 'birthday_bonuses'
  | 'vendor_scores'
  | 'stock_alerts'
  | 'low_stock_alerts'
  | 'all'
  | 'hourly'
  | 'daily'
  | 'weekly'

interface TaskResult {
  task: string
  success: boolean
  data?: Record<string, unknown>
  error?: string
  duration_ms: number
}

/**
 * Run a single automation task with timing
 */
async function runTask(
  taskName: string,
  taskFn: () => Promise<Record<string, unknown>>
): Promise<TaskResult> {
  const start = Date.now()
  try {
    const data = await taskFn()
    return {
      task: taskName,
      success: true,
      data,
      duration_ms: Date.now() - start
    }
  } catch (error) {
    return {
      task: taskName,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: Date.now() - start
    }
  }
}

/**
 * Get tasks to run based on schedule type
 */
function getTasksForSchedule(schedule: AutomationTask): AutomationTask[] {
  switch (schedule) {
    case 'hourly':
      return [
        'abandoned_carts',
        'stock_alerts',
        'price_tracking'
      ]
    case 'daily':
      return [
        'reorder_reminders',
        'review_requests',
        'price_drop_alerts',
        'expiry_alerts',
        'expiry_discounts',
        'remove_expired',
        'low_stock_alerts',
        'expired_points',
        'birthday_bonuses',
        'vendor_scores'
      ]
    case 'weekly':
      return [
        'vendor_scores'
      ]
    case 'all':
      return [
        'abandoned_carts',
        'reorder_reminders',
        'review_requests',
        'price_tracking',
        'price_drop_alerts',
        'expiry_discounts',
        'expiry_alerts',
        'remove_expired',
        'expired_points',
        'birthday_bonuses',
        'vendor_scores',
        'stock_alerts',
        'low_stock_alerts'
      ]
    default:
      return [schedule]
  }
}

/**
 * Run automation tasks
 */
async function runTasks(tasks: AutomationTask[]): Promise<TaskResult[]> {
  const results: TaskResult[] = []

  for (const task of tasks) {
    let result: TaskResult

    switch (task) {
      case 'abandoned_carts':
        result = await runTask('abandoned_carts', async () => {
          const r = await processAbandonedCarts()
          return { processed: r.processed, sent: r.sent, errors: r.errors.length }
        })
        break

      case 'reorder_reminders':
        result = await runTask('reorder_reminders', async () => {
          const r = await processReorderReminders()
          return { processed: r.processed, sent: r.sent, errors: r.errors.length }
        })
        break

      case 'review_requests':
        result = await runTask('review_requests', async () => {
          const r = await processReviewRequests()
          return { processed: r.processed, sent: r.sent, skipped: r.skipped, errors: r.errors.length }
        })
        break

      case 'price_tracking':
        result = await runTask('price_tracking', async () => {
          const r = await trackPriceChanges()
          return { tracked: r.tracked, price_drops: r.priceDrops }
        })
        break

      case 'price_drop_alerts':
        result = await runTask('price_drop_alerts', async () => {
          const r = await processPriceDropAlerts()
          return { processed: r.processed, sent: r.sent, errors: r.errors.length }
        })
        break

      case 'expiry_discounts':
        result = await runTask('expiry_discounts', async () => {
          const r = await applyExpiryDiscounts(true)
          return { processed: r.processed, discounted: r.discounted, errors: r.errors.length }
        })
        break

      case 'expiry_alerts':
        result = await runTask('expiry_alerts', async () => {
          const r = await sendExpiryAlerts()
          return { sent: r.sent, errors: r.errors.length }
        })
        break

      case 'remove_expired':
        result = await runTask('remove_expired', async () => {
          const r = await removeExpiredProducts()
          return { removed: r.removed, errors: r.errors.length }
        })
        break

      case 'expired_points':
        result = await runTask('expired_points', async () => {
          const r = await processExpiredPoints()
          return { processed: r.processed, expired_users: r.expired_users, total_expired: r.total_expired_points }
        })
        break

      case 'birthday_bonuses':
        result = await runTask('birthday_bonuses', async () => {
          const r = await processBirthdayBonuses()
          return { awarded: r.awarded, total_points: r.total_points }
        })
        break

      case 'vendor_scores':
        result = await runTask('vendor_scores', async () => {
          const r = await updateAllVendorScores()
          return { processed: r.processed, updated: r.updated, errors: r.errors.length }
        })
        break

      case 'stock_alerts':
        result = await runTask('stock_alerts', async () => {
          const r = await processBackInStockAlerts()
          return { processed: r.processed, errors: r.errors.length }
        })
        break

      case 'low_stock_alerts':
        result = await runTask('low_stock_alerts', async () => {
          const r = await checkLowStockAndAlert()
          return { processed: r.processed, errors: r.errors.length }
        })
        break

      default:
        result = {
          task: task,
          success: false,
          error: 'Unknown task',
          duration_ms: 0
        }
    }

    results.push(result)
  }

  return results
}

/**
 * GET - Run automation tasks based on schedule or specific task
 *
 * Query params:
 * - task: specific task or schedule (hourly, daily, weekly, all)
 *
 * Examples:
 * - /api/cron/automation?task=hourly
 * - /api/cron/automation?task=abandoned_carts
 * - /api/cron/automation?task=all
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const taskParam = (searchParams.get('task') || 'hourly') as AutomationTask

  const startTime = Date.now()
  const tasksToRun = getTasksForSchedule(taskParam)
  const results = await runTasks(tasksToRun)

  const totalDuration = Date.now() - startTime
  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  return NextResponse.json({
    success: failureCount === 0,
    schedule: taskParam,
    tasks_run: tasksToRun.length,
    successful: successCount,
    failed: failureCount,
    total_duration_ms: totalDuration,
    timestamp: new Date().toISOString(),
    results
  })
}

/**
 * POST - Manually trigger specific automation tasks
 */
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { tasks } = body as { tasks: AutomationTask[] }

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({
        error: 'Invalid request. Provide tasks array.',
        available_tasks: [
          'abandoned_carts',
          'reorder_reminders',
          'review_requests',
          'price_tracking',
          'price_drop_alerts',
          'expiry_discounts',
          'expiry_alerts',
          'remove_expired',
          'expired_points',
          'birthday_bonuses',
          'vendor_scores',
          'stock_alerts',
          'low_stock_alerts'
        ]
      }, { status: 400 })
    }

    const startTime = Date.now()
    const results = await runTasks(tasks)
    const totalDuration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      tasks_run: tasks.length,
      total_duration_ms: totalDuration,
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
