'use client'

import { MessageCircle } from 'lucide-react'

interface VendorChatButtonProps {
  vendorId: string
  vendorName: string
  productSlug?: string
  className?: string
}

export function VendorChatButton({ vendorId, vendorName, productSlug, className }: VendorChatButtonProps) {
  return (
    <button
      onClick={() => {
        // Dispatch custom event to open the global chat widget in vendor mode
        globalThis.dispatchEvent(new CustomEvent('open-vendor-chat', {
          detail: { vendorId, vendorName, productSlug }
        }))
      }}
      className={className || 'flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-(--brand-primary) bg-(--brand-primary-light) border border-(--brand-primary) rounded-lg hover:bg-(--brand-primary-light) transition-colors'}
    >
      <MessageCircle className="h-4 w-4" />
      Chat with Seller
    </button>
  )
}
