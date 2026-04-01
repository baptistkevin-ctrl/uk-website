/**
 * Smart Configuration System — Solaris World-Class (#21)
 *
 * Centralized, validated, environment-aware config with Zod.
 * All app settings in one place with sensible defaults.
 */

import { z } from 'zod'

const appConfigSchema = z.object({
  app: z.object({
    name: z.string().default('UK Grocery Store'),
    url: z.string().url().default('http://localhost:3000'),
    environment: z.enum(['development', 'staging', 'production']).default('development'),
  }),
  auth: z.object({
    sessionDurationSeconds: z.number().default(3600),
    maxLoginAttempts: z.number().default(5),
    lockoutDurationMinutes: z.number().default(15),
    passwordMinLength: z.number().default(8),
  }),
  billing: z.object({
    defaultCurrency: z.literal('gbp').default('gbp'),
    commissionRate: z.number().min(0).max(1).default(0.125),
    freeDeliveryThresholdPence: z.number().default(5000),
    defaultDeliveryFeePence: z.number().default(399),
  }),
  limits: z.object({
    maxFileUploadMB: z.number().default(10),
    maxPageSize: z.number().default(200),
    defaultPageSize: z.number().default(20),
    rateLimitPerMinute: z.number().default(100),
    maxSearchLength: z.number().default(200),
  }),
  features: z.object({
    enableAI: z.boolean().default(false),
    enableRealtime: z.boolean().default(false),
    enableAnalytics: z.boolean().default(true),
    enableMaintenanceMode: z.boolean().default(false),
    enableLiveChat: z.boolean().default(true),
  }),
})

export type AppConfig = z.infer<typeof appConfigSchema>

export const config: AppConfig = appConfigSchema.parse({
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || undefined,
    url: process.env.NEXT_PUBLIC_APP_URL || undefined,
    environment: process.env.NODE_ENV || undefined,
  },
  auth: {
    maxLoginAttempts: process.env.MAX_LOGIN_ATTEMPTS ? Number(process.env.MAX_LOGIN_ATTEMPTS) : undefined,
  },
  billing: {
    commissionRate: process.env.COMMISSION_RATE ? Number(process.env.COMMISSION_RATE) : undefined,
  },
  limits: {},
  features: {
    enableAI: process.env.FEATURE_AI === 'true',
    enableRealtime: process.env.FEATURE_REALTIME === 'true',
    enableMaintenanceMode: process.env.MAINTENANCE_MODE === 'true',
  },
})
