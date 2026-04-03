import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getVendorWithProducts(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = getSupabaseAdmin()
  const { data: vendor } = await supabaseAdmin
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendor) return null

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('vendor_id', vendor.id)

  return { user, vendor, productIds: products?.map(p => p.id) || [] }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const ctx = await getVendorWithProducts(supabase)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()

    if (ctx.productIds.length === 0) {
      return NextResponse.json({ offers: [], products: [] })
    }

    const { data: offers, error } = await supabaseAdmin
      .from('multibuy_offers')
      .select(`
        *,
        product:products(id, name, slug, price_pence, image_url)
      `)
      .in('product_id', ctx.productIds)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also return vendor's products for the create form
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, price_pence, image_url')
      .eq('vendor_id', ctx.vendor.id)
      .eq('is_active', true)
      .order('name')

    return NextResponse.json({ offers: offers || [], products: products || [] })
  } catch (error) {
    console.error('Vendor offers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ctx = await getVendorWithProducts(supabase)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { product_id, quantity, offer_price_pence, badge_text, is_active, start_date, end_date } = body

    if (!product_id || !quantity || !offer_price_pence) {
      return NextResponse.json({ error: 'Product, quantity and price are required' }, { status: 400 })
    }

    // Verify product belongs to vendor
    if (!ctx.productIds.includes(product_id)) {
      return NextResponse.json({ error: 'Product not found' }, { status: 403 })
    }

    if (quantity < 2) {
      return NextResponse.json({ error: 'Quantity must be at least 2' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('multibuy_offers')
      .insert({
        product_id,
        quantity,
        offer_price_pence,
        badge_text: badge_text || null,
        is_active: is_active !== false,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select(`*, product:products(id, name, slug, price_pence, image_url)`)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update product badge
    if (is_active !== false) {
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

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ctx = await getVendorWithProducts(supabase)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 })
    }

    // Verify offer belongs to vendor's product
    const { data: existing } = await supabaseAdmin
      .from('multibuy_offers')
      .select('product_id')
      .eq('id', id)
      .single()

    if (!existing || !ctx.productIds.includes(existing.product_id!)) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const allowedFields = ['quantity', 'offer_price_pence', 'is_active', 'start_date', 'end_date', 'badge_text']
    const safeUpdates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in updates) safeUpdates[field] = updates[field]
    }

    const { data, error } = await supabaseAdmin
      .from('multibuy_offers')
      .update(safeUpdates)
      .eq('id', id)
      .select(`*, product:products(id, name, slug, price_pence, image_url)`)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update product badge
    if (existing.product_id) {
      if (safeUpdates.is_active === false) {
        const { data: otherOffers } = await supabaseAdmin
          .from('multibuy_offers')
          .select('id')
          .eq('product_id', existing.product_id)
          .eq('is_active', true)
          .neq('id', id)
          .limit(1)

        if (!otherOffers || otherOffers.length === 0) {
          await supabaseAdmin
            .from('products')
            .update({ has_offer: false, offer_badge: null })
            .eq('id', existing.product_id)
        }
      } else {
        const badgeText = (safeUpdates.badge_text as string) || `${safeUpdates.quantity || data.quantity} for £${(Number(safeUpdates.offer_price_pence || data.offer_price_pence) / 100).toFixed(2)}`
        await supabaseAdmin
          .from('products')
          .update({ has_offer: true, offer_badge: badgeText })
          .eq('id', existing.product_id)
      }
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ctx = await getVendorWithProducts(supabase)
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 })
    }

    // Verify offer belongs to vendor's product
    const { data: offer } = await supabaseAdmin
      .from('multibuy_offers')
      .select('product_id')
      .eq('id', id)
      .single()

    if (!offer || !ctx.productIds.includes(offer.product_id!)) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('multibuy_offers')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update product badge
    if (offer.product_id) {
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
  } catch (error) {
    console.error('Vendor offers DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
