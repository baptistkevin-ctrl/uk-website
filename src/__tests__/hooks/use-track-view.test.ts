import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTrackView, trackProductView } from '@/hooks/use-track-view'

// Mock the recently viewed store
const mockAddProduct = vi.fn()
vi.mock('@/stores/recently-viewed-store', () => ({
  useRecentlyViewedStore: () => ({
    addProduct: mockAddProduct,
  }),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useTrackView Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    slug: 'test-product',
    price_pence: 999,
    original_price_pence: 1299,
    image_url: 'https://example.com/image.jpg',
    category_name: 'Fresh Produce',
    avg_rating: 4.5,
    review_count: 42,
  }

  describe('Initial Tracking', () => {
    it('tracks product view on mount', () => {
      renderHook(() => useTrackView(mockProduct))

      expect(mockAddProduct).toHaveBeenCalledTimes(1)
      expect(mockAddProduct).toHaveBeenCalledWith({
        product_id: 'product-123',
        name: 'Test Product',
        slug: 'test-product',
        price_pence: 999,
        original_price_pence: 1299,
        image_url: 'https://example.com/image.jpg',
        category_name: 'Fresh Produce',
        avg_rating: 4.5,
        review_count: 42,
      })
    })

    it('does not track when product is null', () => {
      renderHook(() => useTrackView(null))

      expect(mockAddProduct).not.toHaveBeenCalled()
    })

    it('only tracks once per mount', () => {
      const { rerender } = renderHook(
        ({ product }) => useTrackView(product),
        { initialProps: { product: mockProduct } }
      )

      expect(mockAddProduct).toHaveBeenCalledTimes(1)

      // Rerender with same product
      rerender({ product: mockProduct })

      // Should still be called only once
      expect(mockAddProduct).toHaveBeenCalledTimes(1)
    })
  })

  describe('Product Data Mapping', () => {
    it('handles product with null optional fields', () => {
      const minimalProduct = {
        id: 'product-min',
        name: 'Minimal Product',
        slug: 'minimal-product',
        price_pence: 500,
        original_price_pence: null,
        image_url: null,
        category_name: null,
        avg_rating: null,
        review_count: null,
      }

      renderHook(() => useTrackView(minimalProduct))

      expect(mockAddProduct).toHaveBeenCalledWith({
        product_id: 'product-min',
        name: 'Minimal Product',
        slug: 'minimal-product',
        price_pence: 500,
        original_price_pence: null,
        image_url: null,
        category_name: null,
        avg_rating: null,
        review_count: null,
      })
    })

    it('handles product with undefined optional fields', () => {
      const partialProduct = {
        id: 'product-partial',
        name: 'Partial Product',
        slug: 'partial-product',
        price_pence: 750,
        image_url: null,
      }

      renderHook(() => useTrackView(partialProduct))

      expect(mockAddProduct).toHaveBeenCalledWith({
        product_id: 'product-partial',
        name: 'Partial Product',
        slug: 'partial-product',
        price_pence: 750,
        original_price_pence: undefined,
        image_url: null,
        category_name: undefined,
        avg_rating: undefined,
        review_count: undefined,
      })
    })
  })

  describe('Remounting Behavior', () => {
    it('tracks again on new mount', () => {
      const { unmount } = renderHook(() => useTrackView(mockProduct))

      expect(mockAddProduct).toHaveBeenCalledTimes(1)

      unmount()

      // Mount again
      renderHook(() => useTrackView(mockProduct))

      expect(mockAddProduct).toHaveBeenCalledTimes(2)
    })
  })
})

describe('trackProductView Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends POST request to track view', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await trackProductView('product-123')

    expect(mockFetch).toHaveBeenCalledWith('/api/recently-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: 'product-123',
        session_id: undefined,
      }),
    })
  })

  it('includes session ID when provided', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await trackProductView('product-456', 'session-abc')

    expect(mockFetch).toHaveBeenCalledWith('/api/recently-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: 'product-456',
        session_id: 'session-abc',
      }),
    })
  })

  it('handles API error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Should not throw
    await trackProductView('product-error')

    expect(consoleError).toHaveBeenCalledWith('Failed to track view:', expect.any(Error))

    consoleError.mockRestore()
  })

  it('handles non-ok response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    // Should not throw
    await trackProductView('product-500')

    expect(mockFetch).toHaveBeenCalled()
  })
})
