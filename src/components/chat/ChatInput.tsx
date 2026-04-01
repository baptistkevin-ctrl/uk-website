'use client'

import { RefObject } from 'react'
import { Send, Loader2, Bot } from 'lucide-react'

export interface ChatInputProps {
  newMessage: string
  sending: boolean
  isBotActive: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
  onMessageChange: (value: string) => void
  onSend: () => void
  onEndConversation: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export function ChatInput({
  newMessage,
  sending,
  isBotActive,
  inputRef,
  onMessageChange,
  onSend,
  onEndConversation,
  onKeyDown,
}: ChatInputProps) {
  return (
    <div className="p-4 border-t">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message..."
          aria-label="Chat message"
          rows={1}
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none max-h-24"
          style={{ minHeight: '40px' }}
        />
        <button
          onClick={onSend}
          disabled={!newMessage.trim() || sending}
          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={onEndConversation}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          End conversation
        </button>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          {isBotActive && <Bot className="h-3 w-3" />}
          Powered by FreshMart
        </span>
      </div>
    </div>
  )
}
