'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Product type for recently viewed items
export interface RecentlyViewedProduct {
  id: string
  name: string
  slug: string
  price_pence: number
  original_price_pence?: number | null
  image_url: string | null
  category_name?: string | null
  avg_rating?: number | null
  review_count?: number | null
  in_stock?: boolean
  unit?: string | null
  unit_value?: number | null
}

// Internal storage type with timestamp
interface StoredProduct extends RecentlyViewedProduct {
  viewed_at: string
  view_count: number
}

const STORAGE_KEY = 'recently-viewed-products'
const MAX_PRODUCTS = 20
const SYNC_DEBOUNCE_MS = 1000

// Helper to safely access localStorage
const getFromStorage = (): StoredProduct[] => {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const setToStorage = (products: StoredProduct[]): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export interface UseRecentlyViewedOptions {
  maxProducts?: number
  excludeProductId?: string
  syncWithServer?: boolean
}

export interface UseRecentlyViewedReturn {
  products: RecentlyViewedProduct[]
  isLoading: boolean
  isEmpty: boolean
  totalCount: number
  addProduct: (product: RecentlyViewedProduct) => void
  removeProduct: (productId: string) => void
  clearAll: () => void
  refreshFromServer: () => Promise<void>
}

export function useRecentlyViewed(
  options: UseRecentlyViewedOptions = {}
): UseRecentlyViewedReturn {
  const {
    maxProducts = MAX_PRODUCTS,
    excludeProductId,
    syncWithServer = true,
  } = options

  const [storedProducts, setStoredProducts] = useState<StoredProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Load from localStorage on mount
  useEffect(() => {
    const products = getFromStorage()
    setStoredProducts(products)
    setIsLoading(false)

    return () => {
      isMountedRef.current = false
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  // Sync with server (debounced)
  const syncToServer = useCallback(async () => {
    if (!syncWithServer) return

    try {
      const response = await fetch('/api/recently-viewed', {
        method: 'GET',
      })

      if (response.ok && isMountedRef.current) {
        const data = await response.json()
        if (data.products && Array.isArray(data.products)) {
          // Merge server products with local ones
          const localProducts = getFromStorage()
          const serverProductIds = new Set(data.products.map((p: StoredProduct) => p.id))

          // Keep local products that aren't on server
          const mergedProducts = [
            ...data.products,
            ...localProducts.filter(p => !serverProductIds.has(p.id))
          ]
            .sort((a, b) => new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime())
            .slice(0, maxProducts)

          setStoredProducts(mergedProducts)
          setToStorage(mergedProducts)
        }
      }
    } catch (error) {
      // Silently fail - server sync is not critical
      console.debug('Failed to sync with server:', error)
    }
  }, [syncWithServer, maxProducts])

  // Refresh from server on mount
  useEffect(() => {
    if (syncWithServer) {
      syncToServer()
    }
  }, [syncWithServer, syncToServer])

  // Add a product to recently viewed
  const addProduct = useCallback((product: RecentlyViewedProduct) => {
    setStoredProducts(currentProducts => {
      const now = new Date().toISOString()
      const existingIndex = currentProducts.findIndex(p => p.id === product.id)

      let newProducts: StoredProduct[]

      if (existingIndex !== -1) {
        // Move existing product to front and update view count
        const existing = currentProducts[existingIndex]
        newProducts = [
          {
            ...existing,
            ...product,
            viewed_at: now,
            view_count: existing.view_count + 1,
          },
          ...currentProducts.filter((_, i) => i !== existingIndex),
        ]
      } else {
        // Add new product at front
        newProducts = [
          {
            ...product,
            viewed_at: now,
            view_count: 1,
          },
          ...currentProducts,
        ].slice(0, maxProducts)
      }

      // Save to localStorage
      setToStorage(newProducts)

      // Debounced server sync
      if (syncWithServer) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current)
        }
        syncTimeoutRef.current = setTimeout(() => {
          fetch('/api/recently-viewed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: product.id }),
          }).catch(console.debug)
        }, SYNC_DEBOUNCE_MS)
      }

      return newProducts
    })
  }, [maxProducts, syncWithServer])

  // Remove a product
  const removeProduct = useCallback((productId: string) => {
    setStoredProducts(currentProducts => {
      const newProducts = currentProducts.filter(p => p.id !== productId)
      setToStorage(newProducts)

      // Sync removal to server
      if (syncWithServer) {
        fetch(`/api/recently-viewed?product_id=${productId}`, {
          method: 'DELETE',
        }).catch(console.debug)
      }

      return newProducts
    })
  }, [syncWithServer])

  // Clear all products
  const clearAll = useCallback(() => {
    setStoredProducts([])
    setToStorage([])

    if (syncWithServer) {
      fetch('/api/recently-viewed', {
        method: 'DELETE',
      }).catch(console.debug)
    }
  }, [syncWithServer])

  // Manual refresh from server
  const refreshFromServer = useCallback(async () => {
    setIsLoading(true)
    await syncToServer()
    setIsLoading(false)
  }, [syncToServer])

  // Filter and return products
  const products = storedProducts
    .filter(p => p.id !== excludeProductId)
    .slice(0, maxProducts)
    .map(({ viewed_at, view_count, ...product }) => product)

  return {
    products,
    isLoading,
    isEmpty: products.length === 0,
    totalCount: storedProducts.length,
    addProduct,
    removeProduct,
    clearAll,
    refreshFromServer,
  }
}

// Export a hook specifically for tracking product views (to be used on product pages)
export function useTrackProductView(product: RecentlyViewedProduct | null) {
  const { addProduct } = useRecentlyViewed({ syncWithServer: true })
  const trackedRef = useRef<string | null>(null)

  useEffect(() => {
    if (product && product.id !== trackedRef.current) {
      trackedRef.current = product.id
      addProduct(product)
    }
  }, [product, addProduct])
}
