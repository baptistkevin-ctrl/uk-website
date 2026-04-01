-- Background Jobs Queue — Solaris Standard
-- Database-backed job queue using PostgreSQL (no Redis needed)

CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue TEXT NOT NULL DEFAULT 'default',
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead')),
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient job claiming
CREATE INDEX IF NOT EXISTS idx_jobs_queue_status
  ON background_jobs(queue, status, priority DESC, scheduled_for);

-- Index for scheduled jobs
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled
  ON background_jobs(scheduled_for) WHERE status = 'pending';

-- Atomic job claiming function (prevents double-processing)
CREATE OR REPLACE FUNCTION claim_next_job(queue_name TEXT)
RETURNS background_jobs AS $$
  UPDATE background_jobs
  SET status = 'processing',
      started_at = now(),
      attempts = attempts + 1,
      updated_at = now()
  WHERE id = (
    SELECT id FROM background_jobs
    WHERE queue = queue_name
      AND status = 'pending'
      AND scheduled_for <= now()
    ORDER BY priority DESC, scheduled_for ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$ LANGUAGE sql;
