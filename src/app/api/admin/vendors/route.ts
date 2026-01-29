import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { vendorAudit } from '@/lib/security'

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
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
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
      return NextResponse.json({ error: error.message }, { status: 500 })
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

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
