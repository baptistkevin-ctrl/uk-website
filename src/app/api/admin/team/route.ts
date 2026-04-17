import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, requireSuperAdmin } from '@/lib/auth/verify'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

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
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
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
    const auth = await requireSuperAdmin(request)
    if (!auth.success) return auth.error

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
        invited_by: auth.user!.id,
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
