/**
 * Event Bus — Solaris World-Class (#33)
 *
 * Decouple services with publish/subscribe events.
 * Services emit events, other services subscribe.
 * Adding new features never requires changing existing code.
 */

import { logger } from '@/lib/utils/logger'

type EventMap = {
  'user.created': { userId: string; email: string; name: string }
  'user.updated': { userId: string; changes: Record<string, unknown> }
  'order.created': { orderId: string; userId: string; totalPence: number }
  'order.paid': { orderId: string; totalPence: number; paymentIntentId: string }
  'order.shipped': { orderId: string; trackingNumber?: string }
  'order.delivered': { orderId: string }
  'order.cancelled': { orderId: string; reason?: string }
  'product.created': { productId: string; vendorId?: string }
  'product.updated': { productId: string; changes: string[] }
  'product.deleted': { productId: string }
  'review.created': { reviewId: string; productId: string; rating: number }
  'vendor.approved': { vendorId: string; userId: string }
  'vendor.rejected': { vendorId: string; reason: string }
  'payment.succeeded': { orderId: string; paymentId: string; amountPence: number }
  'payment.failed': { orderId: string; error: string }
}

type EventHandler<T> = (payload: T) => Promise<void>

class EventBus {
  private handlers = new Map<string, EventHandler<unknown>[]>()

  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>) {
    const existing = this.handlers.get(event as string) || []
    existing.push(handler as EventHandler<unknown>)
    this.handlers.set(event as string, existing)
  }

  async emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    const handlers = this.handlers.get(event as string) || []

    logger.info(`Event: ${event as string}`, {
      event,
      handlerCount: handlers.length,
    })

    // Execute all handlers — don't let one failure stop others
    const results = await Promise.allSettled(
      handlers.map((handler) => handler(payload))
    )

    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        logger.error(`Event handler failed for ${event as string}`, {
          handlerIndex: index,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        })
      }
    }
  }
}

export const eventBus = new EventBus()
