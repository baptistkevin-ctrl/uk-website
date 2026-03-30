import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const dsn = process.env.SENTRY_DSN
  const publicDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  const clientEnabled = Sentry.isInitialized()

  try {
    throw new Error('Sentry test error - UK Grocery Store verification')
  } catch (error) {
    Sentry.captureException(error)
    await Sentry.flush(5000)
    return NextResponse.json({
      message: 'Test error sent to Sentry',
      debug: {
        hasDsn: !!dsn,
        hasPublicDsn: !!publicDsn,
        dsnPrefix: dsn ? dsn.substring(0, 20) + '...' : 'NOT SET',
        sentryInitialized: clientEnabled,
        nodeEnv: process.env.NODE_ENV,
      }
    })
  }
}
