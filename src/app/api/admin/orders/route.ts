import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/verify'
import { orderService } from '@/services/order.service'
import { handleApiError, apiSuccess, apiCatchAll } from '@/lib/utils/api-error'
import type { OrderEvent } from '@/services/order-state-machine'

export const dynamic = 'force-dynamic'

// GET all orders with filtering
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const paymentStatus = searchParams.get('paymentStatus') || undefined
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await orderService.list({
      page,
      limit,
      status: status !== 'all' ? status : undefined,
      paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
      search,
    })

    if (!result.ok) return handleApiError(result)

    return apiSuccess(result.data.orders, {
      page,
      limit,
      total: result.data.total,
      totalPages: Math.ceil(result.data.total / limit),
    })
  } catch (error) {
    return apiCatchAll(error, 'admin:orders:list')
  }
}

// PUT - Update order status / payment_status / notes
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.success) return auth.error

    const body = await request.json()
    const { id, event, payment_status, notes } = body as {
      id?: string
      event?: OrderEvent
      payment_status?: string
      notes?: string
    }

    if (!id) {
      return handleApiError({ ok: false as const, error: 'Order ID is required', code: 'BAD_REQUEST' })
    }

    const result = await orderService.adminUpdate(id, { event, payment_status, notes })
    if (!result.ok) return handleApiError(result)

    return apiSuccess(result.data)
  } catch (error) {
    return apiCatchAll(error, 'admin:orders:update')
  }
}
