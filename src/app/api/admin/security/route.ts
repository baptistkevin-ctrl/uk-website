import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { getSecurityDashboard, getRecentEvents, checkAlertThresholds } from '@/lib/security'

export const dynamic = 'force-dynamic'

// GET security dashboard data
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') || 'dashboard'

  switch (view) {
    case 'dashboard':
      return NextResponse.json(getSecurityDashboard())

    case 'events':
      const count = parseInt(searchParams.get('count') || '50')
      const type = searchParams.get('type') as string | undefined
      return NextResponse.json({
        events: getRecentEvents(count, type as Parameters<typeof getRecentEvents>[1])
      })

    case 'alerts':
      return NextResponse.json(checkAlertThresholds())

    default:
      return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 })
  }
}
