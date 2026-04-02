import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitConfigs } from '@/lib/security/rate-limit'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'api:coupons:validate' })

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const rateLimitResult = checkRateLimit(request, rateLimitConfigs.couponValidate)
  if (!rateLimitResult.success) {
    return rateLimitResult.error!
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { code, subtotal_pence } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    // Validate coupon code format: alphanumeric, hyphens, underscores only, max 50 chars
    if (code.length > 50 || !/^[A-Za-z0-9_-]+$/.test(code)) {
      return NextResponse.json({ error: 'Invalid coupon code format' }, { status: 400 })
    }

    // Validate subtotal_pence if provided
    if (subtotal_pence !== undefined && subtotal_pence !== null) {
      if (typeof subtotal_pence !== 'number' || !Number.isFinite(subtotal_pence) || subtotal_pence < 0) {
        return NextResponse.json({ error: 'Invalid subtotal amount' }, { status: 400 })
      }
    }

    // Call the validate_coupon function
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: code.toUpperCase(),
      p_user_id: user?.id || null,
      p_subtotal_pence: subtotal_pence || 0,
    })

    if (error) {
      log.error('Coupon validation error', { error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
    }

    const result = data?.[0]

    if (!result?.valid) {
      return NextResponse.json({
        valid: false,
        error: result?.error_message || 'Invalid coupon',
      })
    }

    // Get coupon details for display
    const { data: coupon } = await supabase
      .from('coupons')
      .select('code, description, discount_type, discount_value')
      .eq('id', result.coupon_id)
      .single()

    return NextResponse.json({
      valid: true,
      coupon_id: result.coupon_id,
      discount_type: result.discount_type,
      discount_value: result.discount_value,
      discount_pence: result.discount_pence,
      code: coupon?.code,
      description: coupon?.description,
    })
  } catch (error) {
    log.error('Coupon validation error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
  }
}
