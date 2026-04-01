import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/verify'
import { userAudit } from '@/lib/security'
import { apiSuccess, apiCatchAll, handleApiError } from '@/lib/utils/api-error'
import { fail } from '@/lib/utils/result'
import { logger } from '@/lib/utils/logger'

const log = logger.child({ context: 'admin:users:id' })

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error!

    const admin = getSupabaseAdmin()

    // Get user profile
    const { data: userProfile, error } = await admin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !userProfile) {
      log.warn('User not found', { targetUserId: id })
      return handleApiError(fail('User not found', 'NOT_FOUND'))
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

    log.info('User detail fetched', { targetUserId: id, adminId: auth.user!.id })

    return apiSuccess({
      ...userProfile,
      orders,
      order_count: orderCount || 0,
      total_spent: totalSpent,
      addresses: addresses || [],
      review_count: reviewCount || 0,
    })
  } catch (error) {
    return apiCatchAll(error, 'admin:users:get')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error!

    const body = await request.json()
    const { role, is_banned, full_name, phone } = body

    // Prevent admin from modifying themselves to non-admin
    if (id === auth.user!.id && role !== 'admin' && role !== 'super_admin') {
      log.warn('Admin tried to remove own admin role', { adminId: auth.user!.id })
      return handleApiError(fail('Cannot remove your own admin role', 'BAD_REQUEST'))
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (role !== undefined) {
      // Validate role
      if (!['customer', 'vendor', 'admin', 'super_admin'].includes(role)) {
        log.warn('Invalid role assignment attempted', { role, adminId: auth.user!.id })
        return handleApiError(fail('Invalid role', 'BAD_REQUEST'))
      }
      // Only super_admin can assign super_admin role
      if (role === 'super_admin' && auth.profile!.role !== 'super_admin') {
        log.warn('Non-super-admin tried to assign super_admin role', { adminId: auth.user!.id })
        return handleApiError(fail('Only super admins can assign the super_admin role', 'FORBIDDEN'))
      }
      updateData.role = role
    }

    if (is_banned !== undefined) {
      // Prevent admin from banning themselves
      if (id === auth.user!.id && is_banned) {
        log.warn('Admin tried to ban themselves', { adminId: auth.user!.id })
        return handleApiError(fail('Cannot ban yourself', 'BAD_REQUEST'))
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
      log.error('Failed to update user', { targetUserId: id, error: error.message })
      return apiCatchAll(error, 'admin:users:update')
    }

    // Audit log for role changes and bans
    if (role !== undefined || is_banned !== undefined) {
      try {
        await userAudit.logUpdate(
          request,
          { id: auth.user!.id, email: auth.user!.email || '', role: auth.profile!.role || 'admin' },
          id,
          `user:${id}`,
          { role: body.role, is_banned: body.is_banned },
          updateData
        )
      } catch (auditError) {
        log.error('Audit logging failed', {
          targetUserId: id,
          error: auditError instanceof Error ? auditError.message : String(auditError),
        })
      }
    }

    log.info('User updated', { targetUserId: id, adminId: auth.user!.id, fields: Object.keys(updateData) })

    return apiSuccess(updatedUser)
  } catch (error) {
    return apiCatchAll(error, 'admin:users:update')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error!

    // Prevent admin from deleting themselves
    if (id === auth.user!.id) {
      log.warn('Admin tried to delete own account', { adminId: auth.user!.id })
      return handleApiError(fail('Cannot delete your own account', 'BAD_REQUEST'))
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
        log.error('Failed to anonymize user', { targetUserId: id, error: error.message })
        return apiCatchAll(error, 'admin:users:delete')
      }

      log.info('User anonymized (has orders)', { targetUserId: id, adminId: auth.user!.id })

      return apiSuccess({
        message: 'User has orders and cannot be fully deleted. Account has been anonymized and banned.',
        anonymized: true,
      })
    }

    // Delete user profile (cascade will handle related records)
    const { error } = await admin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      log.error('Failed to delete user', { targetUserId: id, error: error.message })
      return apiCatchAll(error, 'admin:users:delete')
    }

    log.info('User deleted', { targetUserId: id, adminId: auth.user!.id })

    return apiSuccess({ message: 'User deleted successfully' })
  } catch (error) {
    return apiCatchAll(error, 'admin:users:delete')
  }
}
