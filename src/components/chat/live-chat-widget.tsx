'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Loader2,
  User,
  Bot,
  Paperclip,
  Star,
  Clock,
  Check,
  CheckCheck,
  Sparkles
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface Message {
  id: string
  sender_type: 'customer' | 'agent' | 'system' | 'bot' | 'vendor'
  sender_name: string | null
  content: string
  message_type: string
  attachments: any[]
  metadata: any
  is_read: boolean
  created_at: string
}

interface QuickReply {
  text: string
  value: string
}

interface BotResponse {
  message: string
  type: 'text' | 'quick_reply' | 'card' | 'carousel'
  quickReplies?: QuickReply[]
  shouldHandoff?: boolean
  intent?: string
  confidence?: number
  botName?: string
  typingDelay?: number
}

interface BotSettings {
  isEnabled: boolean
  botName: string
  welcomeMessage: string
  botAvatar: string
  typingDelay: number
  suggestedFaqs: { id: string; question: string; category: string }[]
}

interface Conversation {
  id: string
  status: string
  assigned_agent_id: string | null
  department: string
  channel_type: string
  vendor_id: string | null
  subject: string | null
  rating: number | null
  created_at: string
}

interface Availability {
  is_available: boolean
  estimated_wait_minutes: number
  available_agents: number
}

interface LiveChatWidgetProps {
  vendorId?: string
  vendorName?: string
  productSlug?: string
}

export function LiveChatWidget({ vendorId, vendorName, productSlug }: LiveChatWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [showStartForm, setShowStartForm] = useState(true)
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  // Bot-related state
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null)
  const [isBotActive, setIsBotActive] = useState(true)
  const [botTyping, setBotTyping] = useState(false)
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])

  // Vendor chat mode
  const [chatMode, setChatMode] = useState<'support' | 'vendor'>(vendorId ? 'vendor' : 'support')

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [initialMessage, setInitialMessage] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate session ID
  const getSessionId = () => {
    if (typeof window === 'undefined') return null
    let sessionId = localStorage.getItem('chat_session_id')
    if (!sessionId) {
      sessionId = 'chat_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem('chat_session_id', sessionId)
    }
    return sessionId
  }

  // Fetch bot settings
  const fetchBotSettings = async () => {
    try {
      const sessionId = getSessionId()
      const res = await fetch(`/api/chat/bot?session_id=${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setBotSettings(data)
        return data
      }
    } catch (error) {
      console.error('Failed to fetch bot settings:', error)
    }
    return null
  }

  // Send message to bot
  const sendToBotAPI = async (message: string, conversationId?: string): Promise<BotResponse | null> => {
    try {
      const res = await fetch('/api/chat/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
          session_id: getSessionId(),
          context: {
            page: typeof window !== 'undefined' ? window.location.href : ''
          }
        })
      })

      if (res.ok) {
        return await res.json()
      }
    } catch (error) {
      console.error('Failed to get bot response:', error)
    }
    return null
  }

  // Add bot message to chat
  const addBotMessage = (content: string, botName: string = 'FreshBot', quickReplies?: QuickReply[]) => {
    const botMessage: Message = {
      id: 'bot-' + Date.now(),
      sender_type: 'bot',
      sender_name: botName,
      content,
      message_type: quickReplies ? 'quick_reply' : 'text',
      attachments: [],
      metadata: { quickReplies },
      is_read: true,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, botMessage])
    if (quickReplies) {
      setQuickReplies(quickReplies)
    }
  }

  // Check availability
  const checkAvailability = async () => {
    try {
      const res = await fetch('/api/chat?action=availability')
      if (res.ok) {
        const data = await res.json()
        setAvailability(data)
      }
    } catch (error) {
      console.error('Failed to check availability:', error)
    }
  }

  // Check for existing conversation
  const checkExistingConversation = async () => {
    const sessionId = getSessionId()
    try {
      const res = await fetch(`/api/chat?session_id=${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.conversation) {
          setConversation(data.conversation)
          setShowStartForm(false)
          fetchMessages(data.conversation.id)
          // Check if bot is still active for this conversation
          if (data.conversation.status === 'waiting' || data.conversation.assigned_agent_id) {
            setIsBotActive(false)
          }
        }
      }
    } catch (error) {
      console.error('Failed to check conversation:', error)
    }
  }

  // Fetch messages
  const fetchMessages = async (conversationId: string, since?: string) => {
    try {
      let url = `/api/chat/messages?conversation_id=${conversationId}`
      if (since) url += `&since=${since}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (since) {
          // Append new messages
          setMessages(prev => [...prev, ...data.messages])
        } else {
          setMessages(data.messages || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  // Start conversation with bot greeting
  const startConversation = async () => {
    if (!initialMessage.trim()) return

    setLoading(true)
    try {
      const isVendorChat = chatMode === 'vendor' && vendorId
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: getSessionId(),
          guest_name: name || undefined,
          guest_email: email || undefined,
          subject: subject || (isVendorChat ? `Question about ${vendorName || 'product'}` : undefined),
          initial_message: initialMessage,
          channel_type: isVendorChat ? 'customer_vendor' : 'customer_admin',
          vendor_id: isVendorChat ? vendorId : undefined,
          metadata: {
            page: window.location.href,
            product_slug: productSlug || undefined
          }
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.conversation_id) {
          // Fetch the full conversation
          const convRes = await fetch(`/api/chat?conversation_id=${data.conversation_id}`)
          if (convRes.ok) {
            const convData = await convRes.json()
            setConversation(convData.conversation)
            setMessages(convData.conversation?.chat_messages || [])
          }
          setShowStartForm(false)

          // If bot is enabled and not a vendor chat, get bot response
          if (botSettings?.isEnabled && chatMode !== 'vendor') {
            setBotTyping(true)
            const botResponse = await sendToBotAPI(initialMessage, data.conversation_id)

            setTimeout(() => {
              setBotTyping(false)
              if (botResponse) {
                addBotMessage(
                  botResponse.message,
                  botResponse.botName || botSettings.botName,
                  botResponse.quickReplies
                )

                if (botResponse.shouldHandoff) {
                  setIsBotActive(false)
                  // Add system message about handoff
                  const systemMsg: Message = {
                    id: 'system-' + Date.now(),
                    sender_type: 'system',
                    sender_name: null,
                    content: 'Connecting you with a customer service agent...',
                    message_type: 'text',
                    attachments: [],
                    metadata: {},
                    is_read: true,
                    created_at: new Date().toISOString()
                  }
                  setMessages(prev => [...prev, systemMsg])
                }
              }
            }, botResponse?.typingDelay || botSettings.typingDelay || 1000)
          }

          setInitialMessage('')
        }
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle quick reply click
  const handleQuickReply = async (reply: QuickReply) => {
    setQuickReplies([])

    // Add user's selection as a message
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      sender_type: 'customer',
      sender_name: name || 'You',
      content: reply.text,
      message_type: 'text',
      attachments: [],
      metadata: {},
      is_read: false,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    // Send the value to bot
    if (isBotActive && botSettings?.isEnabled) {
      setBotTyping(true)
      const botResponse = await sendToBotAPI(reply.value, conversation?.id)

      setTimeout(() => {
        setBotTyping(false)
        if (botResponse) {
          addBotMessage(
            botResponse.message,
            botResponse.botName || botSettings.botName,
            botResponse.quickReplies
          )

          if (botResponse.shouldHandoff) {
            setIsBotActive(false)
          }
        }
      }, botResponse?.typingDelay || botSettings.typingDelay || 1000)
    }

    // Also save to conversation if exists
    if (conversation) {
      try {
        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: conversation.id,
            content: reply.text
          })
        })
      } catch (error) {
        console.error('Failed to save quick reply:', error)
      }
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setSending(true)
    setQuickReplies([])

    // Optimistic update
    const optimisticMessage: Message = {
      id: 'temp-' + Date.now(),
      sender_type: 'customer',
      sender_name: name || 'You',
      content: messageContent,
      message_type: 'text',
      attachments: [],
      metadata: {},
      is_read: false,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMessage])

    try {
      // Save user message
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          content: messageContent
        })
      })

      if (res.ok) {
        const data = await res.json()
        // Replace optimistic message with real one
        setMessages(prev =>
          prev.map(m => m.id === optimisticMessage.id ? data.message : m)
        )

        // If bot is active and not vendor chat, get bot response
        if (isBotActive && botSettings?.isEnabled && chatMode !== 'vendor') {
          setBotTyping(true)
          const botResponse = await sendToBotAPI(messageContent, conversation.id)

          setTimeout(() => {
            setBotTyping(false)
            if (botResponse) {
              addBotMessage(
                botResponse.message,
                botResponse.botName || botSettings.botName,
                botResponse.quickReplies
              )

              if (botResponse.shouldHandoff) {
                setIsBotActive(false)
              }
            }
          }, botResponse?.typingDelay || botSettings.typingDelay || 1000)
        }
      } else {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
    } finally {
      setSending(false)
    }
  }

  // Close conversation
  const closeConversation = async () => {
    if (!conversation) return

    setShowRatingForm(true)
  }

  // Submit rating
  const submitRating = async () => {
    if (!conversation) return

    try {
      await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          action: 'resolve',
          rating: rating || undefined,
          feedback: feedback || undefined
        })
      })

      setConversation(null)
      setMessages([])
      setShowStartForm(true)
      setShowRatingForm(false)
      setRating(0)
      setFeedback('')
      setIsBotActive(true)
      setQuickReplies([])
    } catch (error) {
      console.error('Failed to close conversation:', error)
    }
  }

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, botTyping])

  // Poll for new messages
  useEffect(() => {
    if (!conversation || conversation.status === 'closed' || conversation.status === 'resolved') {
      return
    }

    const poll = () => {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage) {
        fetchMessages(conversation.id, lastMessage.created_at)
      }
    }

    pollIntervalRef.current = setInterval(poll, 3000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [conversation, messages])

  // Initial load
  useEffect(() => {
    if (isOpen) {
      checkAvailability()
      checkExistingConversation()
      fetchBotSettings()
    }
  }, [isOpen])

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (showStartForm) {
        startConversation()
      } else {
        sendMessage()
      }
    }
  }

  const getMessageIcon = (senderType: string) => {
    switch (senderType) {
      case 'agent':
        return <User className="h-4 w-4" />
      case 'vendor':
        return <User className="h-4 w-4" />
      case 'bot':
        return <Bot className="h-4 w-4" />
      case 'system':
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 w-12 h-12 lg:w-14 lg:h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:scale-105 transition-all flex items-center justify-center z-40"
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6" />
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-16 lg:bottom-6 right-2 lg:right-6 w-[calc(100vw-16px)] sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col ${
        isMinimized ? 'h-14' : 'h-[calc(100vh-5rem)] lg:h-[550px]'
      } transition-all duration-200`}
    >
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            {isBotActive ? <Bot className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {chatMode === 'vendor' && vendorName
                ? vendorName
                : isBotActive
                  ? (botSettings?.botName || 'FreshBot')
                  : 'FreshMart Support'}
            </h3>
            <p className="text-xs text-green-100">
              {chatMode === 'vendor'
                ? 'Chat with seller'
                : isBotActive
                  ? 'AI Assistant - Ask me anything!'
                  : availability?.is_available
                    ? 'Online - We\'re here to help!'
                    : 'Leave a message'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Start Form */}
          {showStartForm && !showRatingForm && (
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Bot Welcome */}
              {botSettings?.isEnabled && (
                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-semibold text-green-800">{botSettings.botName}</span>
                  </div>
                  <p className="text-sm text-green-700">
                    {botSettings.welcomeMessage}
                  </p>
                </div>
              )}

              {/* Chat mode selector when vendor context available */}
              {vendorId && (
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setChatMode('vendor')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      chatMode === 'vendor'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Chat with {vendorName || 'Seller'}
                  </button>
                  <button
                    onClick={() => setChatMode('support')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      chatMode === 'support'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    FreshMart Support
                  </button>
                </div>
              )}

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {chatMode === 'vendor' ? `Message ${vendorName || 'Seller'}` : 'Start a conversation'}
                </h4>
                <p className="text-sm text-gray-500">
                  {chatMode === 'vendor'
                    ? 'Ask about products, orders, or anything else'
                    : botSettings?.isEnabled
                      ? 'Our AI assistant is ready to help instantly!'
                      : availability?.is_available
                        ? 'Our team is ready to help you.'
                        : `Average response time: ${availability?.estimated_wait_minutes || 5} minutes`}
                </p>
              </div>

              {/* Suggested Questions */}
              {botSettings?.suggestedFaqs && botSettings.suggestedFaqs.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Popular questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {botSettings.suggestedFaqs.slice(0, 3).map((faq) => (
                      <button
                        key={faq.id}
                        onClick={() => setInitialMessage(faq.question)}
                        className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors"
                      >
                        {faq.question.length > 40 ? faq.question.substring(0, 40) + '...' : faq.question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="email"
                  placeholder="Your email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <textarea
                  placeholder="How can we help you today?"
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
                <button
                  onClick={startConversation}
                  disabled={!initialMessage.trim() || loading}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Start Chat
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Rating Form */}
          {showRatingForm && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-center mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">How was your experience?</h4>
                <p className="text-sm text-gray-500">Your feedback helps us improve</p>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Any additional feedback? (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRatingForm(false)
                    setConversation(null)
                    setMessages([])
                    setShowStartForm(true)
                    setIsBotActive(true)
                  }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Skip
                </button>
                <button
                  onClick={submitRating}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {!showStartForm && !showRatingForm && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                              : message.sender_type === 'vendor'
                                ? 'bg-purple-50 text-gray-900 rounded-2xl rounded-bl-md border border-purple-200'
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
                        onClick={() => handleQuickReply(reply)}
                        className="px-3 py-1.5 bg-white border border-green-200 text-green-700 rounded-full text-sm hover:bg-green-50 hover:border-green-300 transition-colors"
                      >
                        {reply.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none max-h-24"
                    style={{ minHeight: '40px' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    onClick={closeConversation}
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
            </>
          )}
        </>
      )}
    </div>
  )
}
