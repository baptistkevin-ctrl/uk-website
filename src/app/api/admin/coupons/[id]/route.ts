import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { apiSuccess, apiCatchAll } from '@/lib/utils/api-error'

const log = logger.child({ context: 'admin:coupons:id' })

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabase = await createClient()

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !coupon) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Coupon not found' } },
        { status: 404 }
      )
    }

    // Get usage statistics
    const { count: usageCount } = await supabase
      .from('coupon_usage')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', id)

    return apiSuccess({
      ...coupon,
      total_usage: usageCount || 0,
    })
  } catch (error) {
    return apiCatchAll(error, 'admin:coupons:id:get')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if code already exists (excluding current coupon)
    if (code) {
      const { data: existing } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', code.toUpperCase())
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Coupon code already exists' } },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (code !== undefined) updateData.code = code.toUpperCase()
    if (description !== undefined) updateData.description = description
    if (discount_type !== undefined) updateData.discount_type = discount_type
    if (discount_value !== undefined) updateData.discount_value = discount_value
    if (min_order_pence !== undefined) updateData.min_order_pence = min_order_pence
    if (max_discount_pence !== undefined) updateData.max_discount_pence = max_discount_pence
    if (usage_limit !== undefined) updateData.usage_limit = usage_limit
    if (per_user_limit !== undefined) updateData.per_user_limit = per_user_limit
    if (applies_to !== undefined) updateData.applies_to = applies_to
    if (applicable_ids !== undefined) updateData.applicable_ids = applicable_ids
    if (exclude_sale_items !== undefined) updateData.exclude_sale_items = exclude_sale_items
    if (first_order_only !== undefined) updateData.first_order_only = first_order_only
    if (starts_at !== undefined) updateData.starts_at = starts_at
    if (expires_at !== undefined) updateData.expires_at = expires_at
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: coupon, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      log.error('Failed to update coupon', { error: error.message, couponId: id })
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to update coupon' } },
        { status: 500 }
      )
    }

    log.info('Coupon updated', { couponId: id, admin: auth.user!.id })
    return apiSuccess({ coupon })
  } catch (error) {
    return apiCatchAll(error, 'admin:coupons:id:put')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const supabase = await createClient()

    // Check if coupon has been used
    const { count: usageCount } = await supabase
      .from('coupon_usage')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', id)

    if (usageCount && usageCount > 0) {
      // Instead of deleting, deactivate the coupon
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        log.error('Failed to deactivate coupon', { error: error.message, couponId: id })
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Failed to deactivate coupon' } },
          { status: 500 }
        )
      }

      log.info('Coupon deactivated (has usage)', { couponId: id, usageCount, admin: auth.user!.id })
      return apiSuccess({
        message: 'Coupon has been used and cannot be deleted. It has been deactivated instead.',
        deactivated: true,
      })
    }

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) {
      log.error('Failed to delete coupon', { error: error.message, couponId: id })
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete coupon' } },
        { status: 500 }
      )
    }

    log.info('Coupon deleted', { couponId: id, admin: auth.user!.id })
    return apiSuccess({ message: 'Coupon deleted successfully' })
  } catch (error) {
    return apiCatchAll(error, 'admin:coupons:id:delete')
  }
}
