import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:gift-cards' })

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Build query
    let query = supabase
      .from('gift_cards')
      .select('*')
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: giftCards, error } = await query

    if (error) {
      log.error('Error fetching gift cards', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch gift cards' }, { status: 500 })
    }

    // Calculate stats
    const allCards = giftCards || []
    const stats = {
      total_cards: allCards.length,
      total_value_pence: allCards.reduce((sum, card) => sum + (card.initial_value_pence || 0), 0),
      total_redeemed_pence: allCards.reduce((sum, card) => {
        const initial = card.initial_value_pence || 0
        const current = card.current_balance_pence || 0
        return sum + (initial - current)
      }, 0),
      active_cards: allCards.filter(card => card.status === 'active').length
    }

    return NextResponse.json({ giftCards: allCards, stats })
  } catch (error) {
    log.error('Get gift cards error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
