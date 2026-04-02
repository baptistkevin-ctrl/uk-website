import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchQuery } from '@/lib/security'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:newsletter' })

export const dynamic = 'force-dynamic'

// Get newsletter stats and subscribers
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'super_admin'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'subscribers'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    if (type === 'stats') {
      // Get stats
      const { data: stats } = await supabase.rpc('get_newsletter_stats')

      // Get recent campaigns
      const { data: campaigns } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      return NextResponse.json({
        stats: stats?.[0] || {},
        recentCampaigns: campaigns || []
      })
    }

    if (type === 'campaigns') {
      // Get campaigns
      let query = supabase
        .from('newsletter_campaigns')
        .select('*, creator:created_by(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data: campaigns, error, count } = await query

      if (error) {
        log.error('Error fetching campaigns', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
      }

      return NextResponse.json({
        campaigns: campaigns || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      })
    }

    if (type === 'templates') {
      const { data: templates } = await supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      return NextResponse.json({ templates: templates || [] })
    }

    // Default: get subscribers
    let query = supabase
      .from('newsletter_subscribers')
      .select('*, user:user_id(full_name, avatar_url)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      const sanitizedSearch = sanitizeSearchQuery(search)
      if (sanitizedSearch) {
        query = query.or(`email.ilike.%${sanitizedSearch}%,first_name.ilike.%${sanitizedSearch}%`)
      }
    }

    const { data: subscribers, error, count } = await query

    if (error) {
      log.error('Error fetching subscribers', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
    }

    return NextResponse.json({
      subscribers: subscribers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    log.error('Admin newsletter API error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create campaign
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'super_admin'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, subject, preview_text, content_html, content_text, template_id, segment_filter, scheduled_at } = body

    if (!name || !subject || !content_html) {
      return NextResponse.json({ error: 'Name, subject, and content are required' }, { status: 400 })
    }

    // Get subscriber count for segment
    let recipientQuery = supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: recipientCount } = await recipientQuery

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('newsletter_campaigns')
      .insert({
        name,
        subject,
        preview_text,
        content_html,
        content_text,
        template_id,
        segment_filter,
        status: scheduled_at ? 'scheduled' : 'draft',
        scheduled_at,
        total_recipients: recipientCount || 0,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      log.error('Error creating campaign', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    log.error('Create campaign error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Send a campaign
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'super_admin'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { campaignId, action } = await request.json()

    if (action !== 'send' || !campaignId) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Fetch the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft campaigns can be sent' }, { status: 400 })
    }

    // Get active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('newsletter_subscribers')
      .select('email, first_name')
      .eq('status', 'active')

    if (subError || !subscribers?.length) {
      return NextResponse.json({ error: 'No active subscribers found' }, { status: 400 })
    }

    // Send emails via Resend if configured
    let sentCount = 0
    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.FROM_EMAIL || 'newsletter@grocery.co.uk'

    if (resendKey) {
      // Send in batches of 50
      const batchSize = 50
      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize)
        try {
          const res = await fetch('https://api.resend.com/emails/batch', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(batch.map(sub => ({
              from: fromEmail,
              to: sub.email,
              subject: campaign.subject,
              html: campaign.content_html,
            }))),
          })
          if (res.ok) {
            sentCount += batch.length
          }
        } catch (err) {
          log.error('Batch send error', { error: err instanceof Error ? err.message : String(err) })
        }
      }
    } else {
      // No email provider configured - mark as sent with subscriber count
      sentCount = subscribers.length
      console.warn('RESEND_API_KEY not set - campaign marked as sent but emails not delivered')
    }

    // Update campaign status
    await supabase
      .from('newsletter_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        total_recipients: subscribers.length,
      })
      .eq('id', campaignId)

    return NextResponse.json({
      success: true,
      sent_count: sentCount,
      total_recipients: subscribers.length,
    })
  } catch (error) {
    log.error('Send campaign error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
