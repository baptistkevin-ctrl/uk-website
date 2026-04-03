import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { sanitizeSearchQuery } from '@/lib/security'

export const dynamic = 'force-dynamic'

// GET - List returns for vendor's products only
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get vendor record
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get vendor's product IDs
    const { data: vendorProducts } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('vendor_id', vendor.id)

    const productIds = vendorProducts?.map(p => p.id) || []

    if (productIds.length === 0) {
      return NextResponse.json({ returns: [], total: 0, page: 1, totalPages: 0 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get return IDs that contain at least one of the vendor's products
    const { data: vendorReturnItems } = await supabaseAdmin
      .from('return_items')
      .select('return_id')
      .in('product_id', productIds)

    const returnIds = [...new Set(vendorReturnItems?.map(ri => ri.return_id) || [])]

    if (returnIds.length === 0) {
      return NextResponse.json({ returns: [], total: 0, page: 1, totalPages: 0 })
    }

    // Query returns filtered to vendor's return IDs
    let query = supabaseAdmin
      .from('returns')
      .select(`
        *,
        orders (
          order_number,
          customer_name,
          customer_email
        ),
        return_items (
          id,
          quantity,
          refund_amount_pence,
          product_id,
          products (id, name, image_url)
        )
      `, { count: 'exact' })
      .in('id', returnIds)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      const sanitized = sanitizeSearchQuery(search)
      if (sanitized) {
        query = query.or(`return_number.ilike.%${sanitized}%`)
      }
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Vendor returns fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
    }

    // Filter return_items to only include vendor's products
    const filteredData = (data || []).map(ret => ({
      ...ret,
      return_items: (ret.return_items || []).filter(
        (item: { product_id: string }) => productIds.includes(item.product_id)
      ),
    }))

    return NextResponse.json({
      returns: filteredData,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('Vendor returns error:', error)
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
  }
}

// PATCH - Update return status (vendor can approve/reject pending returns)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get vendor record
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const body = await request.json()
    const { returnId, status, vendor_notes } = body

    if (!returnId) {
      return NextResponse.json({ error: 'Return ID is required' }, { status: 400 })
    }

    // Vendors can only approve or reject
    const allowedStatuses = ['approved', 'rejected']
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Vendors can only approve or reject returns' },
        { status: 403 }
      )
    }

    // Get vendor's product IDs
    const { data: vendorProducts } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('vendor_id', vendor.id)

    const productIds = vendorProducts?.map(p => p.id) || []

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }

    // Verify this return has items belonging to the vendor
    const { data: returnItems } = await supabaseAdmin
      .from('return_items')
      .select('return_id, product_id')
      .eq('return_id', returnId)
      .in('product_id', productIds)

    if (!returnItems || returnItems.length === 0) {
      return NextResponse.json({ error: 'Return not found or not authorized' }, { status: 403 })
    }

    // Verify ALL items in this return belong to the vendor (prevent cross-vendor approval)
    const { data: allReturnItems } = await supabaseAdmin
      .from('return_items')
      .select('product_id')
      .eq('return_id', returnId)

    const totalItemCount = allReturnItems?.length || 0
    if (totalItemCount > returnItems.length) {
      return NextResponse.json(
        { error: 'This return contains items from multiple vendors. Only admin can process it.' },
        { status: 403 }
      )
    }

    // Verify the return is currently pending
    const { data: currentReturn, error: fetchError } = await supabaseAdmin
      .from('returns')
      .select('id, status')
      .eq('id', returnId)
      .single()

    if (fetchError || !currentReturn) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 })
    }

    if (currentReturn.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending returns can be updated by vendors' },
        { status: 400 }
      )
    }

    // Build updates
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (vendor_notes) {
      updates.admin_notes = vendor_notes
    }

    if (status === 'approved') {
      updates.approved_at = new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('returns')
      .update(updates)
      .eq('id', returnId)
      .select()
      .single()

    if (updateError) {
      console.error('Vendor return update error:', updateError)
      return NextResponse.json({ error: 'Failed to update return' }, { status: 500 })
    }

    return NextResponse.json({ return: updated })
  } catch (error) {
    console.error('Vendor return update error:', error)
    return NextResponse.json({ error: 'Failed to update return' }, { status: 500 })
  }
}
