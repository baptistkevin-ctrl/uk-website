'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Simplified product type for cart storage
export interface CartProduct {
  id: string
  name: string
  slug: string
  price_pence: number
  image_url: string | null
  compare_at_price_pence?: number | null
  unit?: string | null
  unit_value?: number | null
  stock_quantity?: number
  track_inventory?: boolean
  allow_backorder?: boolean
  low_stock_threshold?: number
  vendor_id?: string | null
}

export interface MultibuyOffer {
  id: string
  product_id: string
  quantity: number
  offer_price_pence: number
  badge_text: string | null
}

export interface CartItem {
  product: CartProduct
  quantity: number
}

export interface CartItemWithSavings extends CartItem {
  offerApplied: boolean
  offerQuantity: number
  regularQuantity: number
  originalPrice: number
  discountedPrice: number
  savings: number
  offerBadge: string | null
}

interface CartState {
  items: CartItem[]
  offers: MultibuyOffer[]
  isOpen: boolean
  offersLoaded: boolean
  addItem: (product: CartProduct, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  setOffers: (offers: MultibuyOffer[]) => void
  fetchOffers: () => Promise<void>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      offers: [],
      isOpen: false,
      offersLoaded: false,

      addItem: (product: CartProduct, quantity = 1) => {
        const items = get().items
        const existingItem = items.find((item) => item.product.id === product.id)

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          })
        } else {
          set({ items: [...items, { product, quantity }] })
        }

        // Fetch offers when items change
        get().fetchOffers()
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((item) => item.product.id !== productId) })
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        })
      },

      clearCart: () => set({ items: [], offers: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      setOffers: (offers: MultibuyOffer[]) => set({ offers, offersLoaded: true }),

      fetchOffers: async () => {
        const items = get().items
        if (items.length === 0) {
          set({ offers: [], offersLoaded: true })
          return
        }

        const productIds = items.map((item) => item.product.id).join(',')
        try {
          const res = await fetch(`/api/offers?products=${productIds}`)
          if (res.ok) {
            const data = await res.json()
            set({ offers: data, offersLoaded: true })
          }
        } catch (error) {
          console.error('Error fetching offers:', error)
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
)

// Calculate savings for a cart item with multi-buy offer
function calculateItemWithSavings(
  item: CartItem,
  offer: MultibuyOffer | undefined
): CartItemWithSavings {
  const originalPrice = item.product.price_pence * item.quantity

  if (!offer || item.quantity < offer.quantity) {
    return {
      ...item,
      offerApplied: false,
      offerQuantity: 0,
      regularQuantity: item.quantity,
      originalPrice,
      discountedPrice: originalPrice,
      savings: 0,
      offerBadge: null,
    }
  }

  // Calculate how many times the offer can be applied
  const offerSets = Math.floor(item.quantity / offer.quantity)
  const offerQuantity = offerSets * offer.quantity
  const regularQuantity = item.quantity % offer.quantity

  // Calculate prices
  const offerPrice = offerSets * offer.offer_price_pence
  const regularPrice = regularQuantity * item.product.price_pence
  const discountedPrice = offerPrice + regularPrice
  const savings = originalPrice - discountedPrice

  return {
    ...item,
    offerApplied: true,
    offerQuantity,
    regularQuantity,
    originalPrice,
    discountedPrice,
    savings,
    offerBadge: offer.badge_text || `${offer.quantity} for £${(offer.offer_price_pence / 100).toFixed(2)}`,
  }
}

// Hook wrapper with computed values
export function useCart() {
  const store = useCartStore()

  // Create a map of offers by product_id for quick lookup
  const offersMap = new Map<string, MultibuyOffer>()
  store.offers.forEach((offer) => {
    if (offer.product_id) {
      offersMap.set(offer.product_id, offer)
    }
  })

  // Calculate items with savings
  const itemsWithSavings: CartItemWithSavings[] = store.items.map((item) => {
    const offer = offersMap.get(item.product.id)
    return calculateItemWithSavings(item, offer)
  })

  const itemCount = store.items.reduce((total, item) => total + item.quantity, 0)

  // Original subtotal (before discounts)
  const subtotalBeforeDiscounts = itemsWithSavings.reduce(
    (total, item) => total + item.originalPrice,
    0
  )

  // Subtotal after multi-buy discounts
  const subtotal = itemsWithSavings.reduce(
    (total, item) => total + item.discountedPrice,
    0
  )

  // Total savings from multi-buy offers
  const totalSavings = itemsWithSavings.reduce(
    (total, item) => total + item.savings,
    0
  )

  // Check if any offers are applied
  const hasOffersApplied = itemsWithSavings.some((item) => item.offerApplied)

  return {
    ...store,
    itemsWithSavings,
    itemCount,
    subtotal,
    subtotalBeforeDiscounts,
    totalSavings,
    hasOffersApplied,
  }
}
