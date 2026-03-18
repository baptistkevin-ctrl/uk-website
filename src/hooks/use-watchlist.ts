'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchlistItem {
  productId: string
  note?: string
  addedAt: number
}

interface WatchlistState {
  items: Map<string, WatchlistItem>
  isLoading: boolean
  addToWatchlist: (productId: string, note?: string) => void
  removeFromWatchlist: (productId: string) => void
  toggleWatchlist: (productId: string) => void
  isInWatchlist: (productId: string) => boolean
  updateNote: (productId: string, note: string) => void
  clearWatchlist: () => void
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: new Map<string, WatchlistItem>(),
      isLoading: false,

      addToWatchlist: (productId: string, note?: string) => {
        const currentItems = new Map(get().items)
        currentItems.set(productId, {
          productId,
          note,
          addedAt: Date.now(),
        })
        set({ items: currentItems })
      },

      removeFromWatchlist: (productId: string) => {
        const currentItems = new Map(get().items)
        currentItems.delete(productId)
        set({ items: currentItems })
      },

      toggleWatchlist: (productId: string) => {
        if (get().items.has(productId)) {
          get().removeFromWatchlist(productId)
        } else {
          get().addToWatchlist(productId)
        }
      },

      isInWatchlist: (productId: string) => {
        return get().items.has(productId)
      },

      updateNote: (productId: string, note: string) => {
        const currentItems = new Map(get().items)
        const existing = currentItems.get(productId)
        if (existing) {
          currentItems.set(productId, { ...existing, note })
          set({ items: currentItems })
        }
      },

      clearWatchlist: () => {
        set({ items: new Map() })
      },
    }),
    {
      name: 'watchlist-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const parsed = JSON.parse(str)
          return {
            ...parsed,
            state: {
              ...parsed.state,
              items: new Map(parsed.state.items || []),
            },
          }
        },
        setItem: (name, value) => {
          const serialized = {
            ...value,
            state: {
              ...value.state,
              items: Array.from(value.state.items || new Map()),
            },
          }
          localStorage.setItem(name, JSON.stringify(serialized))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({
        items: state.items,
      }) as WatchlistState,
    }
  )
)

export function useWatchlist() {
  const store = useWatchlistStore()

  return {
    ...store,
    watchlistCount: store.items.size,
  }
}
