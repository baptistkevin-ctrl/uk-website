import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

import { sanitizeText } from '@/lib/security'
import { validateData, formatZodErrors } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

const updateListSchema = z.object({
  name: z.string()
    .min(1, 'List name is required')
    .max(100, 'List name must be under 100 characters')
    .transform(val => val.trim()),
})

async function verifyMembership(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  listId: string,
  userId: string
): Promise<{ isMember: boolean; isOwner: boolean }> {
  const { data: list } = await supabaseAdmin
    .from('family_lists')
    .select('owner_id')
    .eq('id', listId)
    .single()

  if (!list) return { isMember: false, isOwner: false }

  if (list.owner_id === userId) {
    return { isMember: true, isOwner: true }
  }

  const { data: membership } = await supabaseAdmin
    .from('family_list_members')
    .select('id')
    .eq('list_id', listId)
    .eq('user_id', userId)
    .single()

  return { isMember: !!membership, isOwner: false }
}

// GET /api/family-lists/[id] — Get list details with items and members
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { isMember } = await verifyMembership(supabaseAdmin, listId, user.id)

    if (!isMember) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 })
    }

    // Fetch list, items, and members in parallel
    const [listResult, itemsResult, membersResult] = await Promise.all([
      supabaseAdmin
        .from('family_lists')
        .select('*')
        .eq('id', listId)
        .single(),
      supabaseAdmin
        .from('family_list_items')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('family_list_members')
        .select('*')
        .eq('list_id', listId),
    ])

    if (listResult.error || !listResult.data) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const list = listResult.data
    const items = (itemsResult.data || []).map(item => ({
      id: item.id,
      productId: item.product_id,
      customName: item.custom_name,
      productName: item.product_name,
      productImage: item.product_image,
      productPrice: item.product_price,
      quantity: item.quantity,
      checked: item.checked,
      addedBy: item.added_by,
      addedById: item.added_by_id,
      addedAt: item.created_at,
      note: item.note,
    }))

    // Build members list including owner
    const members = [
      {
        id: list.owner_id,
        name: list.owner_name || 'Owner',
        avatar: null,
        isOwner: true,
      },
      ...(membersResult.data || []).map(m => ({
        id: m.user_id,
        name: m.user_name || 'Member',
        avatar: m.avatar_url || null,
        isOwner: false,
      })),
    ]

    return NextResponse.json({
      list: {
        id: list.id,
        name: list.name,
        shareCode: list.share_code,
        ownerId: list.owner_id,
        ownerName: list.owner_name,
        memberCount: members.length,
        itemCount: items.length,
        createdAt: list.created_at,
        updatedAt: list.updated_at,
      },
      items,
      members,
    })
  } catch (error) {
    console.error('Family list detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/family-lists/[id] — Update list name
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateData(updateListSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { isMember } = await verifyMembership(supabaseAdmin, listId, user.id)

    if (!isMember) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 })
    }

    const { name } = validation.data
    const sanitizedName = sanitizeText(name)

    const { data: updatedList, error } = await supabaseAdmin
      .from('family_lists')
      .update({ name: sanitizedName, updated_at: new Date().toISOString() })
      .eq('id', listId)
      .select()
      .single()

    if (error) {
      console.error('Family list update error:', error)
      return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
    }

    return NextResponse.json({
      list: {
        id: updatedList.id,
        name: updatedList.name,
        shareCode: updatedList.share_code,
        ownerId: updatedList.owner_id,
        ownerName: updatedList.owner_name,
        createdAt: updatedList.created_at,
        updatedAt: updatedList.updated_at,
      },
    })
  } catch (error) {
    console.error('Family list update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/family-lists/[id] — Delete list (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { isOwner } = await verifyMembership(supabaseAdmin, listId, user.id)

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Only the list owner can delete this list' },
        { status: 403 }
      )
    }

    // Delete items, members, then the list
    await Promise.all([
      supabaseAdmin
        .from('family_list_items')
        .delete()
        .eq('list_id', listId),
      supabaseAdmin
        .from('family_list_members')
        .delete()
        .eq('list_id', listId),
    ])

    const { error } = await supabaseAdmin
      .from('family_lists')
      .delete()
      .eq('id', listId)

    if (error) {
      console.error('Family list delete error:', error)
      return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'List deleted' })
  } catch (error) {
    console.error('Family list delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
