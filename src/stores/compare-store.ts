import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CompareProduct {
  id: string
  name: string
  slug: string
  image_url: string | null
  price_pence: number
  compare_at_price_pence: number | null
  brand: string | null
  unit: string
  unit_value: number | null
  is_organic: boolean
  is_vegan: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  avg_rating: number
  review_count: number
  short_description: string | null
  stock_quantity: number
  vendor?: {
    business_name: string
    slug: string
  } | null
}

interface CompareStore {
  products: CompareProduct[]
  maxProducts: number

  // Actions
  addProduct: (product: CompareProduct) => boolean
  removeProduct: (productId: string) => void
  clearAll: () => void
  isInCompare: (productId: string) => boolean
  canAdd: () => boolean
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      products: [],
      maxProducts: 4,

      addProduct: (product) => {
        const { products, maxProducts, isInCompare } = get()

        if (isInCompare(product.id)) {
          return false
        }

        if (products.length >= maxProducts) {
          return false
        }

        set({ products: [...products, product] })
        return true
      },

      removeProduct: (productId) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }))
      },

      clearAll: () => {
        set({ products: [] })
      },

      isInCompare: (productId) => {
        return get().products.some((p) => p.id === productId)
      },

      canAdd: () => {
        return get().products.length < get().maxProducts
      },
    }),
    {
      name: 'compare-storage',
    }
  )
)
