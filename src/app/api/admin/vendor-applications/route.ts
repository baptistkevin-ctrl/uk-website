import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

// GET all applications
export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('vendor_applications')
    .select('*, user:user_id(email, full_name)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// UPDATE application (approve/reject)
export async function PUT(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const supabase = await createClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  try {
    const body = await request.json()
    const { id, status, admin_notes } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Application ID and status are required' }, { status: 400 })
    }

    // Update application
    const { data: application, error: appError } = await supabaseAdmin
      .from('vendor_applications')
      .update({
        status,
        admin_notes,
        reviewed_by: adminUser?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, user:user_id(email, full_name)')
      .single()

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 })
    }

    // If approved, create vendor record
    if (status === 'approved') {
      // Generate slug from business name
      const slug = application.business_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check for slug collision and make unique if needed
      let finalSlug = slug
      let counter = 1
      while (true) {
        const { data: existing } = await supabaseAdmin
          .from('vendors')
          .select('id')
          .eq('slug', finalSlug)
          .single()

        if (!existing) break
        finalSlug = `${slug}-${counter}`
        counter++
      }

      // Create vendor
      const { data: vendor, error: vendorError } = await supabaseAdmin
        .from('vendors')
        .insert({
          user_id: application.user_id,
          business_name: application.business_name,
          slug: finalSlug,
          description: application.description,
          email: application.user?.email || '',
          phone: application.phone,
          status: 'approved',
          commission_rate: 15.00
        })
        .select()
        .single()

      if (vendorError) {
        console.error('Vendor creation error:', vendorError)
        return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 })
      }

      // Update user profile
      await supabaseAdmin
        .from('profiles')
        .update({
          is_vendor: true,
          vendor_id: vendor.id,
          role: 'vendor'
        })
        .eq('id', application.user_id)

      return NextResponse.json({
        application,
        vendor,
        message: 'Application approved and vendor account created'
      })
    }

    return NextResponse.json({
      application,
      message: `Application ${status}`
    })
  } catch (error) {
    console.error('Application update error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
