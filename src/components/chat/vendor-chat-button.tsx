'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { LiveChatWidget } from './live-chat-widget'

interface VendorChatButtonProps {
  vendorId: string
  vendorName: string
  productSlug?: string
  className?: string
}

export function VendorChatButton({ vendorId, vendorName, productSlug, className }: VendorChatButtonProps) {
  const [showChat, setShowChat] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowChat(true)}
        className={className || 'flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors'}
      >
        <MessageCircle className="h-4 w-4" />
        Chat with Seller
      </button>

      {showChat && (
        <LiveChatWidget
          vendorId={vendorId}
          vendorName={vendorName}
          productSlug={productSlug}
        />
      )}
    </>
  )
}
