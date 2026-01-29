import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useWishlistStore, useWishlist } from '@/hooks/use-wishlist'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useWishlistStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    // Reset the store state
    useWishlistStore.setState({
      productIds: new Set(),
      isLoading: false,
      isInitialized: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('starts with empty wishlist', () => {
      const { result } = renderHook(() => useWishlistStore())

      expect(result.current.productIds.size).toBe(0)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isInitialized).toBe(false)
    })
  })

  describe('addToWishlist', () => {
    it('optimistically adds product to wishlist', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.addToWishlist('product-123')
      })

      expect(result.current.productIds.has('product-123')).toBe(true)
    })

    it('calls API to add product', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.addToWishlist('product-456')
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: 'product-456' }),
      })
    })

    it('reverts on API error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.addToWishlist('product-789')
      })

      // Should revert because API failed
      expect(result.current.productIds.has('product-789')).toBe(false)
    })

    it('reverts on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.addToWishlist('product-error')
      })

      expect(result.current.productIds.has('product-error')).toBe(false)
      expect(consoleError).toHaveBeenCalledWith('Failed to add to wishlist:', expect.any(Error))

      consoleError.mockRestore()
    })
  })

  describe('removeFromWishlist', () => {
    it('optimistically removes product from wishlist', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useWishlistStore())

      // First add a product
      act(() => {
        useWishlistStore.setState({ productIds: new Set(['product-123']) })
      })

      expect(result.current.productIds.has('product-123')).toBe(true)

      await act(async () => {
        await result.current.removeFromWishlist('product-123')
      })

      expect(result.current.productIds.has('product-123')).toBe(false)
    })

    it('reverts on API error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      const { result } = renderHook(() => useWishlistStore())

      act(() => {
        useWishlistStore.setState({ productIds: new Set(['product-456']) })
      })

      await act(async () => {
        await result.current.removeFromWishlist('product-456')
      })

      // Should revert because API failed
      expect(result.current.productIds.has('product-456')).toBe(true)
    })

    it('reverts on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useWishlistStore())

      act(() => {
        useWishlistStore.setState({ productIds: new Set(['product-789']) })
      })

      await act(async () => {
        await result.current.removeFromWishlist('product-789')
      })

      expect(result.current.productIds.has('product-789')).toBe(true)
      expect(consoleError).toHaveBeenCalledWith('Failed to remove from wishlist:', expect.any(Error))

      consoleError.mockRestore()
    })
  })

  describe('toggleWishlist', () => {
    it('adds product when not in wishlist', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.toggleWishlist('product-new')
      })

      expect(result.current.productIds.has('product-new')).toBe(true)
    })

    it('removes product when in wishlist', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useWishlistStore())

      act(() => {
        useWishlistStore.setState({ productIds: new Set(['product-existing']) })
      })

      await act(async () => {
        await result.current.toggleWishlist('product-existing')
      })

      expect(result.current.productIds.has('product-existing')).toBe(false)
    })
  })

  describe('isInWishlist', () => {
    it('returns true when product is in wishlist', () => {
      const { result } = renderHook(() => useWishlistStore())

      act(() => {
        useWishlistStore.setState({ productIds: new Set(['product-123', 'product-456']) })
      })

      expect(result.current.isInWishlist('product-123')).toBe(true)
      expect(result.current.isInWishlist('product-456')).toBe(true)
    })

    it('returns false when product is not in wishlist', () => {
      const { result } = renderHook(() => useWishlistStore())

      act(() => {
        useWishlistStore.setState({ productIds: new Set(['product-123']) })
      })

      expect(result.current.isInWishlist('product-999')).toBe(false)
    })
  })

  describe('syncWithServer', () => {
    it('fetches wishlist from server', async () => {
      const serverData = {
        wishlists: [
          {
            wishlist_items: [
              { product_id: 'server-product-1' },
              { product_id: 'server-product-2' },
            ]
          }
        ]
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(serverData),
      })

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.syncWithServer()
      })

      expect(result.current.productIds.has('server-product-1')).toBe(true)
      expect(result.current.productIds.has('server-product-2')).toBe(true)
      expect(result.current.isInitialized).toBe(true)
    })

    it('sets loading state during sync', async () => {
      let resolvePromise: (value: any) => void
      const fetchPromise = new Promise(resolve => { resolvePromise = resolve })

      mockFetch.mockReturnValueOnce(fetchPromise)

      const { result } = renderHook(() => useWishlistStore())

      const syncPromise = act(async () => {
        result.current.syncWithServer()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ wishlists: [] }),
      })

      await syncPromise

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('handles API error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.syncWithServer()
      })

      expect(result.current.isLoading).toBe(false)
      // Should not crash, just fail silently

      consoleError.mockRestore()
    })

    it('handles network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useWishlistStore())

      await act(async () => {
        await result.current.syncWithServer()
      })

      expect(result.current.isLoading).toBe(false)
      expect(consoleError).toHaveBeenCalledWith('Failed to sync wishlist:', expect.any(Error))

      consoleError.mockRestore()
    })
  })

  describe('clearWishlist', () => {
    it('clears all products from wishlist', () => {
      const { result } = renderHook(() => useWishlistStore())

      act(() => {
        useWishlistStore.setState({ productIds: new Set(['p1', 'p2', 'p3']) })
      })

      expect(result.current.productIds.size).toBe(3)

      act(() => {
        result.current.clearWishlist()
      })

      expect(result.current.productIds.size).toBe(0)
    })
  })
})

describe('useWishlist Hook Wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    useWishlistStore.setState({
      productIds: new Set(),
      isLoading: false,
      isInitialized: false,
    })
  })

  it('returns wishlistCount computed from productIds', () => {
    const { result } = renderHook(() => useWishlist())

    act(() => {
      useWishlistStore.setState({ productIds: new Set(['p1', 'p2', 'p3', 'p4', 'p5']) })
    })

    expect(result.current.wishlistCount).toBe(5)
  })

  it('returns 0 when wishlist is empty', () => {
    const { result } = renderHook(() => useWishlist())

    expect(result.current.wishlistCount).toBe(0)
  })

  it('includes all store methods', () => {
    const { result } = renderHook(() => useWishlist())

    expect(result.current).toHaveProperty('productIds')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isInitialized')
    expect(result.current).toHaveProperty('addToWishlist')
    expect(result.current).toHaveProperty('removeFromWishlist')
    expect(result.current).toHaveProperty('toggleWishlist')
    expect(result.current).toHaveProperty('isInWishlist')
    expect(result.current).toHaveProperty('syncWithServer')
    expect(result.current).toHaveProperty('clearWishlist')
    expect(result.current).toHaveProperty('wishlistCount')
  })

  it('updates wishlistCount when products are added', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useWishlist())

    expect(result.current.wishlistCount).toBe(0)

    await act(async () => {
      await result.current.addToWishlist('product-1')
    })

    expect(result.current.wishlistCount).toBe(1)

    await act(async () => {
      await result.current.addToWishlist('product-2')
    })

    expect(result.current.wishlistCount).toBe(2)
  })

  it('updates wishlistCount when products are removed', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useWishlist())

    act(() => {
      useWishlistStore.setState({ productIds: new Set(['p1', 'p2', 'p3']) })
    })

    expect(result.current.wishlistCount).toBe(3)

    await act(async () => {
      await result.current.removeFromWishlist('p1')
    })

    expect(result.current.wishlistCount).toBe(2)
  })
})
