import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// Create Stripe Connect account for vendor
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

    // Check if already has Stripe account
    if (vendor.stripe_account_id) {
      return NextResponse.json({
        error: 'Stripe account already exists',
        accountId: vendor.stripe_account_id
      }, { status: 400 })
    }

    // Create Stripe Connect Express account
    const account = await getStripe().accounts.create({
      type: 'express',
      country: 'GB',
      email: vendor.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        name: vendor.business_name,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/store/${vendor.slug}`,
      },
      metadata: {
        vendor_id: vendor.id,
        user_id: user.id,
      },
    })

    // Save Stripe account ID to vendor
    await supabaseAdmin
      .from('vendors')
      .update({
        stripe_account_id: account.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendor.id)

    return NextResponse.json({
      success: true,
      accountId: account.id
    })
  } catch (error) {
    console.error('Stripe Connect error:', error)
    return NextResponse.json({
      error: 'Failed to create Stripe account'
    }, { status: 500 })
  }
}

// Get Stripe Connect account status
export async function GET(request: NextRequest) {
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
      return NextResponse.json({
        hasAccount: false,
        onboardingComplete: false
      })
    }

    // Get account details from Stripe
    const account = await getStripe().accounts.retrieve(vendor.stripe_account_id)

    // Update vendor record with latest status
    const chargesEnabled = account.charges_enabled
    const payoutsEnabled = account.payouts_enabled
    const detailsSubmitted = account.details_submitted

    await supabaseAdmin
      .from('vendors')
      .update({
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: payoutsEnabled,
        stripe_onboarding_complete: detailsSubmitted && chargesEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendor.id)

    return NextResponse.json({
      hasAccount: true,
      accountId: vendor.stripe_account_id,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      onboardingComplete: detailsSubmitted && chargesEnabled,
    })
  } catch (error) {
    console.error('Stripe account status error:', error)
    return NextResponse.json({
      error: 'Failed to get account status'
    }, { status: 500 })
  }
}
