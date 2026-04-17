import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { vendorAudit } from '@/lib/security/audit'

export const dynamic = 'force-dynamic'

// GET all applications
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

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
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.error!

  const supabaseAdmin = getSupabaseAdmin()
  const adminUser = authResult.user
  const adminProfile = authResult.profile

  try {
    const body = await request.json()
    const { id, status, admin_notes } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Application ID and status are required' }, { status: 400 })
    }

    // Update application — only set fields that exist in the table
    const updateData: Record<string, unknown> = { status }
    if (admin_notes) updateData.admin_notes = admin_notes

    const { data: application, error: appError } = await supabaseAdmin
      .from('vendor_applications')
      .update(updateData)
      .eq('id', id)
      .select('*, user:user_id(email, full_name)')
      .single()

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 })
    }

    // If approved, create vendor record
    if (status === 'approved') {
      // Check if vendor already exists for this user (prevent double-approve)
      const { data: existingVendor } = await supabaseAdmin
        .from('vendors')
        .select('id')
        .eq('user_id', application.user_id)
        .single()

      if (existingVendor) {
        return NextResponse.json({
          application,
          message: 'Application approved (vendor account already exists)'
        })
      }

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
          commission_rate: 12.50
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

      // Send vendor approval email
      try {
        const { sendVendorApprovedEmail } = await import('@/lib/email/send-email')
        const vendorEmail = application.user?.email
        const vendorName = application.user?.full_name || application.business_name
        const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://uk-grocery-store.com'}/vendor/dashboard`
        if (vendorEmail) {
          await sendVendorApprovedEmail(vendorEmail, vendorName, application.business_name, dashboardUrl)
        }
      } catch {
        // Non-critical - don't block approval
      }

      if (adminUser) {
        await vendorAudit.logCreate(
          request,
          { id: adminUser.id, email: adminProfile?.email || adminUser.email || '', role: adminProfile?.role || 'admin' },
          vendor.id,
          application.business_name,
          { application_id: id, user_id: application.user_id, status: 'approved' }
        )
      }

      return NextResponse.json({
        application,
        vendor,
        message: 'Application approved and vendor account created'
      })
    }

    if (adminUser) {
      await vendorAudit.logAction(
        request,
        { id: adminUser.id, email: adminProfile?.email || adminUser.email || '', role: adminProfile?.role || 'admin' },
        `application_${status}`,
        id,
        application.business_name,
        { status, admin_notes }
      )
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
