'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle,
  User,
  Bot,
  Clock,
  Send,
  CheckCircle,
  Loader2,
  Mail,
  ChevronDown,
  ChevronUp,
  Headphones,
  UserCheck,
  Store,
  ShieldCheck,
  ArrowLeft
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
  channel_type: 'customer_vendor' | 'vendor_admin'
  status: 'waiting' | 'active' | 'resolved' | 'closed'
  assigned_agent_id: string | null
  unread_agent: number
  unread_customer: number
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

export default function VendorLiveChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active' | 'resolved'>('all')
  const [channelTab, setChannelTab] = useState<'customer_vendor' | 'vendor_admin'>('customer_vendor')
  const [showAIHistory, setShowAIHistory] = useState(true)
  const [stats, setStats] = useState({ waiting: 0, active: 0, resolved: 0 })
  const [actionError, setActionError] = useState<string | null>(null)

  const showActionError = (msg: string) => {
    setActionError(msg)
    setTimeout(() => setActionError(null), 5000)
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/vendor/live-chat/conversations?channel_type=${channelTab}`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])

        const convs = data.conversations || []
        const waiting = convs.filter((c: Conversation) => c.status === 'waiting').length
        const active = convs.filter((c: Conversation) => c.status === 'active').length
        const resolved = convs.filter((c: Conversation) => c.status === 'resolved').length
        setStats({ waiting, active, resolved })
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string, since?: string) => {
    try {
      let url = `/api/vendor/live-chat/messages?conversation_id=${conversationId}`
      if (since) url += `&since=${since}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (since) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMessages = (data.messages || []).filter((m: Message) => !existingIds.has(m.id))
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

  const acceptConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/vendor/live-chat/conversations/${conversationId}/accept`, {
        method: 'POST'
      })
      if (res.ok) {
        fetchConversations()
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(prev => prev ? { ...prev, status: 'active' } : null)
        }
      } else {
        const data = await res.json().catch(() => ({}))
        showActionError(data.error || 'Failed to accept conversation')
      }
    } catch (error) {
      console.error('Failed to accept conversation:', error)
      showActionError('Failed to accept conversation')
    }
  }

  const closeConversation = async (conversationId: string, status: 'resolved' | 'closed') => {
    try {
      const res = await fetch(`/api/vendor/live-chat/conversations/${conversationId}/close`, {
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
      } else {
        const data = await res.json().catch(() => ({}))
        showActionError(data.error || 'Failed to close conversation')
      }
    } catch (error) {
      console.error('Failed to close conversation:', error)
      showActionError('Failed to close conversation')
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setSending(true)

    // Optimistic update
    const tempId = 'temp-' + Date.now()
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: selectedConversation.id,
      sender_type: channelTab === 'customer_vendor' ? 'vendor' : 'customer',
      sender_id: null,
      sender_name: 'You',
      content: messageContent,
      message_type: 'text',
      attachments: [],
      metadata: {},
      is_read: false,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch('/api/vendor/live-chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: messageContent
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => prev.map(m => m.id === tempId ? data.message : m))
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setNewMessage(messageContent)
        showActionError('Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(messageContent)
      showActionError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    fetchConversations()
    pollIntervalRef.current = setInterval(() => {
      if (!navigator.onLine) return
      fetchConversations()
    }, 5000)
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [channelTab])

  const lastMsgTimeRef = useRef<string | null>(null)
  useEffect(() => {
    if (messages.length > 0) {
      lastMsgTimeRef.current = messages[messages.length - 1].created_at
    }
  }, [messages])

  useEffect(() => {
    if (!selectedConversation) return
    const pollMessages = setInterval(() => {
      if (!navigator.onLine) return
      if (lastMsgTimeRef.current) {
        fetchMessages(selectedConversation.id, lastMsgTimeRef.current)
      }
    }, 3000)
    return () => clearInterval(pollMessages)
  }, [selectedConversation])

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'all') return conv.status !== 'closed'
    return conv.status === filter
  })

  // AI conversation history - only messages before vendor/agent joined
  const aiMessages = (() => {
    const result: Message[] = []
    for (const m of messages) {
      if (m.sender_type === 'vendor' || m.sender_type === 'agent') break
      if (m.sender_type === 'bot' || m.sender_type === 'customer') result.push(m)
    }
    return result
  })()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" /> Waiting
          </span>
        )
      case 'active':
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> Active
          </span>
        )
      case 'resolved':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Resolved
          </span>
        )
      default:
        return null
    }
  }

  const isOwnMessage = (senderType: string) => {
    if (channelTab === 'customer_vendor') return senderType === 'vendor'
    if (channelTab === 'vendor_admin') return senderType === 'customer' // vendor is 'customer' in vendor_admin
    return false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600" />
            Live Chat
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {channelTab === 'customer_vendor'
              ? 'Chat with customers about your products & orders'
              : 'Get help from platform admin'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-orange-50 rounded-lg">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600" />
            <span className="text-xs sm:text-sm font-medium text-orange-700">{stats.waiting} waiting</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-50 rounded-lg">
            <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
            <span className="text-xs sm:text-sm font-medium text-emerald-700">{stats.active} active</span>
          </div>
        </div>
      </div>

      {/* Channel Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setChannelTab('customer_vendor'); setSelectedConversation(null); setMessages([]); setFilter('all') }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            channelTab === 'customer_vendor'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <User className="h-4 w-4" />
          Customer Chats
        </button>
        <button
          onClick={() => { setChannelTab('vendor_admin'); setSelectedConversation(null); setMessages([]); setFilter('all') }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            channelTab === 'vendor_admin'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Admin Support
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List */}
        <div className={`w-full md:w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Filter Tabs */}
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
                <p className="text-sm">
                  {channelTab === 'customer_vendor'
                    ? 'No customer conversations yet'
                    : 'No support conversations'}
                </p>
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
                          conv.status === 'waiting' ? 'bg-orange-100' :
                          conv.status === 'active' ? 'bg-emerald-100' : 'bg-gray-100'
                        }`}>
                          <User className={`h-5 w-5 ${
                            conv.status === 'waiting' ? 'text-orange-600' :
                            conv.status === 'active' ? 'text-emerald-600' : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {conv.guest_name || 'Customer'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {conv.subject || 'No subject'}
                          </p>
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
        <div className={`flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col ${
          selectedConversation ? 'flex' : 'hidden md:flex'
        }`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setSelectedConversation(null); setMessages([]) }}
                    className="md:hidden p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedConversation.guest_name || 'Customer'}
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
                  {selectedConversation.status === 'waiting' && channelTab === 'customer_vendor' && (
                    <button
                      onClick={() => acceptConversation(selectedConversation.id)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      Accept Chat
                    </button>
                  )}
                  {(selectedConversation.status === 'active' || selectedConversation.status === 'waiting') && channelTab === 'customer_vendor' && (
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
              {aiMessages.length > 0 && (selectedConversation.status === 'waiting' || selectedConversation.status === 'active') && channelTab === 'customer_vendor' && (
                <div className="border-b bg-amber-50">
                  <button
                    onClick={() => setShowAIHistory(!showAIHistory)}
                    className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-amber-700"
                  >
                    <span className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Previous AI Conversation ({aiMessages.length} messages)
                    </span>
                    {showAIHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {showAIHistory && (
                    <div className="px-4 pb-3 max-h-40 overflow-y-auto space-y-2">
                      {aiMessages.slice(-10).map(msg => (
                        <div key={msg.id} className={`text-xs ${msg.sender_type === 'customer' ? 'text-gray-700' : 'text-emerald-700'}`}>
                          <span className="font-medium">
                            {msg.sender_type === 'customer' ? 'Customer' : 'Bot'}:
                          </span>{' '}
                          {msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content}
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
                    className={`flex ${isOwnMessage(msg.sender_type) ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender_type === 'system' ? (
                      <div className="w-full text-center">
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    ) : (
                      <div className={`max-w-[70%] ${
                        isOwnMessage(msg.sender_type)
                          ? 'bg-emerald-600 text-white rounded-2xl rounded-br-md'
                          : msg.sender_type === 'bot'
                            ? 'bg-amber-50 text-gray-900 rounded-2xl rounded-bl-md border border-amber-200'
                            : msg.sender_type === 'agent'
                              ? 'bg-blue-100 text-gray-900 rounded-2xl rounded-bl-md border border-blue-200'
                              : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
                      } px-4 py-2`}>
                        {!isOwnMessage(msg.sender_type) && (
                          <div className="flex items-center gap-1 mb-1">
                            {msg.sender_type === 'bot' ? (
                              <Bot className="h-3 w-3 text-amber-600" />
                            ) : msg.sender_type === 'agent' ? (
                              <ShieldCheck className="h-3 w-3 text-blue-600" />
                            ) : (
                              <User className="h-3 w-3 text-gray-500" />
                            )}
                            <span className={`text-xs font-medium ${
                              msg.sender_type === 'bot' ? 'text-amber-600' :
                              msg.sender_type === 'agent' ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {msg.sender_name || (msg.sender_type === 'bot' ? 'FreshBot' : msg.sender_type === 'agent' ? 'Admin' : 'Customer')}
                            </span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className={`text-xs mt-1 ${
                          isOwnMessage(msg.sender_type) ? 'text-emerald-100' : 'text-gray-400'
                        }`}>
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Error Banner */}
              {actionError && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-sm flex items-center justify-between">
                  <span>{actionError}</span>
                  <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700 ml-2">&times;</button>
                </div>
              )}

              {/* Reply Input */}
              {(selectedConversation.status === 'active' || (channelTab === 'vendor_admin' && selectedConversation.status !== 'resolved' && selectedConversation.status !== 'closed')) && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={channelTab === 'customer_vendor' ? 'Reply to customer...' : 'Message admin support...'}
                      rows={1}
                      className="flex-1 px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {selectedConversation.status === 'waiting' && channelTab === 'customer_vendor' && (
                <div className="p-4 border-t bg-orange-50 text-center">
                  <p className="text-sm text-orange-700">
                    Click &quot;Accept Chat&quot; to start responding to this customer
                  </p>
                </div>
              )}

              {selectedConversation.status === 'resolved' && (
                <div className="p-4 border-t bg-blue-50 text-center">
                  <p className="text-sm text-blue-700">This conversation has been resolved</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              {channelTab === 'customer_vendor' ? (
                <>
                  <Headphones className="h-16 w-16 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">Customer Conversations</h3>
                  <p className="text-sm">Select a chat to respond to your customers</p>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-16 w-16 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">Admin Support</h3>
                  <p className="text-sm">Chat with platform admin for help</p>
                  <button
                    onClick={async () => {
                      // Start a new vendor→admin conversation
                      try {
                        const res = await fetch('/api/chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            subject: 'Vendor Support Request',
                            department: 'vendor_support',
                            channel_type: 'vendor_admin',
                            initial_message: 'Hello, I need help with my vendor account.'
                          })
                        })
                        if (res.ok) {
                          fetchConversations()
                        } else {
                          showActionError('Failed to start support chat. Please try again.')
                        }
                      } catch (error) {
                        console.error('Failed to start support chat:', error)
                        showActionError('Failed to start support chat. Please try again.')
                      }
                    }}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Start Support Chat
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
