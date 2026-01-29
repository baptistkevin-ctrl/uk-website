import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Create Stripe Connect onboarding link
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

    let stripeAccountId = vendor.stripe_account_id

    // Create account if doesn't exist
    if (!stripeAccountId) {
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

      stripeAccountId = account.id

      // Save Stripe account ID
      await supabaseAdmin
        .from('vendors')
        .update({
          stripe_account_id: stripeAccountId,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id)
    }

    // Create onboarding link
    const accountLink = await getStripe().accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/onboarding?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/onboarding?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      url: accountLink.url
    })
  } catch (error) {
    console.error('Stripe onboarding error:', error)
    return NextResponse.json({
      error: 'Failed to create onboarding link'
    }, { status: 500 })
  }
}
