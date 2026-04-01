'use client'

import { Bot, MessageCircle, Minimize2, X } from 'lucide-react'
import { BotSettings, Availability } from './chat-types'

export interface ChatHeaderProps {
  isBotActive: boolean
  botSettings: BotSettings | null
  availability: Availability | null
  isMinimized: boolean
  onToggleMinimize: () => void
  onClose: () => void
}

export function ChatHeader({
  isBotActive,
  botSettings,
  availability,
  isMinimized,
  onToggleMinimize,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          {isBotActive ? <Bot className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        </div>
        <div>
          <h3 className="font-semibold text-sm">
            {isBotActive ? (botSettings?.botName || 'FreshBot') : 'FreshMart Support'}
          </h3>
          <p className="text-xs text-green-100">
            {isBotActive
              ? 'AI Assistant - Ask me anything!'
              : availability?.is_available
                ? "Online - We're here to help!"
                : 'Leave a message'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleMinimize}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
          aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
        >
          <Minimize2 className="h-4 w-4" />
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
