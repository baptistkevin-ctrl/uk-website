import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { apiSuccess, apiCreated, apiCatchAll } from '@/lib/utils/api-error'

const log = logger.child({ context: 'admin:coupons' })

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabase = await createClient()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
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
      log.error('Failed to fetch coupons', { error: error.message, status })
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch coupons' } },
        { status: 500 }
      )
    }

    return apiSuccess(
      { coupons },
      {
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      }
    )
  } catch (error) {
    return apiCatchAll(error, 'admin:coupons:get')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabase = await createClient()

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
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Code, discount type, and value are required' } },
        { status: 400 }
      )
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', code.toUpperCase())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Coupon code already exists' } },
        { status: 400 }
      )
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
      log.error('Failed to create coupon', { error: error.message, code })
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create coupon' } },
        { status: 500 }
      )
    }

    log.info('Coupon created', { couponId: coupon.id, code: coupon.code, admin: auth.user!.id })
    return apiCreated({ coupon })
  } catch (error) {
    return apiCatchAll(error, 'admin:coupons:post')
  }
}
