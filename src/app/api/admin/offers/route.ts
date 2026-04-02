import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:admin:offers' })

export const dynamic = 'force-dynamic'

// GET all multi-buy offers (paginated)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('multibuy_offers')
    .select(`
      *,
      product:products(id, name, slug, price_pence, image_url),
      category:categories(id, name, slug)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (activeOnly) {
    query = query
      .eq('is_active', true)
      .or('start_date.is.null,start_date.lte.now()')
      .or('end_date.is.null,end_date.gte.now()')
  }

  const { data, error, count } = await query

  if (error) {
    log.error('Error fetching offers', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
  }

  const total = count ?? 0
  return NextResponse.json({
    data: data ?? [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// POST - Create new offer
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { product_id, category_id, quantity, offer_price_pence, is_active, start_date, end_date, badge_text } = body

    if (!quantity || !offer_price_pence) {
      return NextResponse.json(
        { error: 'Quantity and offer price are required' },
        { status: 400 }
      )
    }

    if (!product_id && !category_id) {
      return NextResponse.json(
        { error: 'Either product or category must be selected' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('multibuy_offers')
      .insert({
        product_id: product_id || null,
        category_id: category_id || null,
        quantity,
        offer_price_pence,
        is_active: is_active !== false,
        start_date: start_date || null,
        end_date: end_date || null,
        badge_text: badge_text || null,
      })
      .select()
      .single()

    if (error) {
      log.error('Error creating offer', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
    }

    // Update product's offer badge if product-specific offer
    if (product_id && is_active !== false) {
      const badgeText = badge_text || `${quantity} for £${(offer_price_pence / 100).toFixed(2)}`
      await supabaseAdmin
        .from('products')
        .update({ has_offer: true, offer_badge: badgeText })
        .eq('id', product_id)
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// PUT - Update offer
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 })
    }

    const allowedFields = ['product_id', 'category_id', 'quantity', 'offer_price_pence', 'is_active', 'start_date', 'end_date', 'badge_text']
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field]
    }

    // Get old offer to check if product changed
    const { data: oldOffer } = await supabaseAdmin
      .from('multibuy_offers')
      .select('product_id')
      .eq('id', id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('multibuy_offers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      log.error('Error updating offer', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 })
    }

    // Update product offer badges
    if (oldOffer?.product_id && oldOffer.product_id !== updates.product_id) {
      // Remove badge from old product
      await supabaseAdmin
        .from('products')
        .update({ has_offer: false, offer_badge: null })
        .eq('id', oldOffer.product_id)
    }

    if (updates.product_id && updates.is_active !== false) {
      const badgeText = updates.badge_text || `${updates.quantity} for £${(Number(updates.offer_price_pence) / 100).toFixed(2)}`
      await supabaseAdmin
        .from('products')
        .update({ has_offer: true, offer_badge: badgeText })
        .eq('id', updates.product_id)
    } else if (updates.product_id && updates.is_active === false) {
      await supabaseAdmin
        .from('products')
        .update({ has_offer: false, offer_badge: null })
        .eq('id', updates.product_id)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE - Delete offer
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 })
  }

  // Get offer to update product
  const { data: offer } = await supabaseAdmin
    .from('multibuy_offers')
    .select('product_id')
    .eq('id', id)
    .single()

  const { error } = await supabaseAdmin
    .from('multibuy_offers')
    .delete()
    .eq('id', id)

  if (error) {
    log.error('Error deleting offer', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 })
  }

  // Remove badge from product
  if (offer?.product_id) {
    // Check if product has other active offers
    const { data: otherOffers } = await supabaseAdmin
      .from('multibuy_offers')
      .select('id')
      .eq('product_id', offer.product_id)
      .eq('is_active', true)
      .limit(1)

    if (!otherOffers || otherOffers.length === 0) {
      await supabaseAdmin
        .from('products')
        .update({ has_offer: false, offer_badge: null })
        .eq('id', offer.product_id)
    }
  }

  return NextResponse.json({ success: true })
}
