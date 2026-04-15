import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Create Stripe Connect onboarding link
export async function POST(request: NextRequest) {
  let step = 'init'
  try {
    // Step 1: Auth
    step = 'auth'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', step }, { status: 401 })
    }

    // Step 2: Get vendor
    step = 'get_vendor'
    const supabaseAdmin = getSupabaseAdmin()
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({
        error: 'Vendor not found',
        step,
        details: vendorError?.message || 'No vendor record for this user',
      }, { status: 404 })
    }

    // Step 3: Check Stripe key
    step = 'check_stripe_key'
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        error: 'Stripe not configured',
        step,
        details: 'STRIPE_SECRET_KEY environment variable is not set',
      }, { status: 500 })
    }

    // Step 4: Import and init Stripe
    step = 'init_stripe'
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    let stripeAccountId = vendor.stripe_account_id

    // Step 5: Validate existing account or create new one
    if (stripeAccountId) {
      step = 'validate_account'
      try {
        await stripe.accounts.retrieve(stripeAccountId)
      } catch {
        // Account doesn't exist on this Stripe key - clear it and create fresh
        stripeAccountId = null
        await supabaseAdmin
          .from('vendors')
          .update({
            stripe_account_id: null,
            stripe_onboarding_complete: false,
            stripe_charges_enabled: false,
            stripe_payouts_enabled: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', vendor.id)
      }
    }

    // Step 6: Create account if doesn't exist
    if (!stripeAccountId) {
      step = 'create_account'
      const account = await stripe.accounts.create({
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
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://uk-grocery-store.com'}/store/${vendor.slug}`,
        },
        metadata: {
          vendor_id: vendor.id,
          user_id: user.id,
        },
      })

      stripeAccountId = account.id

      // Save Stripe account ID
      step = 'save_account_id'
      await supabaseAdmin
        .from('vendors')
        .update({
          stripe_account_id: stripeAccountId,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id)
    }

    // Step 7: Create onboarding link
    step = 'create_link'
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://uk-grocery-store.com'}/vendor/onboarding?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://uk-grocery-store.com'}/vendor/onboarding?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error: unknown) {
    console.error(`Stripe onboarding error at step [${step}]:`, error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      error: 'Failed to create onboarding link',
      step,
      details: message,
    }, { status: 500 })
  }
}
