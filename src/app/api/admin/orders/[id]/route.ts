/**
 * Admin Order Detail API — Solaris Pattern
 *
 * Thin route handler that delegates to orderService.
 * Auth -> Service -> Response. No business logic here.
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { orderAudit } from '@/lib/security'
import { orderService } from '@/services/order.service'
import { handleApiError, apiSuccess, apiCatchAll } from '@/lib/utils/api-error'

export const dynamic = 'force-dynamic'

// GET single order with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const { id } = await params
    const result = await orderService.getById(id)

    if (!result.ok) return handleApiError(result)
    return apiSuccess(result.data)
  } catch (error) {
    return apiCatchAll(error, 'admin:orders:get')
  }
}

// DELETE order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const { id } = await params

    // Get order for audit log before deletion
    const orderResult = await orderService.getById(id)
    const orderToDelete = orderResult.ok ? orderResult.data : null

    const result = await orderService.delete(id)
    if (!result.ok) return handleApiError(result)

    // Audit log
    if (auth.user && auth.profile) {
      await orderAudit.logDelete(
        request,
        { id: auth.user.id, email: auth.user.email || '', role: auth.profile.role },
        id,
        orderToDelete?.order_number || id,
        (orderToDelete as unknown as Record<string, unknown>) || undefined
      )
    }

    return apiSuccess({ deleted: true })
  } catch (error) {
    return apiCatchAll(error, 'admin:orders:delete')
  }
}
