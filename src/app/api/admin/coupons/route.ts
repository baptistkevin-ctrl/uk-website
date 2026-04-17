import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { couponAudit } from '@/lib/security/audit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabase = getSupabaseAdmin()

    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
    const status = searchParams.get('status') // active, expired, all
    const offset = (page - 1) * limit

    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status === 'active') {
      query = query
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    } else if (status === 'expired') {
      query = query.lt('expires_at', new Date().toISOString())
    }

    const { data: coupons, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      coupons,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabase = getSupabaseAdmin()

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
      applies_to,
      applicable_ids,
      exclude_sale_items,
      first_order_only,
      starts_at,
      expires_at,
      is_active,
    } = body

    // Validate required fields
    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json({ error: 'Code, discount type, and value are required' }, { status: 400 })
    }

    // Validate discount value
    if (typeof discount_value !== 'number' || discount_value <= 0) {
      return NextResponse.json({ error: 'Discount value must be a positive number' }, { status: 400 })
    }

    if (discount_type === 'percentage' && discount_value > 100) {
      return NextResponse.json({ error: 'Percentage discount cannot exceed 100%' }, { status: 400 })
    }

    if (!['percentage', 'fixed', 'fixed_amount', 'free_shipping'].includes(discount_type)) {
      return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 })
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', code.toUpperCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        description,
        discount_type,
        discount_value,
        min_order_pence: min_order_pence || 0,
        max_discount_pence,
        usage_limit,
        per_user_limit: per_user_limit || 1,
        applies_to: applies_to || 'all',
        applicable_ids,
        exclude_sale_items: exclude_sale_items || false,
        first_order_only: first_order_only || false,
        starts_at: starts_at || new Date().toISOString(),
        expires_at,
        is_active: is_active !== false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await couponAudit.logCreate(
      request,
      { id: auth.user!.id, email: auth.profile!.email || '', role: auth.profile!.role || 'admin' },
      coupon.id,
      coupon.code,
      { discount_type: coupon.discount_type, discount_value: coupon.discount_value, expires_at: coupon.expires_at }
    )

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}
