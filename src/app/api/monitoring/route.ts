import { NextRequest, NextResponse } from 'next/server'
import { cacheStats } from '@/lib/cache'
import { getAllQueueStats, purgeQueue } from '@/lib/queue'
import { apiCatchAll } from '@/lib/utils/api-error'

export const dynamic = 'force-dynamic'

/**
 * Monitoring & metrics endpoint for operational visibility.
 * Protected by CRON_SECRET or admin auth.
 */
export async function GET(request: NextRequest) {
  try {
    // Auth: require CRON_SECRET for monitoring access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Collect metrics
    const [cache, queues] = await Promise.all([
      cacheStats(),
      Promise.resolve(getAllQueueStats()),
    ])

    const mem = process.memoryUsage()

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.round(process.uptime()),
      memory: {
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        external_mb: Math.round(mem.external / 1024 / 1024),
      },
      cache: {
        ...cache,
        hit_rate: cache.hits + cache.misses > 0
          ? Math.round((cache.hits / (cache.hits + cache.misses)) * 100)
          : 0,
      },
      queues,
      environment: {
        node_version: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV,
      },
    }

    return NextResponse.json(metrics, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return apiCatchAll(error, 'monitoring:get')
  }
}

/**
 * POST /api/monitoring - Maintenance operations
 * Actions: purge_queues, flush_cache
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'purge_queues':
        purgeQueue(body.maxAgeMs)
        return NextResponse.json({ message: 'Queue purge completed' })

      case 'flush_cache': {
        const { cacheFlush } = await import('@/lib/cache')
        await cacheFlush()
        return NextResponse.json({ message: 'Cache flushed' })
      }

      default:
        return NextResponse.json(
          { error: 'Unknown action. Supported: purge_queues, flush_cache' },
          { status: 400 }
        )
    }
  } catch (error) {
    return apiCatchAll(error, 'monitoring:post')
  }
}
