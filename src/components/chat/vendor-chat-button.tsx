'use client'

import { MessageCircle } from 'lucide-react'
import { LiveChatWidget } from './live-chat-widget'

interface VendorChatButtonProps {
  vendorId: string
  vendorName: string
  productSlug?: string
  className?: string
}

export function VendorChatButton({ vendorId, vendorName, productSlug, className }: VendorChatButtonProps) {
  return (
    <>
      <button
        onClick={() => {
          // Dispatch custom event to open the global chat widget in vendor mode
          globalThis.dispatchEvent(new CustomEvent('open-vendor-chat', {
            detail: { vendorId, vendorName, productSlug }
          }))
        }}
        className={className || 'flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors'}
      >
        <MessageCircle className="h-4 w-4" />
        Chat with Seller
      </button>

      {/* Widget is rendered globally via layout, not here */}
      <LiveChatWidget
        vendorId={vendorId}
        vendorName={vendorName}
        productSlug={productSlug}
      />
    </>
  )
}
