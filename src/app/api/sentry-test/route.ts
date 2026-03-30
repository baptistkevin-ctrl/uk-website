import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    throw new Error('Sentry test error - UK Grocery Store verification')
  } catch (error) {
    Sentry.captureException(error)
    await Sentry.flush(2000)
    return NextResponse.json({ message: 'Test error sent to Sentry' })
  }
}
