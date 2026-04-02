import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchQuery } from '@/lib/security'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:email-templates' })

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
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('email_templates')
      .select('*')
      .order('category')
      .order('name')

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (search) {
      const sanitizedSearch = sanitizeSearchQuery(search)
      if (sanitizedSearch) {
        query = query.or(`name.ilike.%${sanitizedSearch}%,subject.ilike.%${sanitizedSearch}%`)
      }
    }

    const { data: templates, error } = await query

    if (error) {
      log.error('Error fetching email templates', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    log.error('Get email templates error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      name,
      slug,
      description,
      category,
      subject,
      body_html,
      body_text,
      available_variables
    } = body

    if (!name || !slug || !category || !subject || !body_html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name,
        slug,
        description,
        category,
        subject,
        body_html,
        body_text,
        available_variables: available_variables || [],
        is_active: true,
        is_system: false
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A template with this slug already exists' }, { status: 400 })
      }
      log.error('Error creating email template', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    log.error('Create email template error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
