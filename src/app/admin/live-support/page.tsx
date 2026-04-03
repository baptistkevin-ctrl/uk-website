'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/layout'
import {
  MessageCircle,
  User,
  Bot,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Headphones,
  UserCheck,
  Users,
  Store
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface Conversation {
  id: string
  user_id: string | null
  session_id: string | null
  guest_name: string | null
  guest_email: string | null
  subject: string | null
  department: string
  channel_type: 'customer_admin' | 'customer_vendor' | 'vendor_admin'
  vendor_id: string | null
  vendors?: { id: string; business_name: string; logo_url: string | null } | null
  status: 'waiting' | 'active' | 'resolved' | 'closed'
  assigned_agent_id: string | null
  unread_agent: number
  unread_customer: number
  rating: number | null
  feedback: string | null
  metadata: any
  created_at: string
  last_message_at: string | null
  chat_messages?: Message[]
}

interface Message {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'agent' | 'system' | 'bot' | 'vendor'
  sender_id: string | null
  sender_name: string | null
  content: string
  message_type: string
  attachments: any[]
  metadata: any
  is_read: boolean
  created_at: string
}

interface AgentStats {
  activeChats: number
  waitingChats: number
  resolvedToday: number
  avgResponseTime: string
}

export default function LiveSupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active' | 'resolved'>('all')
  const [channelFilter, setChannelFilter] = useState<'all' | 'customer_admin' | 'vendor_admin'>('all')
  const [stats, setStats] = useState<AgentStats>({
    activeChats: 0,
    waitingChats: 0,
    resolvedToday: 0,
    avgResponseTime: '0m'
  })
  const [showAIHistory, setShowAIHistory] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMsgTimeRef = useRef<string | null>(null)

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const channelParam = channelFilter !== 'all' ? `?channel_type=${channelFilter}` : ''
      const res = await fetch(`/api/admin/live-support/conversations${channelParam}`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])

        // Update stats
        const convs = data.conversations || []
        const waiting = convs.filter((c: Conversation) => c.status === 'waiting').length
        const active = convs.filter((c: Conversation) => c.status === 'active').length
        const resolvedToday = convs.filter((c: Conversation) => {
          const today = new Date().toDateString()
          return c.status === 'resolved' && new Date(c.created_at).toDateString() === today
        }).length

        setStats(prev => ({
          ...prev,
          waitingChats: waiting,
          activeChats: active,
          resolvedToday
        }))
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string, since?: string) => {
    try {
      let url = `/api/admin/live-support/messages?conversation_id=${conversationId}`
      if (since) url += `&since=${since}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (since) {
          // Append new messages
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMessages = data.messages.filter((m: Message) => !existingIds.has(m.id))
            return [...prev, ...newMessages]
          })
        } else {
          setMessages(data.messages || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  // Accept a waiting conversation
  const acceptConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/admin/live-support/conversations/${conversationId}/accept`, {
        method: 'POST'
      })
      if (res.ok) {
        fetchConversations()
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(prev => prev ? { ...prev, status: 'active' } : null)
        }
      }
    } catch (error) {
      console.error('Failed to accept conversation:', error)
    }
  }

  // Close/resolve conversation
  const closeConversation = async (conversationId: string, status: 'resolved' | 'closed') => {
    try {
      const res = await fetch(`/api/admin/live-support/conversations/${conversationId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchConversations()
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null)
          setMessages([])
        }
      }
    } catch (error) {
      console.error('Failed to close conversation:', error)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setSending(true)

    try {
      const res = await fetch('/api/admin/live-support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: messageContent
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Select conversation
  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
  }

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initial load and polling
  useEffect(() => {
    fetchConversations()

    // Poll for new conversations every 5 seconds
    pollIntervalRef.current = setInterval(fetchConversations, 5000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [channelFilter])

  // Track last message time for polling
  useEffect(() => {
    if (messages.length > 0) {
      lastMsgTimeRef.current = messages[messages.length - 1].created_at
    }
  }, [messages])

  // Poll for new messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return

    const pollMessages = setInterval(() => {
      if (lastMsgTimeRef.current) {
        fetchMessages(selectedConversation.id, lastMsgTimeRef.current)
      }
    }, 3000)

    return () => clearInterval(pollMessages)
  }, [selectedConversation])

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (filter === 'all') return conv.status !== 'closed'
    return conv.status === filter
  })

  // Get AI conversation history (bot messages)
  const aiMessages = messages.filter(m => m.sender_type === 'bot' || m.sender_type === 'customer')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Waiting
          </span>
        )
      case 'active':
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            Active
          </span>
        )
      case 'resolved':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Resolved
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Headphones className="h-7 w-7 text-emerald-600" />
              Live Support
            </h1>
            <p className="text-gray-500 mt-1">
              Manage chat conversations in real-time
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">
                {stats.waitingChats} waiting
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                {stats.activeChats} active
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {stats.resolvedToday} resolved today
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Conversations List */}
          <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            {/* Channel Filter */}
            <div className="p-3 border-b">
              <div className="flex gap-1 mb-2">
                {[
                  { id: 'all', label: 'All Chats' },
                  { id: 'customer_admin', label: 'Customers' },
                  { id: 'vendor_admin', label: 'Vendors' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setChannelFilter(tab.id as typeof channelFilter); setSelectedConversation(null); setMessages([]) }}
                    className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                      channelFilter === tab.id
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Status Filter Tabs */}
            <div className="p-3 border-b">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'waiting', label: 'Waiting' },
                  { id: 'active', label: 'Active' },
                  { id: 'resolved', label: 'Resolved' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as typeof filter)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      filter === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
                  <MessageCircle className="h-12 w-12 mb-2" />
                  <p className="text-sm">No conversations</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            conv.status === 'waiting'
                              ? 'bg-orange-100'
                              : conv.status === 'active'
                                ? 'bg-emerald-100'
                                : 'bg-gray-100'
                          }`}>
                            <User className={`h-5 w-5 ${
                              conv.status === 'waiting'
                                ? 'text-orange-600'
                                : conv.status === 'active'
                                  ? 'text-emerald-600'
                                  : 'text-gray-500'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {conv.channel_type === 'vendor_admin'
                                ? conv.vendors?.business_name || 'Vendor'
                                : conv.guest_name || 'Guest'}
                            </p>
                            <div className="flex items-center gap-1">
                              {conv.channel_type === 'vendor_admin' && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded font-medium">
                                  Vendor
                                </span>
                              )}
                              <p className="text-xs text-gray-500">
                                {conv.subject || 'No subject'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {conv.unread_agent > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {conv.unread_agent}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {getStatusBadge(conv.status)}
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(conv.last_message_at || conv.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedConversation.guest_name || 'Guest'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {selectedConversation.guest_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {selectedConversation.guest_email}
                          </span>
                        )}
                        {getStatusBadge(selectedConversation.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConversation.status === 'waiting' && (
                      <button
                        onClick={() => acceptConversation(selectedConversation.id)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center gap-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        Accept Chat
                      </button>
                    )}
                    {(selectedConversation.status === 'active' || selectedConversation.status === 'waiting') && (
                      <button
                        onClick={() => closeConversation(selectedConversation.id, 'resolved')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                {/* AI History Panel */}
                {aiMessages.length > 0 && selectedConversation.status === 'waiting' && (
                  <div className="border-b bg-amber-50">
                    <button
                      onClick={() => setShowAIHistory(!showAIHistory)}
                      className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-amber-700"
                    >
                      <span className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Previous AI Conversation ({aiMessages.length} messages)
                      </span>
                      {showAIHistory ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {showAIHistory && (
                      <div className="px-4 pb-3 max-h-40 overflow-y-auto space-y-2">
                        {aiMessages.slice(-10).map(msg => (
                          <div
                            key={msg.id}
                            className={`text-xs ${
                              msg.sender_type === 'customer'
                                ? 'text-gray-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            <span className="font-medium">
                              {msg.sender_type === 'customer' ? 'Customer' : 'Bot'}:
                            </span>{' '}
                            {msg.content.length > 100
                              ? msg.content.substring(0, 100) + '...'
                              : msg.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.sender_type === 'system' ? (
                        <div className="w-full text-center">
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            {msg.content}
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`max-w-[70%] ${
                            msg.sender_type === 'agent'
                              ? 'bg-emerald-600 text-white rounded-2xl rounded-br-md'
                              : msg.sender_type === 'vendor'
                                ? 'bg-purple-100 text-gray-900 rounded-2xl rounded-bl-md border border-purple-200'
                                : msg.sender_type === 'bot'
                                  ? 'bg-amber-50 text-gray-900 rounded-2xl rounded-bl-md border border-amber-200'
                                  : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
                          } px-4 py-2`}
                        >
                          {msg.sender_type !== 'agent' && (
                            <div className="flex items-center gap-1 mb-1">
                              {msg.sender_type === 'bot' ? (
                                <Bot className="h-3 w-3 text-amber-600" />
                              ) : msg.sender_type === 'vendor' ? (
                                <Store className="h-3 w-3 text-purple-600" />
                              ) : (
                                <User className="h-3 w-3 text-gray-500" />
                              )}
                              <span className={`text-xs font-medium ${
                                msg.sender_type === 'bot' ? 'text-amber-600' :
                                msg.sender_type === 'vendor' ? 'text-purple-600' : 'text-gray-500'
                              }`}>
                                {msg.sender_name || (msg.sender_type === 'bot' ? 'FreshBot' : msg.sender_type === 'vendor' ? 'Vendor' : 'Customer')}
                              </span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <div className={`text-xs mt-1 ${
                            msg.sender_type === 'agent'
                              ? 'text-emerald-100'
                              : 'text-gray-400'
                          }`}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                {selectedConversation.status === 'active' && (
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message..."
                        rows={1}
                        className="flex-1 px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Show message if chat is waiting */}
                {selectedConversation.status === 'waiting' && (
                  <div className="p-4 border-t bg-orange-50 text-center">
                    <p className="text-sm text-orange-700">
                      Click "Accept Chat" to start responding to this customer
                    </p>
                  </div>
                )}

                {/* Show message if chat is resolved */}
                {selectedConversation.status === 'resolved' && (
                  <div className="p-4 border-t bg-blue-50 text-center">
                    <p className="text-sm text-blue-700">
                      This conversation has been resolved
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Headphones className="h-16 w-16 mb-4" />
                <h3 className="text-lg font-medium text-gray-600">Select a conversation</h3>
                <p className="text-sm">Choose a chat from the list to start helping customers</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
