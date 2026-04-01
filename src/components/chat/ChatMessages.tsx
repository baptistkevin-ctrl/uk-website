'use client'

import { RefObject } from 'react'
import { User, Bot, Clock, Check, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { Message, QuickReply, BotSettings } from './chat-types'

export interface ChatMessagesProps {
  messages: Message[]
  botTyping: boolean
  botSettings: BotSettings | null
  quickReplies: QuickReply[]
  isBotActive: boolean
  messagesEndRef: RefObject<HTMLDivElement | null>
  onQuickReply: (reply: QuickReply) => void
}

function getMessageIcon(senderType: string) {
  switch (senderType) {
    case 'agent':
      return <User className="h-4 w-4" />
    case 'bot':
      return <Bot className="h-4 w-4" />
    case 'system':
      return <Clock className="h-4 w-4" />
    default:
      return null
  }
}

export function ChatMessages({
  messages,
  botTyping,
  botSettings,
  quickReplies,
  isBotActive,
  messagesEndRef,
  onQuickReply,
}: ChatMessagesProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_type === 'customer' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender_type === 'system' ? (
              <div className="w-full text-center">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  {message.content}
                </span>
              </div>
            ) : (
              <div
                className={`max-w-[80%] ${
                  message.sender_type === 'customer'
                    ? 'bg-green-600 text-white rounded-2xl rounded-br-md'
                    : message.sender_type === 'bot'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-gray-900 rounded-2xl rounded-bl-md border border-green-100'
                      : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
                } px-4 py-2`}
              >
                {message.sender_type !== 'customer' && (
                  <div className="flex items-center gap-1 mb-1">
                    {getMessageIcon(message.sender_type)}
                    <span className={`text-xs font-medium ${
                      message.sender_type === 'bot' ? 'text-green-700' : ''
                    }`}>
                      {message.sender_name || 'Support'}
                    </span>
                    {message.sender_type === 'bot' && (
                      <span className="text-xs text-green-500 ml-1">AI</span>
                    )}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${
                  message.sender_type === 'customer'
                    ? 'text-green-100'
                    : message.sender_type === 'bot'
                      ? 'text-green-400'
                      : 'text-gray-400'
                }`}>
                  <span className="text-xs">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </span>
                  {message.sender_type === 'customer' && (
                    message.is_read ? (
                      <CheckCheck className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Bot Typing Indicator */}
        {botTyping && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 text-gray-900 rounded-2xl rounded-bl-md border border-green-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">
                  {botSettings?.botName || 'FreshBot'}
                </span>
              </div>
              <div className="flex gap-1 mt-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {quickReplies.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => onQuickReply(reply)}
                className="px-3 py-1.5 bg-white border border-green-200 text-green-700 rounded-full text-sm hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                {reply.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
