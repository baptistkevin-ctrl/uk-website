/**
 * Product Service Tests — Solaris Testing Standard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { productService } from '@/services/product.service'
import { productRepository } from '@/repositories/product.repository'

vi.mock('@/repositories/product.repository', () => ({
  productRepository: {
    findById: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
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

const mockRepo = vi.mocked(productRepository)

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getById', () => {
    it('should return product when found', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'prod-1',
        name: 'Organic Milk',
        price_pence: 199,
      })

      const result = await productService.getById('prod-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.name).toBe('Organic Milk')
      }
    })

    it('should return NOT_FOUND when product does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null)

      const result = await productService.getById('nonexistent')

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('NOT_FOUND')
      }
    })
  })

  describe('create', () => {
    it('should create product with valid data', async () => {
      mockRepo.create.mockResolvedValue({
        id: 'prod-new',
        name: 'Fresh Bread',
        price_pence: 150,
      })

      const result = await productService.create({
        name: 'Fresh Bread',
        price_pence: 150,
        description: 'Freshly baked',
      })

      expect(result.ok).toBe(true)
    })

    it('should fail when name is missing', async () => {
      const result = await productService.create({
        price_pence: 150,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('should fail when price is missing', async () => {
      const result = await productService.create({
        name: 'Test',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('should strip non-whitelisted fields (mass assignment protection)', async () => {
      mockRepo.create.mockResolvedValue({ id: 'prod-new', name: 'Test', price_pence: 100 })

      await productService.create({
        name: 'Test',
        price_pence: 100,
        role: 'admin',           // Should be stripped
        is_superuser: true,      // Should be stripped
      })

      // Verify repo was called without the dangerous fields
      const calledWith = mockRepo.create.mock.calls[0][0]
      expect(calledWith).not.toHaveProperty('role')
      expect(calledWith).not.toHaveProperty('is_superuser')
    })

    it('should set vendor_id when provided', async () => {
      mockRepo.create.mockResolvedValue({ id: 'prod-new', name: 'Test', price_pence: 100 })

      await productService.create({ name: 'Test', price_pence: 100 }, 'vendor-123')

      const calledWith = mockRepo.create.mock.calls[0][0]
      expect(calledWith.vendor_id).toBe('vendor-123')
    })
  })

  describe('update', () => {
    it('should update with valid fields', async () => {
      mockRepo.update.mockResolvedValue({
        id: 'prod-1',
        name: 'Updated Name',
        price_pence: 250,
      })

      const result = await productService.update('prod-1', { name: 'Updated Name' })

      expect(result.ok).toBe(true)
    })

    it('should fail when no valid fields provided', async () => {
      const result = await productService.update('prod-1', {
        invalid_field: 'value',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })
  })

  describe('softDelete', () => {
    it('should soft-delete product', async () => {
      mockRepo.softDelete.mockResolvedValue(undefined)

      const result = await productService.softDelete('prod-1')

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.deleted).toBe(true)
      }
    })
  })

  describe('list', () => {
    it('should return paginated products', async () => {
      mockRepo.findMany.mockResolvedValue({
        data: [{ id: '1' }, { id: '2' }],
        total: 100,
      })

      const result = await productService.list({ page: 1, limit: 20 })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.products).toHaveLength(2)
        expect(result.data.total).toBe(100)
      }
    })
  })
})
