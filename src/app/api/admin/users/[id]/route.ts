import { NextRequest, NextResponse } from 'next/server'
import { createClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { userAudit } from '@/lib/security'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = getSupabaseAdmin()

    // Get user profile
    const { data: userProfile, error } = await admin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user orders
    const { data: orders, count: orderCount } = await admin
      .from('orders')
      .select('id, order_number, total_pence, status, created_at', { count: 'exact' })
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get total spent
    const { data: totalData } = await admin
      .from('orders')
      .select('total_pence')
      .eq('user_id', id)
      .eq('payment_status', 'paid')

    const totalSpent = totalData?.reduce((sum, o) => sum + (o.total_pence || 0), 0) || 0

    // Get user addresses
    const { data: addresses } = await admin
      .from('addresses')
      .select('*')
      .eq('user_id', id)

    // Get user reviews
    const { count: reviewCount } = await admin
      .from('product_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)

    return NextResponse.json({
      ...userProfile,
      orders,
      order_count: orderCount || 0,
      total_spent: totalSpent,
      addresses: addresses || [],
      review_count: reviewCount || 0,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { role, is_banned, full_name, phone } = body

    // Prevent admin from modifying themselves to non-admin
    if (id === user.id && role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Cannot remove your own admin role' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (role !== undefined) {
      // Validate role
      if (!['customer', 'vendor', 'admin', 'super_admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      // Only super_admin can assign super_admin role
      if (role === 'super_admin' && profile?.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Only super admins can assign the super_admin role' },
          { status: 403 }
        )
      }
      updateData.role = role
    }

    if (is_banned !== undefined) {
      // Prevent admin from banning themselves
      if (id === user.id && is_banned) {
        return NextResponse.json({ error: 'Cannot ban yourself' }, { status: 400 })
      }
      updateData.is_banned = is_banned
    }

    if (full_name !== undefined) updateData.full_name = full_name
    if (phone !== undefined) updateData.phone = phone

    const admin = getSupabaseAdmin()
    const { data: updatedUser, error } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Audit log for role changes and bans
    if (role !== undefined || is_banned !== undefined) {
      try {
        await userAudit.logUpdate(
          request,
          { id: user.id, email: user.email || '', role: profile?.role || 'admin' },
          id,
          `user:${id}`,
          { role: body.role, is_banned: body.is_banned },
          updateData
        )
      } catch (auditError) {
        console.error('Audit logging failed:', auditError)
      }
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent admin from deleting themselves
    if (id === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Check if user has orders
    const { count: orderCount } = await admin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)

    if (orderCount && orderCount > 0) {
      // Instead of deleting, anonymize the user
      const { error } = await admin
        .from('profiles')
        .update({
          email: `deleted_${id.substring(0, 8)}@deleted.user`,
          full_name: 'Deleted User',
          phone: null,
          avatar_url: null,
          is_banned: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        message: 'User has orders and cannot be fully deleted. Account has been anonymized and banned.',
        anonymized: true
      })
    }

    // Delete user profile (cascade will handle related records)
    const { error } = await admin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
