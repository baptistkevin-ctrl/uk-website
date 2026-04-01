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
 * - Only talks to repositories and other services
 */

import { ok, fail } from '@/lib/utils/result'
import type { Result } from '@/lib/utils/result'
import { logger } from '@/lib/utils/logger'
import { sanitizeSearchQuery } from '@/lib/security'
import { orderStateMachine } from './order-state-machine'
import type { OrderStatus, OrderEvent } from './order-state-machine'
import { orderRepository } from '@/repositories/order.repository'

const log = logger.child({ context: 'orders' })

/** Map of status to the timestamp field that should be set on transition. */
const STATUS_TIMESTAMP_FIELD: Partial<Record<OrderStatus, string>> = {
  confirmed: 'confirmed_at',
  out_for_delivery: 'dispatched_at',
  shipped: 'shipped_at',
  delivered: 'delivered_at',
  cancelled: 'cancelled_at',
}

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
    try {
      const order = await orderRepository.findById(orderId)
      if (!order) {
        log.warn('Order not found', { orderId })
        return fail('Order not found', 'NOT_FOUND')
      }

      const items = await orderRepository.findItemsByOrderId(orderId)
      return ok({ ...order, items } as OrderWithItems)
    } catch (error) {
      log.error('Failed to fetch order', { orderId, error: (error as Error).message })
      return fail('Failed to fetch order', 'INTERNAL_ERROR')
    }
  },

  /**
   * Transition an order to a new status using the state machine.
   */
  async updateStatus(orderId: string, event: OrderEvent): Promise<Result<Order>> {
    try {
      const order = await orderRepository.findById(orderId)
      if (!order) return fail('Order not found', 'NOT_FOUND')

      // Validate transition via state machine
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
      const updatePayload: Record<string, unknown> = { status: newStatus }
      const tsField = STATUS_TIMESTAMP_FIELD[newStatus]
      if (tsField) updatePayload[tsField] = new Date().toISOString()

      const updated = await orderRepository.update(orderId, updatePayload)

      log.info('Order status updated', {
        orderId,
        orderNumber: order.order_number,
        from: order.status,
        to: newStatus,
        event,
      })

      return ok(updated as Order)
    } catch (error) {
      log.error('Failed to update order status', { orderId, error: (error as Error).message })
      return fail('Failed to update order', 'INTERNAL_ERROR')
    }
  },

  /**
   * Admin update: update order fields (status via state machine, payment_status, notes).
   */
  async adminUpdate(
    orderId: string,
    fields: { event?: OrderEvent; payment_status?: string; notes?: string }
  ): Promise<Result<Order>> {
    try {
      const order = await orderRepository.findById(orderId)
      if (!order) return fail('Order not found', 'NOT_FOUND')

      const updatePayload: Record<string, unknown> = {}

      // Handle status transition via state machine
      if (fields.event) {
        const transition = orderStateMachine.transition(order.status as OrderStatus, fields.event)
        if (!transition.ok) {
          log.warn('Invalid order transition', {
            orderId,
            currentStatus: order.status,
            event: fields.event,
            error: transition.error,
          })
          return transition
        }

        const newStatus = transition.data
        updatePayload.status = newStatus

        const tsField = STATUS_TIMESTAMP_FIELD[newStatus]
        if (tsField) updatePayload[tsField] = new Date().toISOString()

        log.info('Order status updated', {
          orderId,
          orderNumber: order.order_number,
          from: order.status,
          to: newStatus,
          event: fields.event,
        })
      }

      if (fields.payment_status) {
        updatePayload.payment_status = fields.payment_status
        if (fields.payment_status === 'paid') {
          updatePayload.paid_at = new Date().toISOString()
        }
      }

      if (fields.notes !== undefined) {
        updatePayload.notes = fields.notes
      }

      if (Object.keys(updatePayload).length === 0) {
        return fail('No valid fields to update', 'BAD_REQUEST')
      }

      const updated = await orderRepository.update(orderId, updatePayload)
      return ok(updated as Order)
    } catch (error) {
      log.error('Failed to update order', { orderId, error: (error as Error).message })
      return fail('Failed to update order', 'INTERNAL_ERROR')
    }
  },

  /**
   * Delete an order and its items (admin only).
   */
  async delete(orderId: string): Promise<Result<{ deleted: true }>> {
    try {
      await orderRepository.deleteItems(orderId)
      await orderRepository.deleteOrder(orderId)

      log.info('Order deleted', { orderId })
      return ok({ deleted: true as const })
    } catch (error) {
      log.error('Failed to delete order', { orderId, error: (error as Error).message })
      return fail('Failed to delete order', 'INTERNAL_ERROR')
    }
  },

  /**
   * Get orders with pagination and optional filters.
   */
  async list(options: {
    page?: number
    limit?: number
    status?: string
    userId?: string
    paymentStatus?: string
    search?: string
  }): Promise<Result<{ orders: Order[]; total: number }>> {
    try {
      const page = options.page || 1
      const limit = Math.min(options.limit || 20, 200)

      const sanitizedSearch = options.search
        ? sanitizeSearchQuery(options.search)
        : undefined

      const result = await orderRepository.findMany({
        page,
        limit,
        status: options.status,
        userId: options.userId,
        paymentStatus: options.paymentStatus,
        search: sanitizedSearch || undefined,
      })

      return ok({ orders: result.data as Order[], total: result.total })
    } catch (error) {
      log.error('Failed to list orders', { error: (error as Error).message })
      return fail('Failed to fetch orders', 'INTERNAL_ERROR')
    }
  },
}
