import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { dealAudit } from '@/lib/security/audit'

export const dynamic = 'force-dynamic'

// GET - Get all deals (admin view)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') || 'all' // all, active, upcoming, expired
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
  const offset = (page - 1) * limit

  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  let query = supabase
    .from('flash_deals')
    .select(`
      *,
      products:product_id (
        id,
        name,
        slug,
        image_url,
        price_pence
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  switch (status) {
    case 'active':
      query = query.eq('is_active', true).lte('starts_at', now).gte('ends_at', now)
      break
    case 'upcoming':
      query = query.gt('starts_at', now)
      break
    case 'expired':
      query = query.lt('ends_at', now)
      break
  }

  const { data: deals, error, count } = await query
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Admin deals fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }

  return NextResponse.json({
    deals,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  })
}

// POST - Create a new deal
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const body = await request.json()
  const {
    title,
    description,
    product_id,
    deal_price_pence,
    starts_at,
    ends_at,
    max_quantity,
    is_featured,
    banner_image_url,
  } = body

  if (!title || !product_id || !deal_price_pence || !starts_at || !ends_at) {
    return NextResponse.json(
      { error: 'Title, product, price, and dates are required' },
      { status: 400 }
    )
  }

  const supabaseAdmin = getSupabaseAdmin()

  // Get original price
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('price_pence')
    .eq('id', product_id)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Generate slug
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') +
    '-' +
    Date.now().toString(36)

  const { data: deal, error } = await supabaseAdmin
    .from('flash_deals')
    .insert({
      title,
      slug,
      description: description || null,
      product_id,
      deal_price_pence,
      original_price_pence: product.price_pence,
      starts_at,
      ends_at,
      max_quantity: max_quantity || null,
      is_featured: is_featured || false,
      banner_image_url: banner_image_url || null,
    })
    .select(`
      *,
      products:product_id (
        id,
        name,
        slug,
        image_url
      )
    `)
    .single()

  if (error) {
    console.error('Deal creation error:', error)
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
  }

  await dealAudit.logCreate(request, { id: auth.user!.id, email: auth.profile!.email, role: auth.profile!.role }, deal.id, deal.title, {
    product_id: deal.product_id,
    deal_price_pence: deal.deal_price_pence,
    starts_at: deal.starts_at,
    ends_at: deal.ends_at,
  })

  return NextResponse.json({ deal })
}

// PUT - Update a deal
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // If product_id changed, update original price
  if (updates.product_id) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('price_pence')
      .eq('id', updates.product_id)
      .single()

    if (product) {
      updates.original_price_pence = product.price_pence
    }
  }

  // Fetch old values for audit
  const { data: oldDeal } = await supabaseAdmin
    .from('flash_deals')
    .select('*')
    .eq('id', id)
    .single()

  const { data: deal, error } = await supabaseAdmin
    .from('flash_deals')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      products:product_id (
        id,
        name,
        slug,
        image_url
      )
    `)
    .single()

  if (error) {
    console.error('Deal update error:', error)
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
  }

  await dealAudit.logUpdate(request, { id: auth.user!.id, email: auth.profile!.email, role: auth.profile!.role }, id, deal.title, oldDeal || {}, updates)

  return NextResponse.json({ deal })
}

// DELETE - Delete a deal
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { error } = await supabaseAdmin
    .from('flash_deals')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Deal deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 })
  }

  await dealAudit.logDelete(request, { id: auth.user!.id, email: auth.profile!.email, role: auth.profile!.role }, id, `deal:${id}`)

  return NextResponse.json({ success: true })
}
