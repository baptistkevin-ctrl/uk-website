import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchQuery, sanitizeEmailHtml } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabase = await createClient()

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
      const sanitized = sanitizeSearchQuery(search)
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,subject.ilike.%${sanitized}%`)
      }
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching email templates:', error)
      return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 })
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Get email templates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabase = await createClient()

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
        body_html: sanitizeEmailHtml(body_html),
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
      console.error('Error creating email template:', error)
      return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Create email template error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
