/**
 * Order Service Tests — Solaris Testing Standard
 *
 * Pattern: "should [expected behavior] when [condition]"
 * Structure: Arrange → Act → Assert
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { orderService } from '@/services/order.service'
import { orderRepository } from '@/repositories/order.repository'

// Mock the repository layer
vi.mock('@/repositories/order.repository', () => ({
  orderRepository: {
    findById: vi.fn(),
    findItemsByOrderId: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    deleteItems: vi.fn(),
    deleteOrder: vi.fn(),
  },
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}))

const mockRepo = vi.mocked(orderRepository)

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getById', () => {
    it('should return order with items when found', async () => {
      const mockOrder = {
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'pending',
        total_pence: 1999,
      }
      const mockItems = [
        { id: 'item-1', order_id: 'order-1', quantity: 2 },
      ]

      mockRepo.findById.mockResolvedValue(mockOrder)
      mockRepo.findItemsByOrderId.mockResolvedValue(mockItems)

      const result = await orderService.getById('order-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.id).toBe('order-1')
        expect(result.data.items).toHaveLength(1)
      }
    })

    it('should return NOT_FOUND when order does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null)

      const result = await orderService.getById('nonexistent')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('NOT_FOUND')
      }
    })

    it('should return INTERNAL_ERROR when repository throws', async () => {
      mockRepo.findById.mockRejectedValue(new Error('DB connection lost'))

      const result = await orderService.getById('order-1')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('INTERNAL_ERROR')
      }
    })
  })

  describe('updateStatus', () => {
    it('should transition order to new status when valid', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'order-1',
        status: 'pending',
        order_number: 'ORD-001',
      })
      mockRepo.update.mockResolvedValue({
        id: 'order-1',
        status: 'confirmed',
        order_number: 'ORD-001',
      })

      const result = await orderService.updateStatus('order-1', 'CONFIRM')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.status).toBe('confirmed')
      }
    })

    it('should fail when transition is invalid', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'order-1',
        status: 'delivered',
        order_number: 'ORD-001',
      })

      const result = await orderService.updateStatus('order-1', 'CONFIRM')

      expect(result.ok).toBe(false)
    })
  })

  describe('delete', () => {
    it('should delete items then order', async () => {
      mockRepo.deleteItems.mockResolvedValue(undefined)
      mockRepo.deleteOrder.mockResolvedValue(undefined)

      const result = await orderService.delete('order-1')

      expect(result.ok).toBe(true)
      expect(mockRepo.deleteItems).toHaveBeenCalledWith('order-1')
      expect(mockRepo.deleteOrder).toHaveBeenCalledWith('order-1')
    })
  })

  describe('list', () => {
    it('should return paginated orders', async () => {
      mockRepo.findMany.mockResolvedValue({
        data: [{ id: 'order-1' }, { id: 'order-2' }],
        total: 50,
      })

      const result = await orderService.list({ page: 1, limit: 20 })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.orders).toHaveLength(2)
        expect(result.data.total).toBe(50)
      }
    })

    it('should cap limit at 200', async () => {
      mockRepo.findMany.mockResolvedValue({ data: [], total: 0 })

      await orderService.list({ limit: 999 })

      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 200 })
      )
    })
  })
})
