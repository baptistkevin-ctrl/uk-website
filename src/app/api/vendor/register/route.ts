import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Submit vendor application (for already logged-in users OR new registration)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      // New registration fields (optional - only for new signups)
      email,
      password,
      full_name,
      // Vendor application fields
      business_name,
      business_type,
      description,
      product_categories,
      expected_monthly_sales,
      website_url,
      phone
    } = body

    if (!business_name) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    let userId: string

    // Check if this is a new registration (email + password provided)
    if (email && password) {
      // Validate required fields for new registration
      if (!full_name) {
        return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
      }
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }

      // Create the user account via Supabase Admin
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          full_name,
        },
      })

      if (authError) {
        if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
          return NextResponse.json({
            error: 'An account with this email already exists. Please use the login tab instead.'
          }, { status: 400 })
        }
        console.error('Auth creation error:', authError)
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      if (!authData.user) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }

      userId = authData.user.id

      // Create profile
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: userId,
        email,
        full_name,
        role: 'customer', // Will be updated to 'vendor' upon approval
        phone: phone || null,
      })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Clean up the auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(userId)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      // Send verification email via invite (triggers email confirmation)
      const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://uk-grocery-store.vercel.app'}/verify-email`,
      })

      if (emailError) {
        console.error('Verification email error:', emailError)
        // Non-critical - don't block registration
      }

      // Award signup loyalty bonus
      try {
        const { awardPoints } = await import('@/lib/automation/loyalty-points')
        await awardPoints(userId, 'signup', 100, undefined, undefined, 'Welcome bonus - new vendor account')
      } catch {
        // Non-critical
      }
    } else {
      // Existing logged-in user applying as vendor
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Please sign in or provide registration details' }, { status: 401 })
      }

      userId = user.id
    }

    // Check if user already has a vendor application
    const { data: existingApp } = await supabaseAdmin
      .from('vendor_applications')
      .select('id, status')
      .eq('user_id', userId)
      .single()

    if (existingApp) {
      return NextResponse.json({
        error: `You already have a ${existingApp.status} vendor application`,
        applicationId: existingApp.id
      }, { status: 400 })
    }

    // Check if user is already a vendor
    const { data: existingVendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingVendor) {
      return NextResponse.json({
        error: 'You are already registered as a vendor',
        vendorId: existingVendor.id
      }, { status: 400 })
    }

    // Create vendor application
    const { data: application, error: appError } = await supabaseAdmin
      .from('vendor_applications')
      .insert({
        user_id: userId,
        business_name,
        business_type: business_type || 'sole_trader',
        description,
        product_categories: product_categories || [],
        expected_monthly_sales,
        website_url,
        phone,
        status: 'pending'
      })
      .select()
      .single()

    if (appError) {
      console.error('Application error:', appError)
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }

    const isNewRegistration = !!(email && password)

    return NextResponse.json({
      success: true,
      isNewRegistration,
      message: isNewRegistration
        ? 'Account created and vendor application submitted! Please check your email to verify your account.'
        : 'Vendor application submitted successfully. We will review it shortly.',
      application
    }, { status: 201 })
  } catch (error) {
    console.error('Vendor registration error:', error)
    return NextResponse.json({ error: 'Failed to process registration' }, { status: 500 })
  }
}

// Get user's vendor/application status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Check for existing vendor
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (vendor) {
      return NextResponse.json({
        isVendor: true,
        vendor,
        application: null
      })
    }

    // Check for application
    const { data: application } = await supabaseAdmin
      .from('vendor_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      isVendor: false,
      vendor: null,
      application
    })
  } catch (error) {
    console.error('Get vendor status error:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}
