import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Get vendor
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Update vendor settings
    const { data, error } = await supabaseAdmin
      .from('vendors')
      .update({
        business_name: body.business_name,
        description: body.description,
        email: body.email,
        phone: body.phone,
        address_line_1: body.address_line_1,
        address_line_2: body.address_line_2,
        city: body.city,
        postcode: body.postcode,
        company_number: body.company_number,
        vat_number: body.vat_number,
        website_url: body.website_url,
        facebook_url: body.facebook_url,
        instagram_url: body.instagram_url,
        twitter_url: body.twitter_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendor.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
