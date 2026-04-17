import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

import { sanitizeText } from '@/lib/security'
import { validateData, formatZodErrors } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

const createListSchema = z.object({
  name: z.string()
    .min(1, 'List name is required')
    .max(100, 'List name must be under 100 characters')
    .transform(val => val.trim()),
})

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}

function isTableMissing(error: { code?: string; message?: string }): boolean {
  const msg = error.message || ''
  return (
    error.code === '42P01' ||
    msg.includes('relation') && msg.includes('does not exist')
  )
}

// GET /api/family-lists — Get user's family lists
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch lists the user owns
    const { data: ownedLists, error: ownedError } = await supabaseAdmin
      .from('family_lists')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (ownedError && isTableMissing(ownedError)) {
      return NextResponse.json({ lists: [], dbReady: false })
    }

    if (ownedError) {
      console.error('Family lists fetch error:', ownedError)
      return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
    }

    // Fetch lists the user is a member of
    const { data: memberships } = await supabaseAdmin
      .from('family_list_members')
      .select('list_id')
      .eq('user_id', user.id)

    let memberLists: typeof ownedLists = []
    if (memberships && memberships.length > 0) {
      const memberListIds = memberships.map(m => m.list_id)
      const { data } = await supabaseAdmin
        .from('family_lists')
        .select('*')
        .in('id', memberListIds)
        .neq('owner_id', user.id)
        .order('created_at', { ascending: false })
      memberLists = data || []
    }

    // Combine and enrich with counts
    const allLists = [...(ownedLists || []), ...(memberLists || [])]

    const enrichedLists = await Promise.all(
      allLists.map(async (list) => {
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

        return {
          id: list.id,
          name: list.name,
          shareCode: list.share_code,
          ownerId: list.owner_id,
          ownerName: list.owner_name || 'Unknown',
          memberCount: (memberCount || 0) + 1, // +1 for owner
          itemCount: itemCount || 0,
          createdAt: list.created_at,
          updatedAt: list.updated_at,
        }
      })
    )

    return NextResponse.json({ lists: enrichedLists })
  } catch (error) {
    console.error('Family lists API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/family-lists — Create a new family list
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateData(createListSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      )
    }

    const { name } = validation.data
    const sanitizedName = sanitizeText(name)
    const shareCode = generateShareCode()

    // Get user profile name
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const ownerName = profile?.full_name || user.email?.split('@')[0] || 'User'

    const { data: list, error } = await supabaseAdmin
      .from('family_lists')
      .insert({
        name: sanitizedName,
        share_code: shareCode,
        owner_id: user.id,
        owner_name: ownerName,
      })
      .select()
      .single()

    if (error) {
      if (isTableMissing(error)) {
        return NextResponse.json(
          { error: 'Family lists feature not available yet', dbReady: false },
          { status: 503 }
        )
      }
      console.error('Family list creation error:', error)
      return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
    }

    return NextResponse.json({
      list: {
        id: list.id,
        name: list.name,
        shareCode: list.share_code,
        ownerId: list.owner_id,
        ownerName: list.owner_name,
        memberCount: 1,
        itemCount: 0,
        createdAt: list.created_at,
        updatedAt: list.updated_at,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Family list creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
