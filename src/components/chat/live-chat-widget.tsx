'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Loader2,
  Bot,
  Star,
  Check,
  CheckCheck,
  Sparkles,
  ArrowLeft,
  Headphones,
  Store,
  Plus,
} from 'lucide-react'
import { format } from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────
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
  quickReplies?: QuickReply[]
  shouldHandoff?: boolean
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
  updated_at?: string
  last_message?: string
  last_message_at?: string
  unread_customer?: number
  vendors?: { business_name: string; logo_url: string | null }
}

interface LiveChatWidgetProps {
  vendorId?: string
  vendorName?: string
  productSlug?: string
}

// ─── Views ───────────────────────────────────────────────────────
type WidgetView = 'list' | 'chat' | 'new-chat' | 'rating'
type TabType = 'support' | 'sellers'

export function LiveChatWidget({ vendorId, vendorName, productSlug }: LiveChatWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [view, setView] = useState<WidgetView>('list')
  const [activeTab, setActiveTab] = useState<TabType>(vendorId ? 'sellers' : 'support')

  // Conversations list
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)

  // Active chat
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Bot
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null)
  const [isBotActive, setIsBotActive] = useState(true)
  const [botTyping, setBotTyping] = useState(false)
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])

  // New chat form
  const [newChatType, setNewChatType] = useState<'support' | 'vendor'>('support')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Rating
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [showRatingForm, setShowRatingForm] = useState(false)

  // Error state for inline feedback
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const newChatNameRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const listPollRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageTimeRef = useRef<string | null>(null)
  const initialLoadDoneRef = useRef(false)
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ─── Helpers ─────────────────────────────────────────────────
  const getSessionId = () => {
    if (typeof window === 'undefined') return null
    let sessionId = localStorage.getItem('chat_session_id')
    if (!sessionId) {
      const bytes = crypto.getRandomValues(new Uint8Array(16))
      sessionId = 'chat_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
      localStorage.setItem('chat_session_id', sessionId)
    }
    return sessionId
  }

  // ─── Error helper ────────────────────────────────────────────
  const showError = useCallback((msg: string) => {
    setError(msg)
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    errorTimeoutRef.current = setTimeout(() => setError(null), 5000)
  }, [])

  // ─── Bot API ─────────────────────────────────────────────────
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

  const sendToBotAPI = async (message: string, conversationId?: string): Promise<BotResponse | null> => {
    try {
      const res = await fetch('/api/chat/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
          session_id: getSessionId(),
          context: { page: typeof window !== 'undefined' ? window.location.href : '' }
        })
      })
      if (res.ok) return await res.json()
    } catch (error) {
      console.error('Failed to get bot response:', error)
    }
    return null
  }

  const addBotMessage = (content: string, botName: string = 'FreshBot', qr?: QuickReply[]) => {
    const botMessage: Message = {
      id: 'bot-' + Date.now(),
      sender_type: 'bot',
      sender_name: botName,
      content,
      message_type: qr ? 'quick_reply' : 'text',
      attachments: [],
      metadata: { quickReplies: qr },
      is_read: true,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, botMessage])
    if (qr) setQuickReplies(qr)
  }

  // ─── Conversations API ──────────────────────────────────────
  const fetchConversations = async (isInitial = false) => {
    const sessionId = getSessionId()
    if (!sessionId) return
    if (isInitial) setLoadingConversations(true)
    try {
      const res = await fetch(`/api/chat?session_id=${sessionId}&list=true`)
      if (res.ok) {
        const data = await res.json()
        if (data.conversations) {
          setConversations(data.conversations)
        } else if (data.conversation) {
          // Single conversation returned — wrap it
          setConversations([data.conversation])
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoadingConversations(false)
    }
  }

  const fetchMessages = async (conversationId: string, since?: string) => {
    try {
      const sessionId = getSessionId()
      let url = `/api/chat/messages?conversation_id=${conversationId}`
      if (sessionId) url += `&session_id=${sessionId}`
      if (since) url += `&since=${since}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (since) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMsgs = (data.messages || []).filter((m: Message) => !existingIds.has(m.id))
            return [...prev, ...newMsgs]
          })
        } else {
          setMessages(data.messages || [])
        }
      } else {
        if (!since) showError('Failed to load messages.')
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      if (!since) showError('Failed to load messages.')
    }
  }

  // ─── Open a conversation ────────────────────────────────────
  const openConversation = (conv: Conversation) => {
    setActiveConversation(conv)
    setMessages([])
    setQuickReplies([])
    setView('chat')
    setIsBotActive(conv.status !== 'active' && !conv.assigned_agent_id && conv.channel_type === 'customer_admin')
    fetchMessages(conv.id)
  }

  // ─── Start new conversation ─────────────────────────────────
  const startNewConversation = async () => {
    if (!formMessage.trim()) return
    setFormLoading(true)

    try {
      const isVendorChat = newChatType === 'vendor' && vendorId
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: getSessionId(),
          guest_name: formName || undefined,
          guest_email: formEmail || undefined,
          subject: isVendorChat ? `Question about ${vendorName || 'product'}` : undefined,
          initial_message: formMessage,
          channel_type: isVendorChat ? 'customer_vendor' : 'customer_admin',
          vendor_id: isVendorChat ? vendorId : undefined,
          metadata: { page: window.location.href, product_slug: productSlug || undefined }
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.conversation_id) {
          const conv: Conversation = {
            id: data.conversation_id,
            status: 'waiting',
            assigned_agent_id: null,
            department: 'general',
            channel_type: isVendorChat ? 'customer_vendor' : 'customer_admin',
            vendor_id: isVendorChat ? vendorId! : null,
            subject: isVendorChat ? `Question about ${vendorName || 'product'}` : null,
            rating: null,
            created_at: new Date().toISOString(),
            last_message: formMessage,
            last_message_at: new Date().toISOString()
          }

          setActiveConversation(conv)
          setView('chat')
          setIsBotActive(!isVendorChat && (botSettings?.isEnabled || false))

          // Fetch messages for this conversation
          fetchMessages(data.conversation_id)

          // Bot response for support chats
          if (!isVendorChat && botSettings?.isEnabled) {
            setBotTyping(true)
            const botResponse = await sendToBotAPI(formMessage, data.conversation_id)
            if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
            botTimeoutRef.current = setTimeout(() => {
              setBotTyping(false)
              if (botResponse) {
                addBotMessage(
                  botResponse.message,
                  botResponse.botName || botSettings.botName,
                  botResponse.quickReplies
                )
                if (botResponse.shouldHandoff) {
                  setIsBotActive(false)
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

          // Refresh list
          fetchConversations()
          setFormMessage('')
          setFormName('')
          setFormEmail('')
        }
      } else {
        showError('Failed to start conversation.')
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      showError('Failed to start conversation. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  // ─── Send message ───────────────────────────────────────────
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    if (!activeConversation) {
      // Auto-create conversation — pass message directly to avoid stale state
      const msg = newMessage.trim()
      setNewMessage('')
      setFormLoading(true)
      try {
        const isVendorChat = newChatType === 'vendor' && vendorId
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: getSessionId(),
            guest_name: formName || undefined,
            guest_email: formEmail || undefined,
            initial_message: msg,
            channel_type: isVendorChat ? 'customer_vendor' : 'customer_admin',
            vendor_id: isVendorChat ? vendorId : undefined,
            metadata: { page: globalThis.location?.href }
          })
        })
        if (res.ok) {
          const data = await res.json()
          if (data.conversation_id) {
            const conv: Conversation = {
              id: data.conversation_id,
              status: 'waiting',
              assigned_agent_id: null,
              department: 'general',
              channel_type: isVendorChat ? 'customer_vendor' : 'customer_admin',
              vendor_id: isVendorChat ? vendorId! : null,
              subject: null,
              rating: null,
              created_at: new Date().toISOString(),
              last_message: msg,
              last_message_at: new Date().toISOString()
            }
            setActiveConversation(conv)
            setIsBotActive(!isVendorChat && (botSettings?.isEnabled || false))
            fetchMessages(data.conversation_id)
            fetchConversations()

            // Trigger bot response for support chats
            if (!isVendorChat && botSettings?.isEnabled) {
              setBotTyping(true)
              const botResponse = await sendToBotAPI(msg, data.conversation_id)
              if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
              botTimeoutRef.current = setTimeout(() => {
                setBotTyping(false)
                if (botResponse) {
                  addBotMessage(
                    botResponse.message,
                    botResponse.botName || botSettings.botName,
                    botResponse.quickReplies
                  )
                  if (botResponse.shouldHandoff) setIsBotActive(false)
                }
              }, botResponse?.typingDelay || botSettings.typingDelay || 1000)
            }
          }
        } else {
          showError('Failed to start conversation.')
          setNewMessage(msg) // restore message
        }
      } catch (error) {
        console.error('Failed to create conversation:', error)
        showError('Failed to start conversation. Please try again.')
        setNewMessage(msg) // restore message
      } finally {
        setFormLoading(false)
      }
      return
    }

    if (activeConversation.status === 'closed' || activeConversation.status === 'resolved') {
      showError('This conversation is closed.')
      return
    }

    const messageContent = newMessage.trim()
    setNewMessage('')
    setSending(true)
    setQuickReplies([])

    const optimisticMessage: Message = {
      id: 'temp-' + Date.now(),
      sender_type: 'customer',
      sender_name: formName || 'You',
      content: messageContent,
      message_type: 'text',
      attachments: [],
      metadata: {},
      is_read: false,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMessage])

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConversation.id,
          session_id: getSessionId(),
          content: messageContent
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? data.message : m))

        // Bot response for support chats
        const isVendorChat = activeConversation.channel_type === 'customer_vendor'
        if (isBotActive && botSettings?.isEnabled && !isVendorChat) {
          setBotTyping(true)
          const botResponse = await sendToBotAPI(messageContent, activeConversation.id)
          if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
          botTimeoutRef.current = setTimeout(() => {
            setBotTyping(false)
            if (botResponse) {
              addBotMessage(
                botResponse.message,
                botResponse.botName || botSettings.botName,
                botResponse.quickReplies
              )
              if (botResponse.shouldHandoff) setIsBotActive(false)
            }
          }, botResponse?.typingDelay || botSettings.typingDelay || 1000)
        }
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
        showError('Failed to send message.')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      showError('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // ─── Quick reply ────────────────────────────────────────────
  const handleQuickReply = async (reply: QuickReply) => {
    setQuickReplies([])
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      sender_type: 'customer',
      sender_name: formName || 'You',
      content: reply.text,
      message_type: 'text',
      attachments: [],
      metadata: {},
      is_read: false,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    if (isBotActive && botSettings?.isEnabled) {
      setBotTyping(true)
      const botResponse = await sendToBotAPI(reply.value, activeConversation?.id)
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
      botTimeoutRef.current = setTimeout(() => {
        setBotTyping(false)
        if (botResponse) {
          addBotMessage(botResponse.message, botResponse.botName || botSettings.botName, botResponse.quickReplies)
          if (botResponse.shouldHandoff) setIsBotActive(false)
        }
      }, botResponse?.typingDelay || botSettings.typingDelay || 1000)
    }

    if (activeConversation) {
      try {
        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: activeConversation.id, session_id: getSessionId(), content: reply.text })
        })
      } catch (err) {
        console.error('Failed to save quick reply:', err)
        showError('Failed to send reply.')
      }
    }
  }

  // ─── Close / Rate ───────────────────────────────────────────
  const submitRating = async () => {
    if (!activeConversation) return
    try {
      await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConversation.id,
          action: 'resolve',
          rating: rating || undefined,
          feedback: feedback || undefined
        })
      })
      setActiveConversation(null)
      setMessages([])
      setView('list')
      setShowRatingForm(false)
      setRating(0)
      setFeedback('')
      setIsBotActive(true)
      setQuickReplies([])
      fetchConversations()
    } catch (error) {
      console.error('Failed to close conversation:', error)
    }
  }

  // ─── Effects ────────────────────────────────────────────────
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  // Reset minimize when leaving list view
  useEffect(() => {
    if (view !== 'list') setIsMinimized(false)
  }, [view])

  // Focus management between views
  useEffect(() => {
    if (view === 'chat') {
      // Small delay to ensure the DOM has rendered
      const t = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    } else if (view === 'new-chat') {
      const t = setTimeout(() => newChatNameRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [view])

  // Track last message time for polling
  useEffect(() => {
    if (messages.length > 0) {
      lastMessageTimeRef.current = messages[messages.length - 1].created_at
    }
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, botTyping])

  // Poll messages in active chat — uses ref to avoid restarting on every message
  useEffect(() => {
    if (!activeConversation || view !== 'chat') return
    if (activeConversation.status === 'closed' || activeConversation.status === 'resolved') return

    const poll = () => {
      if (!navigator.onLine) return // skip when offline
      if (lastMessageTimeRef.current) {
        fetchMessages(activeConversation.id, lastMessageTimeRef.current)
      }
    }
    pollIntervalRef.current = setInterval(poll, 3000)
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current) }
  }, [activeConversation, view])

  // Poll conversation list
  useEffect(() => {
    if (!isOpen || view !== 'list') return
    const poll = () => {
      if (!navigator.onLine) return
      fetchConversations()
    }
    listPollRef.current = setInterval(poll, 8000)
    return () => { if (listPollRef.current) clearInterval(listPollRef.current) }
  }, [isOpen, view])

  // Listen for vendor chat button clicks
  useEffect(() => {
    const handleOpenVendorChat = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.vendorId) {
        setIsOpen(true)
        setActiveTab('sellers')
        setNewChatType('vendor')
        setView('new-chat')
      }
    }
    globalThis.addEventListener('open-vendor-chat', handleOpenVendorChat)
    return () => globalThis.removeEventListener('open-vendor-chat', handleOpenVendorChat)
  }, [])

  // Initial load
  useEffect(() => {
    if (isOpen && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true
      fetchConversations(true)
      fetchBotSettings()

      if (vendorId) {
        setNewChatType('vendor')
      }
    }
    if (!isOpen) {
      initialLoadDoneRef.current = false
    }
  }, [isOpen])

  // Key press handler
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (view === 'new-chat') startNewConversation()
      else if (view === 'chat') sendMessage()
    }
  }

  // ─── Filter conversations by tab ───────────────────────────
  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'support') return c.channel_type === 'customer_admin'
    return c.channel_type === 'customer_vendor'
  })

  const activeConversationCount = conversations.filter(c =>
    c.status !== 'closed' && c.status !== 'resolved'
  ).length

  // ─── Chat header info ──────────────────────────────────────
  const getChatName = () => {
    if (!activeConversation) return 'Chat'
    if (activeConversation.channel_type === 'customer_vendor') {
      return activeConversation.vendors?.business_name || vendorName || 'Seller'
    }
    if (isBotActive) return botSettings?.botName || 'FreshBot'
    return 'FreshMart Support'
  }

  const getChatSubtitle = () => {
    if (!activeConversation) return ''
    if (activeConversation.channel_type === 'customer_vendor') return 'Seller Chat'
    if (isBotActive) return 'AI Assistant'
    if (activeConversation.status === 'active') return 'Agent connected'
    return 'Waiting for agent...'
  }

  const getChatIcon = () => {
    if (!activeConversation) return <MessageCircle className="h-5 w-5" />
    if (activeConversation.channel_type === 'customer_vendor') return <Store className="h-5 w-5" />
    if (isBotActive) return <Bot className="h-5 w-5" />
    return <Headphones className="h-5 w-5" />
  }

  // ─── RENDER: Closed bubble ─────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 group"
        aria-label="Open chat"
      >
        <div className="relative">
          <div className="w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageCircle className="h-7 w-7" />
          </div>
          {activeConversationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {activeConversationCount}
            </span>
          )}
        </div>
      </button>
    )
  }

  // ─── RENDER: Widget ────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-label="Live chat"
      className={`fixed bottom-16 lg:bottom-6 right-2 lg:right-6 w-[calc(100vw-16px)] sm:w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col ${
        isMinimized ? 'h-14' : 'h-[calc(100vh-5rem)] lg:h-[600px]'
      } transition-all duration-200 border border-gray-200`}
    >
      {/* ═══ LIST VIEW ═══ */}
      {view === 'list' && (
        <>
          {/* Header */}
          <div className="bg-[#075E54] text-white px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Chats</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex gap-0 bg-[#064E46] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('support')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'support'
                      ? 'bg-[#25D366] text-white shadow-sm'
                      : 'text-green-200 hover:text-white'
                  }`}
                >
                  <Headphones className="h-4 w-4" />
                  Support
                </button>
                <button
                  onClick={() => setActiveTab('sellers')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'sellers'
                      ? 'bg-[#25D366] text-white shadow-sm'
                      : 'text-green-200 hover:text-white'
                  }`}
                >
                  <Store className="h-4 w-4" />
                  Sellers
                </button>
              </div>
            )}
          </div>

          {!isMinimized && (
            <>
              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto bg-white">
                {loadingConversations && conversations.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      {activeTab === 'support' ? (
                        <Headphones className="h-8 w-8 text-gray-300" />
                      ) : (
                        <Store className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <p className="text-gray-900 font-medium mb-1">
                      {activeTab === 'support' ? 'No support chats yet' : 'No seller chats yet'}
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      {activeTab === 'support'
                        ? 'Start a conversation with our support team'
                        : 'Chat with sellers about their products'}
                    </p>
                    <button
                      onClick={() => {
                        setNewChatType(activeTab === 'support' ? 'support' : 'vendor')
                        setView('new-chat')
                      }}
                      className="px-4 py-2 bg-[#25D366] text-white rounded-full text-sm font-medium hover:bg-[#20BD5A] transition-colors"
                    >
                      Start a chat
                    </button>
                  </div>
                ) : (
                  filteredConversations.map(conv => {
                    const isActive = conv.status !== 'closed' && conv.status !== 'resolved'
                    return (
                      <button
                        key={conv.id}
                        onClick={() => openConversation(conv)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
                      >
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          conv.channel_type === 'customer_vendor'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-[#DCF8C6] text-[#075E54]'
                        }`}>
                          {conv.channel_type === 'customer_vendor' ? (
                            <Store className="h-6 w-6" />
                          ) : (
                            <Headphones className="h-6 w-6" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900 text-sm truncate">
                              {conv.channel_type === 'customer_vendor'
                                ? (conv.vendors?.business_name || vendorName || 'Seller')
                                : 'FreshMart Support'}
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {conv.last_message_at || conv.updated_at
                                ? format(new Date(conv.last_message_at || conv.updated_at || conv.created_at), 'HH:mm')
                                : format(new Date(conv.created_at), 'HH:mm')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-gray-500 truncate pr-2">
                              {conv.last_message || conv.subject || 'No messages yet'}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isActive && (
                                <span className={`w-2 h-2 rounded-full ${
                                  conv.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                                }`} />
                              )}
                              {(conv.unread_customer || 0) > 0 && (
                                <span className="min-w-[20px] h-5 bg-[#25D366] text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                                  {conv.unread_customer}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* FAB - new chat */}
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={() => {
                    setNewChatType(activeTab === 'support' ? 'support' : 'vendor')
                    setView('new-chat')
                  }}
                  className="w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#20BD5A] hover:scale-105 transition-all"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ NEW CHAT VIEW ═══ */}
      {view === 'new-chat' && (
        <>
          <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
            <button onClick={() => setView('list')} className="p-1 hover:bg-white/10 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">New Chat</h3>
              <p className="text-xs text-green-200">
                {newChatType === 'vendor' ? `Chat with ${vendorName || 'Seller'}` : 'FreshMart Support'}
              </p>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {/* Chat type toggle */}
            {vendorId && (
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setNewChatType('support')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    newChatType === 'support'
                      ? 'border-[#25D366] bg-green-50 text-[#075E54]'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Headphones className="h-5 w-5" />
                  Support
                </button>
                <button
                  onClick={() => setNewChatType('vendor')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    newChatType === 'vendor'
                      ? 'border-purple-400 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Store className="h-5 w-5" />
                  {vendorName || 'Seller'}
                </button>
              </div>
            )}

            {/* Bot welcome for support */}
            {newChatType === 'support' && botSettings?.isEnabled && (
              <div className="mb-4 p-4 bg-[#DCF8C6] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-[#075E54]" />
                  <span className="font-semibold text-[#075E54] text-sm">{botSettings.botName}</span>
                </div>
                <p className="text-sm text-[#075E54]">{botSettings.welcomeMessage}</p>
              </div>
            )}

            {/* Vendor info for seller chat */}
            {newChatType === 'vendor' && (
              <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="h-4 w-4 text-purple-600" />
                  <span className="font-semibold text-purple-800 text-sm">{vendorName || 'Seller'}</span>
                </div>
                <p className="text-sm text-purple-700">
                  Ask about products, shipping, orders, or anything else.
                </p>
              </div>
            )}

            {/* Suggested FAQs */}
            {newChatType === 'support' && botSettings?.suggestedFaqs && botSettings.suggestedFaqs.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 font-medium">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {botSettings.suggestedFaqs.slice(0, 4).map(faq => (
                    <button
                      key={faq.id}
                      onClick={() => setFormMessage(faq.question)}
                      className="text-xs px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-[#DCF8C6] hover:border-[#25D366] hover:text-[#075E54] transition-colors"
                    >
                      {faq.question.length > 35 ? faq.question.substring(0, 35) + '...' : faq.question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <input
                ref={newChatNameRef}
                type="text"
                placeholder="Your name (optional)"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] outline-none"
              />
              <input
                type="email"
                placeholder="Your email (optional)"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] outline-none"
              />
              <textarea
                placeholder={newChatType === 'vendor' ? `Message to ${vendorName || 'seller'}...` : 'How can we help you?'}
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] resize-none outline-none"
              />
              <button
                onClick={startNewConversation}
                disabled={!formMessage.trim() || formLoading}
                className={`w-full py-3 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  newChatType === 'vendor'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-[#25D366] hover:bg-[#20BD5A]'
                }`}
              >
                {formLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Starting...</>
                ) : (
                  <><Send className="h-4 w-4" /> Send Message</>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══ CHAT VIEW ═══ */}
      {view === 'chat' && !showRatingForm && (
        <>
          {/* Chat header */}
          <div className={`px-4 py-3 flex items-center gap-3 ${
            activeConversation?.channel_type === 'customer_vendor'
              ? 'bg-purple-700 text-white'
              : 'bg-[#075E54] text-white'
          }`}>
            <button onClick={() => { setView('list'); setActiveConversation(null) }} className="p-1 hover:bg-white/10 rounded-full" aria-label="Back to conversations">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              activeConversation?.channel_type === 'customer_vendor'
                ? 'bg-white/20'
                : 'bg-white/20'
            }`}>
              {getChatIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{getChatName()}</h3>
              <p className="text-xs opacity-80">{getChatSubtitle()}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e5ddd5\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              backgroundColor: '#ECE5DD'
            }}
          >
            {/* Date pill */}
            {messages.length > 0 && (
              <div className="flex justify-center mb-2">
                <span className="px-3 py-1 bg-white/80 text-gray-600 text-xs rounded-lg shadow-sm">
                  {format(new Date(messages[0].created_at), 'MMM d, yyyy')}
                </span>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'} mb-1`}
              >
                {message.sender_type === 'system' ? (
                  <div className="w-full flex justify-center my-2">
                    <span className="inline-block px-4 py-1.5 bg-[#FFF3CD] text-[#856404] text-xs rounded-lg shadow-sm">
                      {message.content}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] relative px-3 py-2 shadow-sm ${
                      message.sender_type === 'customer'
                        ? 'bg-[#DCF8C6] rounded-lg rounded-tr-none'
                        : message.sender_type === 'bot'
                          ? 'bg-white rounded-lg rounded-tl-none'
                          : message.sender_type === 'vendor'
                            ? 'bg-[#F3E8FF] rounded-lg rounded-tl-none'
                            : 'bg-white rounded-lg rounded-tl-none'
                    }`}
                  >
                    {/* Sender name for non-customer */}
                    {message.sender_type !== 'customer' && (
                      <p className={`text-xs font-semibold mb-0.5 ${
                        message.sender_type === 'bot' ? 'text-[#25D366]'
                          : message.sender_type === 'vendor' ? 'text-purple-600'
                          : 'text-[#075E54]'
                      }`}>
                        {message.sender_type === 'bot' && '🤖 '}
                        {message.sender_type === 'vendor' && '🏪 '}
                        {message.sender_name || (message.sender_type === 'agent' ? 'Support' : 'Bot')}
                      </p>
                    )}

                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{message.content}</p>

                    <div className={`flex items-center justify-end gap-1 mt-0.5 ${
                      message.sender_type === 'customer' ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <span className="text-[10px]">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </span>
                      {message.sender_type === 'customer' && (
                        message.is_read
                          ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                          : <Check className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Bot typing */}
            {botTyping && (
              <div className="flex justify-start mb-1">
                <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
                  <p className="text-xs font-semibold text-[#25D366] mb-1">
                    🤖 {botSettings?.botName || 'FreshBot'}
                  </p>
                  <div className="flex gap-1 py-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {quickReplies.length > 0 && (
            <div className="px-3 py-2 bg-[#ECE5DD] border-t border-gray-200">
              <div className="flex flex-wrap gap-1.5">
                {quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(reply)}
                    className="px-3 py-1.5 bg-white border border-[#25D366] text-[#075E54] rounded-full text-xs font-medium hover:bg-[#DCF8C6] transition-colors shadow-sm"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border-t border-red-200">
              <p className="text-xs text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Input bar */}
          <div className="px-2 py-2 bg-[#F0F0F0] flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message"
              rows={1}
              className="flex-1 px-4 py-2.5 bg-white rounded-3xl text-sm outline-none resize-none max-h-24 border-0"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              aria-label="Send message"
              className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:bg-[#20BD5A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 bg-[#F0F0F0] flex items-center justify-between border-t border-gray-200">
            <button
              onClick={() => setShowRatingForm(true)}
              className="text-[10px] text-gray-400 hover:text-gray-600"
            >
              End conversation
            </button>
            <span className="text-[10px] text-gray-400">
              {isBotActive && '🤖 '} Powered by FreshMart
            </span>
          </div>
        </>
      )}

      {/* ═══ RATING VIEW ═══ */}
      {view === 'chat' && showRatingForm && (
        <>
          <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
            <button onClick={() => setShowRatingForm(false)} className="p-1 hover:bg-white/10 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h3 className="font-semibold text-sm">Rate your experience</h3>
          </div>

          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[#DCF8C6] rounded-full flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-[#075E54]" />
            </div>
            <h4 className="font-semibold text-gray-900 text-lg mb-1">How was your experience?</h4>
            <p className="text-sm text-gray-500 mb-6">Your feedback helps us improve</p>

            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} className="p-1" aria-label={`Rate ${star} out of 5 stars`}>
                  <Star className={`h-10 w-10 transition-colors ${
                    star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`} />
                </button>
              ))}
            </div>

            <textarea
              placeholder="Any additional feedback? (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] resize-none outline-none mb-4"
            />

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setShowRatingForm(false)
                  setActiveConversation(null)
                  setMessages([])
                  setView('list')
                  setIsBotActive(true)
                  fetchConversations()
                }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
              >
                Skip
              </button>
              <button
                onClick={submitRating}
                className="flex-1 py-2.5 bg-[#25D366] text-white rounded-xl hover:bg-[#20BD5A] font-medium"
              >
                Submit
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
