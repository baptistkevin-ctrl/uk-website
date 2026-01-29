'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  productIds: Set<string>
  isLoading: boolean
  isInitialized: boolean
  addToWishlist: (productId: string) => Promise<void>
  removeFromWishlist: (productId: string) => Promise<void>
  toggleWishlist: (productId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  syncWithServer: () => Promise<void>
  clearWishlist: () => void
}

// Create the store with Set serialization
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: new Set<string>(),
      isLoading: false,
      isInitialized: false,

      addToWishlist: async (productId: string) => {
        const currentIds = get().productIds
        // Optimistic update
        set({ productIds: new Set([...currentIds, productId]) })

        try {
          const res = await fetch('/api/wishlist/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId }),
          })

          if (!res.ok) {
            // Revert on error
            const newIds = new Set(currentIds)
            newIds.delete(productId)
            set({ productIds: newIds })
          }
        } catch (error) {
          // Revert on error
          const newIds = new Set(currentIds)
          newIds.delete(productId)
          set({ productIds: newIds })
          console.error('Failed to add to wishlist:', error)
        }
      },

      removeFromWishlist: async (productId: string) => {
        const currentIds = get().productIds
        // Optimistic update
        const newIds = new Set(currentIds)
        newIds.delete(productId)
        set({ productIds: newIds })

        try {
          const res = await fetch('/api/wishlist/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId }),
          })

          if (!res.ok) {
            // Revert on error
            set({ productIds: new Set([...currentIds, productId]) })
          }
        } catch (error) {
          // Revert on error
          set({ productIds: new Set([...currentIds, productId]) })
          console.error('Failed to remove from wishlist:', error)
        }
      },

      toggleWishlist: async (productId: string) => {
        const isInWishlist = get().productIds.has(productId)
        if (isInWishlist) {
          await get().removeFromWishlist(productId)
        } else {
          await get().addToWishlist(productId)
        }
      },

      isInWishlist: (productId: string) => {
        return get().productIds.has(productId)
      },

      syncWithServer: async () => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/wishlist')
          if (res.ok) {
            const data = await res.json()
            const productIds = new Set<string>()

            data.wishlists?.forEach((wishlist: { wishlist_items: { product_id: string }[] }) => {
              wishlist.wishlist_items?.forEach((item: { product_id: string }) => {
                if (item.product_id) {
                  productIds.add(item.product_id)
                }
              })
            })

            set({ productIds, isInitialized: true })
          }
        } catch (error) {
          console.error('Failed to sync wishlist:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      clearWishlist: () => {
        set({ productIds: new Set() })
      },
    }),
    {
      name: 'wishlist-storage',
      // Custom serialization for Set
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const parsed = JSON.parse(str)
          return {
            ...parsed,
            state: {
              ...parsed.state,
              productIds: new Set(parsed.state.productIds || []),
            },
          }
        },
        setItem: (name, value) => {
          const serialized = {
            ...value,
            state: {
              ...value.state,
              productIds: Array.from(value.state.productIds || []),
            },
          }
          localStorage.setItem(name, JSON.stringify(serialized))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({
        productIds: state.productIds,
      }) as WishlistState,
    }
  )
)

// Hook wrapper with additional functionality
export function useWishlist() {
  const store = useWishlistStore()

  return {
    ...store,
    wishlistCount: store.productIds.size,
  }
}
