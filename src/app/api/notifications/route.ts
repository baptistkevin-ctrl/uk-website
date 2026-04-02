import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:notifications' })

export const dynamic = 'force-dynamic'

// Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error, count } = await query

    if (error) {
      log.error('Error fetching notifications', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    log.error('Notifications API error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notification_ids, mark_all } = body

    if (mark_all) {
      // Mark all as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        log.error('Error marking all as read', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
      }
    } else if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .in('id', notification_ids)
        .eq('is_read', false)

      if (error) {
        log.error('Error marking notifications as read', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Mark notifications error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const clearAll = searchParams.get('clear_all') === 'true'

    if (clearAll) {
      // Delete all read notifications
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true)

      if (error) {
        log.error('Error clearing notifications', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 })
      }
    } else if (notificationId) {
      // Delete specific notification
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('id', notificationId)

      if (error) {
        log.error('Error deleting notification', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Delete notifications error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
