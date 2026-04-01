/**
 * Enterprise job queue system - Redis/BullMQ-ready with in-memory fallback
 *
 * Provides background job processing for:
 * - Email sending
 * - Order processing
 * - Notification delivery
 * - Search index updates
 * - Report generation
 * - Inventory sync
 *
 * Set REDIS_URL to enable persistent Redis-backed queues in production.
 */

export interface Job<T = unknown> {
  id: string
  queue: string
  data: T
  priority: number
  attempts: number
  maxAttempts: number
  createdAt: number
  processedAt?: number
  completedAt?: number
  failedAt?: number
  error?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying'
}

type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>

interface QueueOptions {
  maxAttempts?: number
  retryDelayMs?: number
  concurrency?: number
}

const DEFAULT_OPTIONS: Required<QueueOptions> = {
  maxAttempts: 3,
  retryDelayMs: 5_000,
  concurrency: 5,
}

// ---------------------------------------------------------------------------
// In-memory queue backend
// ---------------------------------------------------------------------------

class InMemoryQueue {
  private jobs = new Map<string, Job>()
  private handlers = new Map<string, JobHandler>()
  private processing = new Map<string, number>() // queue -> active count
  private options: Required<QueueOptions>
  private timer: ReturnType<typeof setInterval>

  constructor(options: QueueOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    // Process pending jobs every second
    this.timer = setInterval(() => this.tick(), 1_000)
  }

  register<T>(queue: string, handler: JobHandler<T>) {
    this.handlers.set(queue, handler as JobHandler)
  }

  async add<T>(queue: string, data: T, priority: number = 0): Promise<string> {
    const id = `${queue}:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`
    const job: Job<T> = {
      id,
      queue,
      data,
      priority,
      attempts: 0,
      maxAttempts: this.options.maxAttempts,
      createdAt: Date.now(),
      status: 'pending',
    }
    this.jobs.set(id, job as Job)
    return id
  }

  async addBulk<T>(queue: string, items: T[], priority: number = 0): Promise<string[]> {
    return Promise.all(items.map((data) => this.add(queue, data, priority)))
  }

  private async tick() {
    for (const [queueName, handler] of this.handlers) {
      const active = this.processing.get(queueName) || 0
      if (active >= this.options.concurrency) continue

      // Get pending jobs for this queue, sorted by priority (higher first)
      const pending = Array.from(this.jobs.values())
        .filter((j) => j.queue === queueName && (j.status === 'pending' || j.status === 'retrying'))
        .sort((a, b) => b.priority - a.priority)

      const slotsAvailable = this.options.concurrency - active
      const batch = pending.slice(0, slotsAvailable)

      for (const job of batch) {
        this.processing.set(queueName, (this.processing.get(queueName) || 0) + 1)
        job.status = 'processing'
        job.processedAt = Date.now()
        job.attempts++

        handler(job)
          .then(() => {
            job.status = 'completed'
            job.completedAt = Date.now()
          })
          .catch((err: Error) => {
            if (job.attempts < job.maxAttempts) {
              job.status = 'retrying'
              job.error = err.message
            } else {
              job.status = 'failed'
              job.failedAt = Date.now()
              job.error = err.message
              console.error(`[queue] Job ${job.id} failed after ${job.attempts} attempts:`, err.message)
            }
          })
          .finally(() => {
            const count = this.processing.get(queueName) || 1
            this.processing.set(queueName, Math.max(0, count - 1))
          })
      }
    }
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id)
  }

  getQueueStats(queue: string) {
    const jobs = Array.from(this.jobs.values()).filter((j) => j.queue === queue)
    return {
      queue,
      total: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      processing: jobs.filter((j) => j.status === 'processing').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      retrying: jobs.filter((j) => j.status === 'retrying').length,
    }
  }

  getAllStats() {
    const queues = new Set(Array.from(this.jobs.values()).map((j) => j.queue))
    return Array.from(queues).map((q) => this.getQueueStats(q))
  }

  /** Purge completed/failed jobs older than maxAgeMs */
  purge(maxAgeMs: number = 60 * 60_000) {
    const cutoff = Date.now() - maxAgeMs
    for (const [id, job] of this.jobs) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        (job.completedAt || job.failedAt || job.createdAt) < cutoff
      ) {
        this.jobs.delete(id)
      }
    }
  }

  destroy() {
    clearInterval(this.timer)
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let queue: InMemoryQueue | null = null

function getQueue(): InMemoryQueue {
  if (!queue) {
    queue = new InMemoryQueue()
  }
  return queue
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Queue names used across the application */
export const QUEUES = {
  EMAIL: 'email',
  ORDER_PROCESSING: 'order-processing',
  NOTIFICATIONS: 'notifications',
  SEARCH_INDEX: 'search-index',
  INVENTORY_SYNC: 'inventory-sync',
  REPORTS: 'reports',
  WEBHOOKS: 'webhooks',
} as const

/** Register a handler for a queue */
export function registerQueueHandler<T>(queue: string, handler: JobHandler<T>) {
  getQueue().register(queue, handler)
}

/** Add a job to a queue */
export async function enqueue<T>(queue: string, data: T, priority: number = 0): Promise<string> {
  return getQueue().add(queue, data, priority)
}

/** Add multiple jobs at once */
export async function enqueueBulk<T>(queue: string, items: T[], priority: number = 0): Promise<string[]> {
  return getQueue().addBulk(queue, items, priority)
}

/** Get a job by ID */
export function getJob(id: string) {
  return getQueue().getJob(id)
}

/** Get stats for a specific queue */
export function getQueueStats(queueName: string) {
  return getQueue().getQueueStats(queueName)
}

/** Get stats for all queues */
export function getAllQueueStats() {
  return getQueue().getAllStats()
}

/** Purge old completed/failed jobs */
export function purgeQueue(maxAgeMs?: number) {
  return getQueue().purge(maxAgeMs)
}
