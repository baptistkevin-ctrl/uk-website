/**
 * Environment Variable Validation — Solaris Config
 *
 * Validates ALL environment variables at startup using Zod.
 * If any required variable is missing, the app fails fast
 * with a clear error message instead of crashing later.
 */

import { z } from 'zod'

const envSchema = z.object({
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1).optional(),

  // AI
  GEMINI_API_KEY: z.string().min(1).optional(),

  // Cache
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().min(1).optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),

  // Cron / Jobs
  CRON_SECRET: z.string().min(1).optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`
    )
    console.error(
      `\n❌ Invalid environment variables:\n${missing.join('\n')}\n`
    )

    // In production, fail fast. In dev/test, warn but continue
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables')
    }
  }

  // Return parsed values (with defaults applied)
  return (result.success ? result.data : process.env) as Env
}

export const env = validateEnv()
