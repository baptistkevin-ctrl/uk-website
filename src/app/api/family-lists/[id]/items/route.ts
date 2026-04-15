import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { checkCsrf } from '@/lib/security/csrf'
import { sanitizeText } from '@/lib/security'
import { validateData, formatZodErrors } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

const addItemSchema = z.object({
  productId: z.string().uuid().optional(),
  customName: z.string().max(200).optional(),
  quantity: z.number().int().min(1).max(99).default(1),
  note: z.string().max(500).optional(),
}).refine(
  data => data.productId || data.customName,
  { message: 'Either productId or customName is required' }
)

const removeItemSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
})

const updateItemSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
  checked: z.boolean().optional(),
  quantity: z.number().int().min(1).max(99).optional(),
}).refine(
  data => data.checked !== undefined || data.quantity !== undefined,
  { message: 'At least one field (checked or quantity) must be provided' }
)

async function verifyMembership(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  listId: string,
  userId: string
): Promise<boolean> {
  const { data: list } = await supabaseAdmin
    .from('family_lists')
    .select('owner_id')
    .eq('id', listId)
    .single()

  if (!list) return false
  if (list.owner_id === userId) return true

  const { data: membership } = await supabaseAdmin
    .from('family_list_members')
    .select('id')
    .eq('list_id', listId)
    .eq('user_id', userId)
    .single()

  return !!membership
}

// POST /api/family-lists/[id]/items — Add item to list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrf = await checkCsrf(request)
    if (!csrf.valid) return csrf.error!

    const { id: listId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateData(addItemSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const isMember = await verifyMembership(supabaseAdmin, listId, user.id)

    if (!isMember) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 })
    }

    const { productId, customName, quantity, note } = validation.data

    // Get user profile for "added by" info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name || user.email?.split('@')[0] || 'User'

    // If adding a store product, fetch its details
    let productName: string | null = null
    let productImage: string | null = null
    let productPrice: number | null = null

    if (productId) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('name, image_url, price')
        .eq('id', productId)
        .single()

      if (product) {
        productName = product.name
        productImage = product.image_url
        productPrice = product.price
      }
    }

    const sanitizedCustomName = customName ? sanitizeText(customName) : null
    const sanitizedNote = note ? sanitizeText(note) : null

    const { data: item, error } = await supabaseAdmin
      .from('family_list_items')
      .insert({
        list_id: listId,
        product_id: productId || null,
        custom_name: sanitizedCustomName,
        product_name: productName || sanitizedCustomName,
        product_image: productImage,
        product_price: productPrice,
        quantity,
        checked: false,
        added_by: userName,
        added_by_id: user.id,
        note: sanitizedNote,
      })
      .select()
      .single()

    if (error) {
      console.error('Family list item add error:', error)
      return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
    }

    // Update the list's updated_at timestamp
    await supabaseAdmin
      .from('family_lists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', listId)

    return NextResponse.json({
      item: {
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
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Family list item add API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/family-lists/[id]/items — Update item (toggle checked, change quantity)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrf = await checkCsrf(request)
    if (!csrf.valid) return csrf.error!

    const { id: listId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateData(updateItemSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const isMember = await verifyMembership(supabaseAdmin, listId, user.id)

    if (!isMember) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 })
    }

    const { itemId, checked, quantity } = validation.data

    const updatePayload: Record<string, unknown> = {}
    if (checked !== undefined) updatePayload.checked = checked
    if (quantity !== undefined) updatePayload.quantity = quantity

    const { data: updatedItem, error } = await supabaseAdmin
      .from('family_list_items')
      .update(updatePayload)
      .eq('id', itemId)
      .eq('list_id', listId)
      .select()
      .single()

    if (error) {
      console.error('Family list item update error:', error)
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
    }

    return NextResponse.json({
      item: {
        id: updatedItem.id,
        productId: updatedItem.product_id,
        customName: updatedItem.custom_name,
        productName: updatedItem.product_name,
        productImage: updatedItem.product_image,
        productPrice: updatedItem.product_price,
        quantity: updatedItem.quantity,
        checked: updatedItem.checked,
        addedBy: updatedItem.added_by,
        addedById: updatedItem.added_by_id,
        addedAt: updatedItem.created_at,
        note: updatedItem.note,
      },
    })
  } catch (error) {
    console.error('Family list item update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/family-lists/[id]/items — Remove item from list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrf = await checkCsrf(request)
    if (!csrf.valid) return csrf.error!

    const { id: listId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateData(removeItemSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const isMember = await verifyMembership(supabaseAdmin, listId, user.id)

    if (!isMember) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 })
    }

    const { itemId } = validation.data

    const { error } = await supabaseAdmin
      .from('family_list_items')
      .delete()
      .eq('id', itemId)
      .eq('list_id', listId)

    if (error) {
      console.error('Family list item delete error:', error)
      return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 })
    }

    // Update the list's updated_at timestamp
    await supabaseAdmin
      .from('family_lists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', listId)

    return NextResponse.json({ success: true, message: 'Item removed' })
  } catch (error) {
    console.error('Family list item delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
