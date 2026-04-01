# Background Jobs Patterns

> For CEREBRTRON (AI generation), Webcrafts (site building), and any
> heavy processing that shouldn't block the user.

---

## 1. DATABASE-BACKED JOB QUEUE

No Redis needed. Use Postgres as your job queue — it's already there.

```sql
-- supabase/migrations/XXXXXX_create_jobs_table.sql

CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue TEXT NOT NULL DEFAULT 'default',      -- "email", "ai", "reports"
  job_type TEXT NOT NULL,                     -- "send_email", "generate_site"
  payload JSONB NOT NULL,                     -- Job data
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead')),
  priority INTEGER NOT NULL DEFAULT 0,        -- Higher = processed first
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),  -- For delayed jobs
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error TEXT,                                 -- Last error message
  result JSONB,                               -- Job result (on success)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_queue_status ON background_jobs(queue, status, priority DESC, scheduled_for);
CREATE INDEX idx_jobs_scheduled ON background_jobs(scheduled_for) WHERE status = 'pending';
```

```typescript
// src/lib/jobs/job-queue.ts

interface JobDefinition {
  type: string
  payload: Record<string, unknown>
  queue?: string
  priority?: number
  delay?: string              // "5m", "1h", "1d"
  maxAttempts?: number
}

export const jobQueue = {
  // Add a job to the queue
  async enqueue(job: JobDefinition): Promise<string> {
    const scheduledFor = job.delay ? addDuration(new Date(), job.delay) : new Date()

    const { data, error } = await supabase
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

  // Pick up the next job from a queue (called by worker)
  async dequeue(queue = "default"): Promise<Job | null> {
    // Atomic: claim the job so no other worker picks it up
    const { data, error } = await supabase.rpc("claim_next_job", {
      queue_name: queue,
    })

    if (error || !data) return null
    return data
  },

  // Mark job as completed
  async complete(jobId: string, result?: unknown): Promise<void> {
    await supabase
      .from("background_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result: result || null,
      })
      .eq("id", jobId)
  },

  // Mark job as failed (will retry if attempts < maxAttempts)
  async fail(jobId: string, error: string): Promise<void> {
    const { data: job } = await supabase
      .from("background_jobs")
      .select("attempts, max_attempts")
      .eq("id", jobId)
      .single()

    const isDead = (job?.attempts || 0) >= (job?.max_attempts || 3)

    await supabase
      .from("background_jobs")
      .update({
        status: isDead ? "dead" : "pending",  // Dead = no more retries
        failed_at: new Date().toISOString(),
        error,
        // Exponential backoff for retry
        scheduled_for: isDead
          ? undefined
          : new Date(Date.now() + 1000 * Math.pow(2, job?.attempts || 0)).toISOString(),
      })
      .eq("id", jobId)

    if (isDead) {
      logger.error("Job permanently failed", { jobId, error })
    }
  },
}

// Database function to atomically claim a job:
/*
CREATE OR REPLACE FUNCTION claim_next_job(queue_name TEXT)
RETURNS background_jobs AS $$
  UPDATE background_jobs
  SET status = 'processing',
      started_at = now(),
      attempts = attempts + 1
  WHERE id = (
    SELECT id FROM background_jobs
    WHERE queue = queue_name
      AND status = 'pending'
      AND scheduled_for <= now()
    ORDER BY priority DESC, scheduled_for ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED   -- Skip jobs being claimed by other workers
  )
  RETURNING *;
$$ LANGUAGE sql;
*/
```

## 2. JOB HANDLERS (Register What Each Job Type Does)

```typescript
// src/lib/jobs/handlers.ts

type JobHandler = (payload: Record<string, unknown>) => Promise<unknown>

const handlers: Record<string, JobHandler> = {
  "send-email": async (payload) => {
    const { to, template, data } = payload as {
      to: string; template: string; data: Record<string, unknown>
    }
    await emailService.send(to, template, data)
    return { sent: true }
  },

  "generate-website": async (payload) => {
    const { siteId, prompt, style } = payload as {
      siteId: string; prompt: string; style: string
    }
    const html = await aiService.generateWebsite(prompt, style)
    await siteRepository.updateContent(siteId, html)
    await deployService.deploySite(siteId)
    return { siteId, deployed: true }
  },

  "generate-product-description": async (payload) => {
    const { productId } = payload as { productId: string }
    const product = await productRepository.findById(productId)
    const description = await aiService.generateDescription(product)
    await productRepository.update(productId, { aiDescription: description })
    return { productId, description }
  },

  "process-bulk-import": async (payload) => {
    const { fileUrl, vendorId } = payload as { fileUrl: string; vendorId: string }
    const products = await parseCSV(fileUrl)
    let imported = 0
    for (const product of products) {
      await productRepository.create({ ...product, vendorId })
      imported++
    }
    return { imported, total: products.length }
  },

  "generate-report": async (payload) => {
    const { reportType, dateRange, userId } = payload as {
      reportType: string; dateRange: { start: string; end: string }; userId: string
    }
    const data = await analyticsService.generateReport(reportType, dateRange)
    const fileUrl = await storageService.uploadReport(data)
    await notificationService.notify(userId, {
      title: "Report ready",
      body: `Your ${reportType} report is ready to download`,
      actionUrl: fileUrl,
    })
    return { fileUrl }
  },

  "payment-reminder": async (payload) => {
    const { userId, subId } = payload as { userId: string; subId: string }
    const user = await userRepository.findById(userId)
    if (!user) return
    await emailService.send(user.email, "payment-reminder", {
      updateUrl: `${env.APP_URL}/settings/billing`,
    })
  },
}

export async function processJob(job: Job): Promise<void> {
  const handler = handlers[job.jobType]
  if (!handler) {
    await jobQueue.fail(job.id, `Unknown job type: ${job.jobType}`)
    return
  }

  try {
    const result = await handler(job.payload)
    await jobQueue.complete(job.id, result)
    logger.info("Job completed", { jobId: job.id, type: job.jobType })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    await jobQueue.fail(job.id, message)
    logger.error("Job failed", { jobId: job.id, type: job.jobType, error: message })
  }
}
```

## 3. JOB WORKER (Runs Via Cron or Edge Function)

```typescript
// src/app/api/v1/jobs/process/route.ts
// Called by a cron job every 30 seconds, or by Supabase Edge Function

export async function POST(request: NextRequest) {
  // Verify this is from our cron (not a random user)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const queue = new URL(request.url).searchParams.get("queue") || "default"
  const batchSize = 5   // Process up to 5 jobs per invocation

  let processed = 0
  for (let i = 0; i < batchSize; i++) {
    const job = await jobQueue.dequeue(queue)
    if (!job) break     // No more jobs

    await processJob(job)
    processed++
  }

  return NextResponse.json({ processed, queue })
}
```

## 4. EASY SCHEDULING API

```typescript
// Usage throughout your app — schedule jobs with one line:

// Send email in background (don't make user wait)
await jobQueue.enqueue({
  type: "send-email",
  queue: "email",
  payload: { to: user.email, template: "welcome", data: { name: user.name } },
})

// Generate website asynchronously (takes 30-60 seconds)
const jobId = await jobQueue.enqueue({
  type: "generate-website",
  queue: "ai",
  priority: 10,        // Higher priority
  payload: { siteId: site.id, prompt: userPrompt, style: "modern" },
})
// Return jobId to frontend — it polls for completion

// Schedule a report for tomorrow morning
await jobQueue.enqueue({
  type: "generate-report",
  queue: "reports",
  delay: "12h",        // Run in 12 hours
  payload: { reportType: "weekly-sales", dateRange: thisWeek, userId },
})

// Payment reminder in 3 days
await jobQueue.enqueue({
  type: "payment-reminder",
  delay: "3d",
  payload: { userId, subId },
})
```

## 5. JOB STATUS TRACKING (For Frontend Progress)

```typescript
// Frontend can poll job status:
// GET /api/v1/jobs/:jobId/status

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { data: job } = await supabase
    .from("background_jobs")
    .select("id, status, result, error, created_at, completed_at")
    .eq("id", params.id)
    .single()

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    data: {
      id: job.id,
      status: job.status,
      result: job.result,
      error: job.status === "failed" ? job.error : undefined,
      durationMs: job.completed_at
        ? new Date(job.completed_at).getTime() - new Date(job.created_at).getTime()
        : null,
    },
  })
}

// Frontend polling pattern:
// const { data } = useSWR(`/api/v1/jobs/${jobId}/status`, fetcher, {
//   refreshInterval: 2000,  // Poll every 2 seconds
//   revalidateOnFocus: true,
// })
```
