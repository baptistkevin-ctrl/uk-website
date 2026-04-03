import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Submit vendor application
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to register as a vendor' }, { status: 401 })
    }

    const body = await request.json()
    const {
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

    // Check if user already has an application
    const { data: existingApp } = await supabaseAdmin
      .from('vendor_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (existingApp) {
      return NextResponse.json({
        error: `You already have a ${existingApp.status} application`,
        applicationId: existingApp.id
      }, { status: 400 })
    }

    // Check if user is already a vendor
    const { data: existingVendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingVendor) {
      return NextResponse.json({
        error: 'You are already registered as a vendor',
        vendorId: existingVendor.id
      }, { status: 400 })
    }

    // Create application
    const { data: application, error: appError } = await supabaseAdmin
      .from('vendor_applications')
      .insert({
        user_id: user.id,
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

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully. We will review it shortly.',
      application
    }, { status: 201 })
  } catch (error) {
    console.error('Vendor registration error:', error)
    return NextResponse.json({ error: 'Failed to process registration' }, { status: 500 })
  }
}

// Get user's application status
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
