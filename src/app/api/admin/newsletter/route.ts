import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
        console.error('Error fetching campaigns:', error)
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
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%`)
    }

    const { data: subscribers, error, count } = await query

    if (error) {
      console.error('Error fetching subscribers:', error)
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
    console.error('Admin newsletter API error:', error)
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
      console.error('Error creating campaign:', error)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    return NextResponse.json({ success: true, campaign })
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
