import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RecentlyViewedProduct {
  product_id: string
  name: string
  slug: string
  price_pence: number
  original_price_pence?: number | null
  image_url: string | null
  category_name?: string | null
  avg_rating?: number | null
  review_count?: number | null
  viewed_at: string
  view_count: number
}

interface RecentlyViewedState {
  products: RecentlyViewedProduct[]
  maxProducts: number
  isLoggedIn: boolean
  sessionId: string | null

  // Actions
  setIsLoggedIn: (isLoggedIn: boolean) => void
  setSessionId: (sessionId: string) => void
  addProduct: (product: Omit<RecentlyViewedProduct, 'viewed_at' | 'view_count'>) => void
  removeProduct: (productId: string) => void
  clearAll: () => void
  loadFromServer: () => Promise<void>
  syncToServer: () => Promise<void>
  trackView: (productId: string) => Promise<void>
}

// Generate a session ID for anonymous users
const generateSessionId = () => {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      products: [],
      maxProducts: 20,
      isLoggedIn: false,
      sessionId: null,

      setIsLoggedIn: (isLoggedIn: boolean) => {
        set({ isLoggedIn })
        if (isLoggedIn) {
          // Sync local products to server when user logs in
          get().syncToServer()
        }
      },

      setSessionId: (sessionId: string) => {
        set({ sessionId })
      },

      addProduct: (product) => {
        const { products, maxProducts, isLoggedIn, sessionId } = get()
        const now = new Date().toISOString()

        // Check if product already exists
        const existingIndex = products.findIndex(p => p.product_id === product.product_id)

        let updatedProducts: RecentlyViewedProduct[]

        if (existingIndex !== -1) {
          // Update existing - move to front and increment view count
          const existing = products[existingIndex]
          updatedProducts = [
            { ...existing, ...product, viewed_at: now, view_count: existing.view_count + 1 },
            ...products.filter((_, i) => i !== existingIndex)
          ]
        } else {
          // Add new - at the front
          updatedProducts = [
            { ...product, viewed_at: now, view_count: 1 },
            ...products
          ].slice(0, maxProducts)
        }

        set({ products: updatedProducts })

        // Track on server (fire and forget)
        get().trackView(product.product_id)
      },

      removeProduct: (productId: string) => {
        const { products, isLoggedIn } = get()
        set({ products: products.filter(p => p.product_id !== productId) })

        // Also remove from server if logged in
        if (isLoggedIn) {
          fetch(`/api/recently-viewed?product_id=${productId}`, {
            method: 'DELETE'
          }).catch(console.error)
        }
      },

      clearAll: () => {
        const { isLoggedIn } = get()
        set({ products: [] })

        // Also clear on server if logged in
        if (isLoggedIn) {
          fetch('/api/recently-viewed', {
            method: 'DELETE'
          }).catch(console.error)
        }
      },

      loadFromServer: async () => {
        try {
          const res = await fetch('/api/recently-viewed')
          if (res.ok) {
            const data = await res.json()
            if (data.products && data.products.length > 0) {
              // Merge server products with local (server takes precedence for logged in users)
              set({ products: data.products, isLoggedIn: true })
            }
          }
        } catch (error) {
          console.error('Failed to load recently viewed from server:', error)
        }
      },

      syncToServer: async () => {
        const { products, isLoggedIn } = get()

        if (!isLoggedIn || products.length === 0) return

        // Sync each product to server
        for (const product of products.slice(0, 10)) { // Only sync last 10
          try {
            await fetch('/api/recently-viewed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ product_id: product.product_id })
            })
          } catch (error) {
            console.error('Failed to sync product:', error)
          }
        }

        // Reload from server to get merged data
        get().loadFromServer()
      },

      trackView: async (productId: string) => {
        const { sessionId, isLoggedIn } = get()

        // Ensure we have a session ID for anonymous users
        let currentSessionId = sessionId
        if (!currentSessionId) {
          currentSessionId = generateSessionId()
          set({ sessionId: currentSessionId })
        }

        try {
          await fetch('/api/recently-viewed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: productId,
              session_id: currentSessionId
            })
          })
        } catch (error) {
          // Silently fail - view tracking is not critical
          console.error('Failed to track view:', error)
        }
      }
    }),
    {
      name: 'recently-viewed-storage',
      partialize: (state) => ({
        products: state.products,
        sessionId: state.sessionId
      })
    }
  )
)

// Hook to use recently viewed with auto-initialization
export function useRecentlyViewed() {
  const store = useRecentlyViewedStore()
  return store
}
