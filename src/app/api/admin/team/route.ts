import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { sanitizeSearchQuery } from '@/lib/security'

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
    const status = searchParams.get('status')
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    const admin = getSupabaseAdmin()

    // Build query using admin client to bypass RLS
    let query = admin
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }
    if (search) {
      const sanitizedSearch = sanitizeSearchQuery(search)
      if (sanitizedSearch) {
        query = query.or(`first_name.ilike.%${sanitizedSearch}%,last_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`)
      }
    }

    const { data: members, error } = await query

    if (error) {
      // If table doesn't exist, return empty array instead of 500
      if (error.code === 'PGRST205' || error.message?.includes('team_members')) {
        return NextResponse.json({ members: [] })
      }
      console.error('Error fetching team members:', error)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    return NextResponse.json({ members: members || [] })
  } catch (error) {
    console.error('Get team members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify super_admin only
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can add team members' }, { status: 403 })
    }

    const body = await request.json()
    const {
      first_name,
      last_name,
      email,
      phone,
      role,
      department,
      job_title,
      permissions
    } = body

    if (!first_name || !last_name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate invitation token
    const invitation_token = crypto.randomUUID()
    const invitation_expires_at = new Date()
    invitation_expires_at.setDate(invitation_expires_at.getDate() + 7) // 7 days expiry

    const admin = getSupabaseAdmin()

    const { data: member, error } = await admin
      .from('team_members')
      .insert({
        first_name,
        last_name,
        email,
        phone,
        role,
        department,
        job_title,
        permissions,
        status: 'pending',
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        invitation_token,
        invitation_expires_at: invitation_expires_at.toISOString()
      })
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('team_members')) {
        return NextResponse.json({ error: 'Team members table not set up yet. Please run the migration in Supabase Dashboard.' }, { status: 500 })
      }
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A team member with this email already exists' }, { status: 400 })
      }
      console.error('Error creating team member:', error)
      return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
    }

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Create team member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
