'use client'

import { Send, Loader2, Sparkles } from 'lucide-react'
import { BotSettings, Availability } from './chat-types'

export interface ChatStartFormProps {
  botSettings: BotSettings | null
  availability: Availability | null
  name: string
  email: string
  initialMessage: string
  loading: boolean
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onInitialMessageChange: (value: string) => void
  onStart: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export function ChatStartForm({
  botSettings,
  availability,
  name,
  email,
  initialMessage,
  loading,
  onNameChange,
  onEmailChange,
  onInitialMessageChange,
  onStart,
  onKeyDown,
}: ChatStartFormProps) {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {botSettings?.isEnabled && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-green-600" />
            </div>
            <span className="font-semibold text-green-800">{botSettings.botName}</span>
          </div>
          <p className="text-sm text-green-700">{botSettings.welcomeMessage}</p>
        </div>
      )}

      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-1">Start a conversation</h4>
        <p className="text-sm text-gray-500">
          {botSettings?.isEnabled
            ? 'Our AI assistant is ready to help instantly!'
            : availability?.is_available
              ? 'Our team is ready to help you.'
              : `Average response time: ${availability?.estimated_wait_minutes || 5} minutes`}
        </p>
      </div>

      {botSettings?.suggestedFaqs && botSettings.suggestedFaqs.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Popular questions:</p>
          <div className="flex flex-wrap gap-2">
            {botSettings.suggestedFaqs.slice(0, 3).map((faq) => (
              <button
                key={faq.id}
                onClick={() => onInitialMessageChange(faq.question)}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors"
              >
                {faq.question.length > 40 ? faq.question.substring(0, 40) + '...' : faq.question}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <input type="text" placeholder="Your name (optional)" value={name} onChange={(e) => onNameChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        <input type="email" placeholder="Your email (optional)" value={email} onChange={(e) => onEmailChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        <textarea placeholder="How can we help you today?" value={initialMessage} onChange={(e) => onInitialMessageChange(e.target.value)} onKeyDown={onKeyDown} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none" />
        <button onClick={onStart} disabled={!initialMessage.trim() || loading} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Starting...</>) : (<><Send className="h-4 w-4" />Start Chat</>)}
        </button>
      </div>
    </div>
  )
}
