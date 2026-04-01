/**
 * Order Service — Solaris Service Layer
 *
 * All order business logic lives here. API routes are thin wrappers
 * that call this service and convert Results to HTTP responses.
 *
 * Rules:
 * - Returns Result<T>, never throws
 * - Never touches HTTP (no NextRequest/NextResponse)
 * - Never renders UI
 * - Only talks to repositories (Supabase) and other services
 */

import { ok, fail } from '@/lib/utils/result'
import type { Result } from '@/lib/utils/result'
import { logger } from '@/lib/utils/logger'
import { orderStateMachine } from './order-state-machine'
import type { OrderStatus, OrderEvent } from './order-state-machine'
import { getSupabaseAdmin } from '@/lib/supabase/server'

const log = logger.child({ context: 'orders' })

// Types
export interface Order {
  id: string
  order_number: string
  user_id: string | null
  customer_email: string
  customer_name: string
  status: OrderStatus
  payment_status: string
  subtotal_pence: number
  delivery_fee_pence: number
  total_pence: number
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price_pence: number
  total_price_pence: number
  vendor_id: string | null
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
}

export const orderService = {
  /**
   * Get a single order by ID with its items.
   */
  async getById(orderId: string): Promise<Result<OrderWithItems>> {
    const supabaseAdmin = getSupabaseAdmin()

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      log.warn('Order not found', { orderId })
      return fail('Order not found', 'NOT_FOUND')
    }

    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      log.error('Failed to fetch order items', { orderId, error: itemsError.message })
      return fail('Failed to fetch order items', 'INTERNAL_ERROR')
    }

    return ok({ ...order, items: items || [] } as OrderWithItems)
  },

  /**
   * Transition an order to a new status using the state machine.
   * Returns the updated order.
   */
  async updateStatus(orderId: string, event: OrderEvent): Promise<Result<Order>> {
    const supabaseAdmin = getSupabaseAdmin()

    // Fetch current order
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, status, order_number')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return fail('Order not found', 'NOT_FOUND')
    }

    // Validate transition
    const transition = orderStateMachine.transition(order.status as OrderStatus, event)
    if (!transition.ok) {
      log.warn('Invalid order transition', {
        orderId,
        currentStatus: order.status,
        event,
        error: transition.error,
      })
      return transition
    }

    const newStatus = transition.data

    // Build update payload with status-specific timestamps
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === 'shipped') updatePayload.shipped_at = new Date().toISOString()
    if (newStatus === 'delivered') updatePayload.delivered_at = new Date().toISOString()
    if (newStatus === 'cancelled') updatePayload.cancelled_at = new Date().toISOString()

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      log.error('Failed to update order status', { orderId, error: updateError.message })
      return fail('Failed to update order', 'INTERNAL_ERROR')
    }

    log.info('Order status updated', {
      orderId,
      orderNumber: order.order_number,
      from: order.status,
      to: newStatus,
      event,
    })

    return ok(updated as Order)
  },

  /**
   * Delete an order and its items (admin only).
   */
  async delete(orderId: string): Promise<Result<{ deleted: true }>> {
    const supabaseAdmin = getSupabaseAdmin()

    // Delete order items first
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('order_id', orderId)

    if (itemsError) {
      log.error('Failed to delete order items', { orderId, error: itemsError.message })
      return fail('Failed to delete order items', 'INTERNAL_ERROR')
    }

    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (orderError) {
      log.error('Failed to delete order', { orderId, error: orderError.message })
      return fail('Failed to delete order', 'INTERNAL_ERROR')
    }

    log.info('Order deleted', { orderId })
    return ok({ deleted: true as const })
  },

  /**
   * Get orders with pagination and optional filters.
   */
  async list(options: {
    page?: number
    limit?: number
    status?: string
    userId?: string
  }): Promise<Result<{ orders: Order[]; total: number }>> {
    const supabaseAdmin = getSupabaseAdmin()
    const page = options.page || 1
    const limit = Math.min(options.limit || 20, 200)
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (options.status) {
      query = query.eq('status', options.status)
    }
    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    const { data, error, count } = await query

    if (error) {
      log.error('Failed to list orders', { error: error.message })
      return fail('Failed to fetch orders', 'INTERNAL_ERROR')
    }

    return ok({ orders: (data || []) as Order[], total: count || 0 })
  },
}
