import { create } from 'zustand'
import type { ProductCardData } from '@/components/products/product-card'

interface QuickViewStore {
  isOpen: boolean
  product: ProductCardData | null
  openQuickView: (product: ProductCardData) => void
  closeQuickView: () => void
}

export const useQuickViewStore = create<QuickViewStore>()((set) => ({
  isOpen: false,
  product: null,

  openQuickView: (product) => {
    set({ isOpen: true, product })
  },

  closeQuickView: () => {
    set({ isOpen: false, product: null })
  },
}))
