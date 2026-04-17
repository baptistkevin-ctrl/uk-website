import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

import { validateData, formatZodErrors } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

const joinListSchema = z.object({
  shareCode: z.string()
    .length(6, 'Share code must be 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Share code must be uppercase alphanumeric')
    .transform(val => val.toUpperCase()),
})

// POST /api/family-lists/join — Join a list via share code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateData(joinListSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      )
    }

    const { shareCode } = validation.data
    const supabaseAdmin = getSupabaseAdmin()

    // Find the list by share code
    const { data: list, error: listError } = await supabaseAdmin
      .from('family_lists')
      .select('*')
      .eq('share_code', shareCode)
      .single()

    if (listError || !list) {
      return NextResponse.json(
        { error: 'No list found with that share code' },
        { status: 404 }
      )
    }

    // Check if user is already the owner
    if (list.owner_id === user.id) {
      return NextResponse.json(
        { error: 'You are the owner of this list' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('family_list_members')
      .select('id')
      .eq('list_id', list.id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this list' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name || user.email?.split('@')[0] || 'User'

    // Add user as member
    const { error: insertError } = await supabaseAdmin
      .from('family_list_members')
      .insert({
        list_id: list.id,
        user_id: user.id,
        user_name: userName,
        avatar_url: profile?.avatar_url || null,
      })

    if (insertError) {
      console.error('Family list join error:', insertError)
      return NextResponse.json({ error: 'Failed to join list' }, { status: 500 })
    }

    // Get counts for the response
    const [{ count: memberCount }, { count: itemCount }] = await Promise.all([
      supabaseAdmin
        .from('family_list_members')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', list.id),
      supabaseAdmin
        .from('family_list_items')
        .select('*', { count: 'exact', head: true })
        .eq('list_id', list.id),
    ])

    return NextResponse.json({
      message: 'Successfully joined the list',
      list: {
        id: list.id,
        name: list.name,
        shareCode: list.share_code,
        ownerId: list.owner_id,
        ownerName: list.owner_name,
        memberCount: (memberCount || 0) + 1,
        itemCount: itemCount || 0,
        createdAt: list.created_at,
        updatedAt: list.updated_at,
      },
    })
  } catch (error) {
    console.error('Family list join API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
