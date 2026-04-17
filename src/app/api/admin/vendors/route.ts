import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { vendorAudit, escapeHtml } from '@/lib/security'

export const dynamic = 'force-dynamic'

// GET all vendors
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const supabaseAdmin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('vendors')
    .select('*, user:user_id(email, full_name)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// UPDATE vendor
export async function PUT(request: NextRequest) {
  // Verify admin authentication
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    const allowedFields = ['business_name', 'description', 'status', 'commission_rate', 'phone', 'email', 'logo_url']
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field]
    }

    // Get current vendor for audit logging
    const { data: currentVendor } = await supabaseAdmin
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('vendors')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error:', error)
      return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
    }

    // If vendor is approved, update user profile
    if (updates.status === 'approved') {
      const { data: vendor } = await supabaseAdmin
        .from('vendors')
        .select('user_id')
        .eq('id', id)
        .single()

      if (vendor) {
        await supabaseAdmin
          .from('profiles')
          .update({
            is_vendor: true,
            vendor_id: id,
            role: 'vendor'
          })
          .eq('id', vendor.user_id)
      }
    }

    // Log audit event
    if (auth.user && auth.profile) {
      await vendorAudit.logUpdate(
        request,
        { id: auth.user.id, email: auth.user.email || '', role: auth.profile.role },
        id,
        data.business_name || id,
        currentVendor || {},
        updates
      )
    }

    // Send notification email if requested
    if (body.notify_message && data.email) {
      try {
        const { sendEmail } = await import('@/lib/email/send-email')
        await sendEmail({
          to: data.email,
          subject: `Message from UK Grocery Store Admin`,
          html: `<h2>Message from UK Grocery Store</h2>
            <p>Dear ${escapeHtml(data.business_name)},</p>
            <p>${escapeHtml(body.notify_message).replace(/\n/g, '<br>')}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="color:#888;font-size:12px;">This message was sent by the UK Grocery Store admin team.</p>`,
        })
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// DELETE vendor (super_admin only)
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.success) return auth.error

  if (auth.profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can delete vendors' }, { status: 403 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    // Get vendor details before deletion
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('*, user:user_id(email, full_name)')
      .eq('id', id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Delete all related records in correct order (foreign key safe)
    // 0. Reset user profile FIRST (profiles.vendor_id references vendors)
    await supabaseAdmin
      .from('profiles')
      .update({ is_vendor: false, vendor_id: null, role: 'customer' })
      .eq('id', vendor.user_id)

    // 1. Delete vendor orders
    await supabaseAdmin.from('vendor_orders').delete().eq('vendor_id', id)

    // 2. Delete order items linked to vendor products
    const { data: vendorProducts } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('vendor_id', id)

    if (vendorProducts && vendorProducts.length > 0) {
      const productIds = vendorProducts.map(p => p.id)
      await supabaseAdmin.from('order_items').delete().in('product_id', productIds)
      await supabaseAdmin.from('product_reviews').delete().in('product_id', productIds)
      await supabaseAdmin.from('product_categories').delete().in('product_id', productIds)
    }

    // 3. Delete products
    await supabaseAdmin.from('products').delete().eq('vendor_id', id)

    // 4. Delete vendor application
    await supabaseAdmin.from('vendor_applications').delete().eq('user_id', vendor.user_id)

    // 5. Delete vendor record
    const { error: vendorError } = await supabaseAdmin
      .from('vendors')
      .delete()
      .eq('id', id)

    if (vendorError) {
      console.error('Delete vendor error:', vendorError)
      return NextResponse.json({ error: 'Failed to delete vendor record: ' + vendorError.message }, { status: 500 })
    }

    // Profile already reset in step 0 above

    // Log audit event
    if (auth.user && auth.profile) {
      await vendorAudit.logAction(
        request,
        { id: auth.user.id, email: auth.user.email || '', role: auth.profile.role },
        'vendor_deleted',
        id,
        vendor.business_name,
        { user_id: vendor.user_id, email: vendor.email }
      )
    }

    return NextResponse.json({ message: 'Vendor deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
