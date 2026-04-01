/**
 * Order State Machine — Solaris Pattern
 *
 * Defines all valid order statuses and the transitions between them.
 * Impossible state transitions are rejected at compile time AND runtime.
 *
 * Usage:
 *   const result = orderStateMachine.transition('confirmed', 'SHIP')
 *   if (!result.ok) return fail(result.error, 'BAD_REQUEST')
 *   // result.data === 'shipped'
 */

import { ok, fail } from '@/lib/utils/result'
import type { Result } from '@/lib/utils/result'

// All valid order statuses
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'return_requested'
  | 'returned'

// All valid events that can trigger a transition
export type OrderEvent =
  | 'CONFIRM'
  | 'START_PROCESSING'
  | 'SHIP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVER'
  | 'CANCEL'
  | 'REFUND'
  | 'REQUEST_RETURN'
  | 'COMPLETE_RETURN'

// State transition map: current status -> event -> next status
const TRANSITIONS: Record<OrderStatus, Partial<Record<OrderEvent, OrderStatus>>> = {
  pending: {
    CONFIRM: 'confirmed',
    CANCEL: 'cancelled',
  },
  confirmed: {
    START_PROCESSING: 'processing',
    CANCEL: 'cancelled',
  },
  processing: {
    SHIP: 'shipped',
    CANCEL: 'cancelled',
  },
  shipped: {
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVER: 'delivered',
    CANCEL: 'cancelled',
  },
  out_for_delivery: {
    DELIVER: 'delivered',
  },
  delivered: {
    REQUEST_RETURN: 'return_requested',
    REFUND: 'refunded',
  },
  cancelled: {
    REFUND: 'refunded',
  },
  refunded: {
    // Terminal state
  },
  return_requested: {
    COMPLETE_RETURN: 'returned',
    CANCEL: 'cancelled', // Cancel the return request
  },
  returned: {
    REFUND: 'refunded',
  },
}

// Human-readable labels
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  return_requested: 'Return Requested',
  returned: 'Returned',
}

export const orderStateMachine = {
  /**
   * Attempt a state transition. Returns the new status or an error.
   */
  transition(currentStatus: OrderStatus, event: OrderEvent): Result<OrderStatus> {
    const transitions = TRANSITIONS[currentStatus]
    const nextStatus = transitions?.[event]

    if (!nextStatus) {
      return fail(
        `Cannot ${event} an order that is ${currentStatus}`,
        'BAD_REQUEST'
      )
    }

    return ok(nextStatus)
  },

  /**
   * Check if a transition is valid without performing it.
   */
  canTransition(currentStatus: OrderStatus, event: OrderEvent): boolean {
    return !!TRANSITIONS[currentStatus]?.[event]
  },

  /**
   * Get all valid events for a given status.
   */
  validEvents(currentStatus: OrderStatus): OrderEvent[] {
    const transitions = TRANSITIONS[currentStatus]
    return Object.keys(transitions || {}) as OrderEvent[]
  },

  /**
   * Check if a status is terminal (no further transitions possible).
   */
  isTerminal(status: OrderStatus): boolean {
    return this.validEvents(status).length === 0
  },
}
