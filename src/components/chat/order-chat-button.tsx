'use client'

import { useState } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'

interface OrderChatButtonProps {
  vendorId: string
  vendorName: string
  orderId: string
  orderNumber: string
  className?: string
}

export function OrderChatButton({
  vendorId,
  vendorName,
  orderId,
  orderNumber,
  className,
}: OrderChatButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      // Dispatch custom event to open the global chat widget in order-vendor mode
      globalThis.dispatchEvent(
        new CustomEvent('open-order-chat', {
          detail: { vendorId, vendorName, orderId, orderNumber },
        })
      )
    } finally {
      // Small delay so user sees feedback
      setTimeout(() => setLoading(false), 500)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        className ||
        'flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-(--brand-primary) bg-(--brand-primary-light) border border-(--brand-primary) rounded-lg hover:bg-(--brand-primary-light) transition-colors disabled:opacity-50'
      }
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <MessageCircle className="h-3.5 w-3.5" />
      )}
      Chat with {vendorName}
    </button>
  )
}
