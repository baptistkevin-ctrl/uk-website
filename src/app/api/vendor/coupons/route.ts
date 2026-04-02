import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:vendor:coupons' })

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get coupons that apply to this vendor
    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('applies_to', 'vendors')
      .contains('applicable_ids', [vendor.id])
      .order('created_at', { ascending: false })

    if (error) {
      // If the query fails, try fetching all vendor coupons differently
      const { data: allCoupons } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

      const vendorCoupons = allCoupons?.filter(c =>
        c.applies_to === 'vendors' && c.applicable_ids?.includes(vendor.id)
      ) || []

      return NextResponse.json({ coupons: vendorCoupons })
    }

    return NextResponse.json({ coupons: coupons || [] })
  } catch (error) {
    log.error('Vendor coupons error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id, store_name')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_pence,
      max_discount_pence,
      usage_limit,
      per_user_limit,
      starts_at,
      expires_at,
      exclude_sale_items,
      first_order_only,
    } = body

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ error: 'Code, discount type, and value are required' }, { status: 400 })
    }

    // Check code uniqueness
    const { data: existing } = await supabaseAdmin
      .from('coupons')
      .select('id')
      .eq('code', code.toUpperCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
    }

    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        description: description || `${vendor.store_name} coupon`,
        discount_type,
        discount_value: parseFloat(discount_value),
        min_order_pence: min_order_pence || 0,
        max_discount_pence: max_discount_pence || null,
        usage_limit: usage_limit || null,
        per_user_limit: per_user_limit || 1,
        vendor_id: vendor.id,
        applies_to: 'vendors',
        applicable_ids: [vendor.id],
        exclude_sale_items: exclude_sale_items || false,
        first_order_only: first_order_only || false,
        starts_at: starts_at || new Date().toISOString(),
        expires_at: expires_at || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      log.error('Create coupon error', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    log.error('Vendor coupon create error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 })
    }

    // Verify coupon belongs to vendor
    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single()

    if (!coupon || !coupon.applicable_ids?.includes(vendor.id)) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
    }

    return NextResponse.json({ coupon: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 })
    }

    // Verify ownership
    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('applicable_ids')
      .eq('id', id)
      .single()

    if (!coupon || !coupon.applicable_ids?.includes(vendor.id)) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    await supabaseAdmin.from('coupons').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}
