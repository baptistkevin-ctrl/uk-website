import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// Create Stripe Express Dashboard login link
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get vendor profile
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    if (!vendor.stripe_account_id) {
      return NextResponse.json({ error: 'No Stripe account connected' }, { status: 400 })
    }

    // Create login link for Express dashboard
    const loginLink = await getStripe().accounts.createLoginLink(vendor.stripe_account_id)

    return NextResponse.json({
      url: loginLink.url
    })
  } catch (error) {
    console.error('Stripe dashboard error:', error)
    return NextResponse.json({
      error: 'Failed to create dashboard link'
    }, { status: 500 })
  }
}
