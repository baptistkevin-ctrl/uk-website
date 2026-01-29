import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { code, subtotal_pence } = body

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    // Call the validate_coupon function
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: code.toUpperCase(),
      p_user_id: user?.id || null,
      p_subtotal_pence: subtotal_pence || 0,
    })

    if (error) {
      console.error('Coupon validation error:', error)
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
    console.error('Coupon validation error:', error)
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
  }
}
