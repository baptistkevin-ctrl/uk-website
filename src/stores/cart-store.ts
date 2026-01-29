import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  product_id?: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
  quantity: number
  unit?: string
  unit_value?: number
  stock_quantity?: number
  vendor_id?: string | null
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean

  // Actions
  addItem: (item: Omit<CartItem, 'id'> & { id?: string; product_id?: string }) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  // Computed
  getItemCount: () => number
  getSubtotal: () => number
  getItem: (productId: string) => CartItem | undefined
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const { items } = get()
        // Support both id and product_id
        const itemId = item.id || item.product_id || ''

        const existingItem = items.find(
          (i) => i.id === itemId || i.product_id === itemId
        )

        if (existingItem) {
          // Update quantity if item already exists
          set({
            items: items.map((i) =>
              i.id === existingItem.id
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            ),
          })
        } else {
          // Add new item
          const newItem: CartItem = {
            id: itemId,
            product_id: item.product_id || itemId,
            name: item.name,
            slug: item.slug,
            price_pence: item.price_pence,
            image_url: item.image_url,
            quantity: item.quantity || 1,
            unit: item.unit,
            unit_value: item.unit_value,
            stock_quantity: item.stock_quantity,
            vendor_id: item.vendor_id,
          }
          set({ items: [...items, newItem] })
        }
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId && i.product_id !== itemId),
        }))
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId || i.product_id === itemId
              ? { ...i, quantity }
              : i
          ),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }))
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price_pence * item.quantity,
          0
        )
      },

      getItem: (productId) => {
        return get().items.find(
          (i) => i.id === productId || i.product_id === productId
        )
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
)
