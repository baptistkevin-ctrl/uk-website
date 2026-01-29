import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCartStore, useCart, CartProduct, MultibuyOffer } from '@/hooks/use-cart'

// Mock fetch
global.fetch = vi.fn()

describe('useCartStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.setState({
      items: [],
      offers: [],
      isOpen: false,
      offersLoaded: false,
    })
    vi.clearAllMocks()
  })

  const mockProduct: CartProduct = {
    id: 'product-1',
    name: 'Test Product',
    slug: 'test-product',
    price_pence: 299,
    image_url: 'https://example.com/image.jpg',
    stock_quantity: 100,
  }

  const mockProduct2: CartProduct = {
    id: 'product-2',
    name: 'Second Product',
    slug: 'second-product',
    price_pence: 499,
    image_url: 'https://example.com/image2.jpg',
    stock_quantity: 50,
  }

  describe('addItem', () => {
    it('adds a new item to cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].product.id).toBe('product-1')
      expect(result.current.items[0].quantity).toBe(1)
    })

    it('adds item with specified quantity', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 5)
      })

      expect(result.current.items[0].quantity).toBe(5)
    })

    it('increases quantity when adding existing item', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 2)
        result.current.addItem(mockProduct, 3)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(5)
    })

    it('handles multiple different products', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.addItem(mockProduct2)
      })

      expect(result.current.items).toHaveLength(2)
    })
  })

  describe('removeItem', () => {
    it('removes item from cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.addItem(mockProduct2)
        result.current.removeItem('product-1')
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].product.id).toBe('product-2')
    })

    it('handles removing non-existent item gracefully', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.removeItem('non-existent')
      })

      expect(result.current.items).toHaveLength(1)
    })
  })

  describe('updateQuantity', () => {
    it('updates quantity for existing item', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 1)
        result.current.updateQuantity('product-1', 10)
      })

      expect(result.current.items[0].quantity).toBe(10)
    })

    it('removes item when quantity is 0', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.updateQuantity('product-1', 0)
      })

      expect(result.current.items).toHaveLength(0)
    })

    it('removes item when quantity is negative', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.updateQuantity('product-1', -1)
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('clearCart', () => {
    it('removes all items from cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.addItem(mockProduct2)
        result.current.clearCart()
      })

      expect(result.current.items).toHaveLength(0)
      expect(result.current.offers).toHaveLength(0)
    })
  })

  describe('cart visibility', () => {
    it('opens cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.openCart()
      })

      expect(result.current.isOpen).toBe(true)
    })

    it('closes cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.openCart()
        result.current.closeCart()
      })

      expect(result.current.isOpen).toBe(false)
    })

    it('toggles cart', () => {
      const { result } = renderHook(() => useCartStore())

      expect(result.current.isOpen).toBe(false)

      act(() => {
        result.current.toggleCart()
      })
      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.toggleCart()
      })
      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('offers', () => {
    it('sets offers', () => {
      const { result } = renderHook(() => useCartStore())
      const mockOffers: MultibuyOffer[] = [
        {
          id: 'offer-1',
          product_id: 'product-1',
          quantity: 3,
          offer_price_pence: 600,
          badge_text: '3 for £6',
        },
      ]

      act(() => {
        result.current.setOffers(mockOffers)
      })

      expect(result.current.offers).toEqual(mockOffers)
      expect(result.current.offersLoaded).toBe(true)
    })
  })
})

describe('useCart', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      offers: [],
      isOpen: false,
      offersLoaded: false,
    })
    vi.clearAllMocks()
  })

  const mockProduct: CartProduct = {
    id: 'product-1',
    name: 'Test Product',
    slug: 'test-product',
    price_pence: 200, // £2.00 each
    image_url: null,
    stock_quantity: 100,
  }

  describe('computed values', () => {
    it('calculates correct item count', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct, 3)
      })

      expect(result.current.itemCount).toBe(3)
    })

    it('calculates correct subtotal', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct, 5) // 5 x £2.00 = £10.00 = 1000 pence
      })

      expect(result.current.subtotal).toBe(1000)
    })

    it('calculates subtotal for multiple products', () => {
      const { result } = renderHook(() => useCart())
      const product2: CartProduct = {
        ...mockProduct,
        id: 'product-2',
        price_pence: 300, // £3.00
      }

      act(() => {
        result.current.addItem(mockProduct, 2) // 2 x £2.00 = £4.00
        result.current.addItem(product2, 3) // 3 x £3.00 = £9.00
      })

      expect(result.current.subtotal).toBe(1300) // £13.00
    })
  })

  describe('multi-buy offers', () => {
    it('applies multi-buy offer correctly', () => {
      const offer: MultibuyOffer = {
        id: 'offer-1',
        product_id: 'product-1',
        quantity: 3,
        offer_price_pence: 500, // 3 for £5.00 (normally £6.00)
        badge_text: '3 for £5',
      }

      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct, 3)
        result.current.setOffers([offer])
      })

      // Original: 3 x £2.00 = £6.00 (600 pence)
      // With offer: £5.00 (500 pence)
      // Savings: £1.00 (100 pence)
      expect(result.current.subtotalBeforeDiscounts).toBe(600)
      expect(result.current.subtotal).toBe(500)
      expect(result.current.totalSavings).toBe(100)
      expect(result.current.hasOffersApplied).toBe(true)
    })

    it('applies multiple sets of offer', () => {
      const offer: MultibuyOffer = {
        id: 'offer-1',
        product_id: 'product-1',
        quantity: 2,
        offer_price_pence: 350, // 2 for £3.50 (normally £4.00)
        badge_text: '2 for £3.50',
      }

      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct, 5) // 2 sets of offer + 1 regular
        result.current.setOffers([offer])
      })

      // Original: 5 x £2.00 = £10.00 (1000 pence)
      // With offer: 2x(£3.50) + 1x(£2.00) = £9.00 (900 pence)
      // Savings: £1.00 (100 pence)
      expect(result.current.subtotalBeforeDiscounts).toBe(1000)
      expect(result.current.subtotal).toBe(900)
      expect(result.current.totalSavings).toBe(100)
    })

    it('does not apply offer when quantity insufficient', () => {
      const offer: MultibuyOffer = {
        id: 'offer-1',
        product_id: 'product-1',
        quantity: 3,
        offer_price_pence: 500,
        badge_text: '3 for £5',
      }

      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct, 2) // Only 2, need 3 for offer
        result.current.setOffers([offer])
      })

      expect(result.current.subtotal).toBe(400) // 2 x £2.00 = £4.00 (no discount)
      expect(result.current.totalSavings).toBe(0)
      expect(result.current.hasOffersApplied).toBe(false)
    })

    it('handles items without offers', () => {
      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct, 5)
        result.current.setOffers([]) // No offers
      })

      expect(result.current.subtotal).toBe(1000)
      expect(result.current.totalSavings).toBe(0)
      expect(result.current.hasOffersApplied).toBe(false)
    })
  })

  describe('itemsWithSavings', () => {
    it('includes savings info for items with offers', () => {
      const offer: MultibuyOffer = {
        id: 'offer-1',
        product_id: 'product-1',
        quantity: 3,
        offer_price_pence: 500,
        badge_text: '3 for £5',
      }

      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct, 4)
        result.current.setOffers([offer])
      })

      const item = result.current.itemsWithSavings[0]

      expect(item.offerApplied).toBe(true)
      expect(item.offerQuantity).toBe(3)
      expect(item.regularQuantity).toBe(1)
      expect(item.originalPrice).toBe(800) // 4 x £2.00
      expect(item.discountedPrice).toBe(700) // £5.00 + £2.00
      expect(item.savings).toBe(100)
      expect(item.offerBadge).toBe('3 for £5')
    })

    it('generates default offer badge text', () => {
      const offer: MultibuyOffer = {
        id: 'offer-1',
        product_id: 'product-1',
        quantity: 2,
        offer_price_pence: 350,
        badge_text: null,
      }

      const { result } = renderHook(() => useCart())

      act(() => {
        result.current.addItem(mockProduct, 2)
        result.current.setOffers([offer])
      })

      const item = result.current.itemsWithSavings[0]
      expect(item.offerBadge).toBe('2 for £3.50')
    })
  })
})
