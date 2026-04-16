'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/hooks/use-cart'

const TRIGGER_DELAY_CHECKOUT = 45_000 // 45 seconds idle on checkout
const TRIGGER_DELAY_HIGH_CART = 30_000 // 30 seconds with high cart value
const HIGH_CART_THRESHOLD = 5000 // £50+
const STORAGE_KEY = 'proactive-chat-shown'

/**
 * Proactive chat triggers that auto-open the chat widget
 * when a customer might need help:
 * 1. Idle on checkout page for 45s
 * 2. High cart value (£50+) and browsing for 30s
 */
export function ProactiveChatTrigger() {
  const pathname = usePathname()
  const { subtotal } = useCart()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [triggered, setTriggered] = useState(false)

  useEffect(() => {
    // Don't trigger if already shown this session
    if (typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY)) return
    if (triggered) return

    const isCheckout = pathname === '/checkout'
    const isHighCart = subtotal >= HIGH_CART_THRESHOLD

    if (!isCheckout && !isHighCart) return

    const delay = isCheckout ? TRIGGER_DELAY_CHECKOUT : TRIGGER_DELAY_HIGH_CART
    const message = isCheckout
      ? 'Need help completing your order? I can assist with delivery, payment, or any questions!'
      : `You have £${(subtotal / 100).toFixed(2)} in your basket — need help finding anything else?`

    timerRef.current = setTimeout(() => {
      // Dispatch event to open the chat widget with a proactive message
      const event = new CustomEvent('proactive-chat', {
        detail: { message, trigger: isCheckout ? 'checkout_idle' : 'high_cart' }
      })
      window.dispatchEvent(event)
      sessionStorage.setItem(STORAGE_KEY, '1')
      setTriggered(true)
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pathname, subtotal, triggered])

  return null
}
