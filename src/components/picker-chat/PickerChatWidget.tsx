'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  MessageCircle,
  X,
  ChevronDown,
  Send,
  Image as ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  usePickerChatStore,
  type ChatMessage,
} from '@/stores/picker-chat-store'

/* ── Constants ── */

const POLL_INTERVAL_MS = 5_000

const QUICK_RESPONSES = [
  'Pick firm ones please',
  'Green bananas preferred',
  'Any brand is fine',
  'Please substitute if needed',
  'No substitutions please',
] as const

/* ── Props ── */

interface PickerChatWidgetProps {
  orderId: string
  orderNumber: string
}

/* ── Component ── */

export default function PickerChatWidget({
  orderId,
  orderNumber,
}: PickerChatWidgetProps) {
  const {
    messages,
    pickerName,
    isPickerOnline,
    isOpen,
    unreadCount,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    fetchMessages,
    markAllRead,
  } = usePickerChatStore()

  const [input, setInput] = useState('')
  const [hasNewPulse, setHasNewPulse] = useState(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /* ── Polling ── */

  useEffect(() => {
    fetchMessages(orderId)

    const interval = setInterval(() => {
      if (isOpen) fetchMessages(orderId)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [orderId, isOpen, fetchMessages])

  /* ── Auto-scroll ── */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  /* ── Mark read on open ── */

  useEffect(() => {
    if (isOpen) {
      markAllRead()
      inputRef.current?.focus()
    }
  }, [isOpen, markAllRead])

  /* ── Pulse on incoming picker message ── */

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last?.senderRole === 'picker' && !isOpen) {
      setHasNewPulse(true)
      const timer = setTimeout(() => setHasNewPulse(false), 3_000)
      return () => clearTimeout(timer)
    }
  }, [messages, isOpen])

  /* ── Handlers ── */

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    sendMessage(trimmed)
    setInput('')
    inputRef.current?.focus()
  }, [input, orderId, sendMessage])

  const handleQuickResponse = useCallback(
    (text: string) => {
      sendMessage(text)
    },
    [orderId, sendMessage],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  /* ── Collapsed bubble ── */

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          openChat()
          toggleChat()
        }}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'flex h-14 w-14 items-center justify-center',
          'rounded-full bg-(--brand-primary) text-white',
          'shadow-(--shadow-(--shadow-lg)) transition-transform duration-200',
          'hover:scale-105 active:scale-95',
          'cursor-pointer',
          hasNewPulse && 'animate-pulse',
        )}
        aria-label="Open chat with your shopper"
      >
        <MessageCircle className="h-6 w-6" />

        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5',
              'flex h-5 min-w-5 items-center justify-center',
              'rounded-full bg-(--color-error) text-[11px] font-bold text-white',
              'px-1',
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    )
  }

  /* ── Expanded panel ── */

  return (
    <>
      {/* Image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={() => setExpandedImage(null)}
          role="dialog"
          aria-label="Expanded image"
        >
          <img
            src={expandedImage}
            alt="Full-size picker photo"
            className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}

      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'flex w-[380px] max-h-[500px] flex-col',
          'rounded-2xl shadow-(--shadow-2xl)',
          'border border-(--color-border)',
          'overflow-hidden',
          'animate-in slide-in-from-bottom-4 fade-in duration-300',
        )}
      >
        {/* ── Header ── */}
        <div
          className={cn(
            'flex items-center justify-between gap-2',
            'bg-(--brand-primary) text-white',
            'rounded-t-(--radius-2xl) px-4 py-3',
          )}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold leading-tight">
              Chat with your shopper
            </h3>

            <div className="mt-0.5 flex items-center gap-2 text-xs text-white/80">
              {pickerName && (
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className={cn(
                      'inline-block h-2 w-2 rounded-full',
                      isPickerOnline
                        ? 'bg-green-400 animate-pulse'
                        : 'bg-white/40',
                    )}
                  />
                  {pickerName}
                </span>
              )}
              <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                #{orderNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={closeChat}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Minimize chat"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={closeChat}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto bg-(--color-bg) p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-(--color-text-muted) py-8">
              {pickerName
                ? `${pickerName} is picking your order. Say hello!`
                : 'Waiting for a shopper to be assigned...'}
            </p>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onImageClick={setExpandedImage}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick responses ── */}
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2 bg-(--color-bg) border-t border-(--color-border) scrollbar-none">
          {QUICK_RESPONSES.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => handleQuickResponse(text)}
              className={cn(
                'shrink-0 rounded-full px-3 py-2.5 text-xs',
                'bg-(--color-elevated) text-(--color-text-secondary)',
                'border border-(--color-border)',
                'hover:bg-(--brand-primary-light) hover:text-(--brand-primary)',
                'transition-colors cursor-pointer',
              )}
            >
              {text}
            </button>
          ))}
        </div>

        {/* ── Input ── */}
        <div className="flex items-center gap-2 bg-(--color-surface) border-t border-(--color-border) p-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              pickerName
                ? `Message ${pickerName}...`
                : 'Waiting for shopper...'
            }
            disabled={!pickerName}
            className={cn(
              'flex-1 h-10 rounded-lg px-3 text-sm',
              'border border-(--color-border) bg-(--color-surface)',
              'text-foreground placeholder:text-(--color-text-muted)',
              'outline-none focus:ring-2 focus:ring-(--brand-primary)/30',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-shadow',
            )}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!pickerName || !input.trim()}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center',
              'rounded-lg bg-(--brand-amber) text-white',
              'hover:bg-(--brand-amber-hover) active:scale-95',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'transition-all cursor-pointer',
            )}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}

/* ── Message bubble sub-component ── */

function MessageBubble({
  message,
  onImageClick,
}: {
  message: ChatMessage
  onImageClick: (url: string) => void
}) {
  const isCustomer = message.senderRole === 'customer'
  const isSystem = message.type === 'system'

  /* System message */
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-(--color-elevated) px-3 py-1 text-[11px] text-(--color-text-muted)">
          {message.message}
        </span>
      </div>
    )
  }

  /* Substitution card */
  if (message.type === 'substitution') {
    return (
      <div className="mr-auto max-w-[85%]">
        <div className={cn('rounded-lg rounded-bl-sm overflow-hidden border border-(--color-border) bg-(--color-surface)')}>
          <div className="bg-(--color-warning-bg) px-3 py-1.5 text-[11px] font-semibold text-(--color-warning)">
            Substitution suggestion
          </div>
          <div className="p-3">
            <p className="text-sm text-foreground">{message.message}</p>
            {message.imageUrl && (
              <button onClick={() => onImageClick(message.imageUrl!)} className="mt-2">
                <img src={message.imageUrl} alt="Substitution" className="h-20 w-20 rounded-md object-cover" />
              </button>
            )}
          </div>
        </div>
        <span className="mt-0.5 block text-[11px] text-(--color-text-muted)">
          {new Date(message.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    )
  }

  /* Photo message */
  if (message.type === 'photo_response' && message.imageUrl) {
    return (
      <div className={cn(isCustomer ? 'ml-auto' : 'mr-auto', 'max-w-[75%]')}>
        <button
          type="button"
          onClick={() => onImageClick(message.imageUrl!)}
          className={cn(
            'block overflow-hidden rounded-lg cursor-pointer',
            isCustomer ? 'rounded-br-sm' : 'rounded-bl-sm',
          )}
        >
          <img
            src={message.imageUrl}
            alt="Picker photo"
            className="h-40 w-full object-cover"
          />
          {message.message && (
            <div
              className={cn(
                'px-3 py-2 text-sm',
                isCustomer
                  ? 'bg-(--brand-primary) text-white'
                  : 'bg-(--color-surface) border border-(--color-border) text-foreground',
              )}
            >
              {message.message}
            </div>
          )}
        </button>
        <span
          className={cn(
            'mt-0.5 block text-[11px] text-(--color-text-muted)',
            isCustomer && 'text-right',
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    )
  }

  /* Standard text */
  return (
    <div className={cn(isCustomer ? 'ml-auto' : 'mr-auto', 'max-w-[75%]')}>
      <div
        className={cn(
          'rounded-lg px-3 py-2 text-sm',
          isCustomer
            ? 'rounded-br-sm bg-(--brand-primary) text-white'
            : 'rounded-bl-sm bg-(--color-surface) border border-(--color-border) text-foreground',
        )}
      >
        {message.message}
      </div>
      <span
        className={cn(
          'mt-0.5 block text-[11px] text-(--color-text-muted)',
          isCustomer && 'text-right',
        )}
      >
        {new Date(message.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}

/* ── Helpers ── */

function formatTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}
