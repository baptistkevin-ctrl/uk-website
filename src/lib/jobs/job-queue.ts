import { getSupabaseAdmin } from "@/lib/supabase/server"
import { logger } from "@/lib/utils/logger"

interface JobDefinition {
  type: string
  payload: Record<string, unknown>
  queue?: string
  priority?: number
  delay?: string              // "5m", "1h", "1d"
  maxAttempts?: number
}

interface Job {
  id: string
  queue: string
  job_type: string
  payload: Record<string, unknown>
  status: string
  priority: number
  attempts: number
  max_attempts: number
  scheduled_for: string
  started_at: string | null
  completed_at: string | null
  failed_at: string | null
  error: string | null
  result: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

function addDuration(date: Date, duration: string): Date {
  const result = new Date(date)
  const match = duration.match(/^(\d+)(m|h|d)$/)
  if (!match) return result

  const [, amount, unit] = match
  const num = parseInt(amount, 10)

  switch (unit) {
    case "m": result.setMinutes(result.getMinutes() + num); break
    case "h": result.setHours(result.getHours() + num); break
    case "d": result.setDate(result.getDate() + num); break
  }
  return result
}

export const jobQueue = {
  async enqueue(job: JobDefinition): Promise<string> {
    const scheduledFor = job.delay ? addDuration(new Date(), job.delay) : new Date()

    const { data, error } = await getSupabaseAdmin()
      .from("background_jobs")
      .insert({
        queue: job.queue || "default",
        job_type: job.type,
        payload: job.payload,
        priority: job.priority || 0,
        max_attempts: job.maxAttempts || 3,
        scheduled_for: scheduledFor.toISOString(),
      })
      .select("id")
      .single()

    if (error) throw error

    logger.info("Job enqueued", { jobId: data.id, type: job.type, queue: job.queue })
    return data.id
  },

  async dequeue(queue = "default"): Promise<Job | null> {
    const { data, error } = await getSupabaseAdmin().rpc("claim_next_job", {
      queue_name: queue,
    })

    if (error || !data) return null
    // The RPC returns a JSON object matching the Job shape; double-cast is needed
    // because Supabase types the RPC return as `unknown`. The Job fields are
    // validated downstream when accessed.
    return data as unknown as Job
  },

  async complete(jobId: string, result?: unknown): Promise<void> {
    const { error } = await getSupabaseAdmin()
      .from("background_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result: result || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    if (error) {
      logger.error("Failed to mark job as completed", { jobId, error: error.message })
    }
  },

  async fail(jobId: string, errorMessage: string): Promise<void> {
    const { data: job } = await getSupabaseAdmin()
      .from("background_jobs")
      .select("attempts, max_attempts")
      .eq("id", jobId)
      .single()

    const isDead = (job?.attempts || 0) >= (job?.max_attempts || 3)

    const MAX_BACKOFF_MS = 3_600_000 // 1 hour cap
    const backoffMs = Math.min(1000 * Math.pow(2, job?.attempts || 0), MAX_BACKOFF_MS)

    const { error: updateError } = await getSupabaseAdmin()
      .from("background_jobs")
      .update({
        status: isDead ? "dead" : "pending",
        failed_at: new Date().toISOString(),
        error: errorMessage,
        updated_at: new Date().toISOString(),
        ...(isDead
          ? {}
          : {
              scheduled_for: new Date(
                Date.now() + backoffMs
              ).toISOString(),
            }),
      })
      .eq("id", jobId)

    if (updateError) {
      logger.error("Failed to update job failure status", { jobId, error: updateError.message })
    }

    if (isDead) {
      logger.error("Job permanently failed", { jobId, error: errorMessage })
    }
  },

  async getStatus(jobId: string): Promise<Job | null> {
    const { data, error } = await getSupabaseAdmin()
      .from("background_jobs")
      .select("*")
      .eq("id", jobId)
      .single()

    if (error) return null
    return data as Job
  },
}

export type { Job, JobDefinition }
