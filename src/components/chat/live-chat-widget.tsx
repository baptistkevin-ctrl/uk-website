'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import { Message, QuickReply, BotResponse, BotSettings, Conversation, Availability } from './chat-types'
import { ChatHeader } from './ChatHeader'
import { ChatStartForm } from './ChatStartForm'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ChatRating } from './ChatRating'

export function LiveChatWidget() {
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
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null)
  const [isBotActive, setIsBotActive] = useState(true)
  const [botTyping, setBotTyping] = useState(false)
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [initialMessage, setInitialMessage] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const getSessionId = () => {
    if (typeof window === 'undefined') return null
    let sessionId = localStorage.getItem('chat_session_id')
    if (!sessionId) {
      sessionId = 'chat_' + crypto.randomUUID()
      localStorage.setItem('chat_session_id', sessionId)
    }
    return sessionId
  }

  const fetchBotSettings = async () => {
    try {
      const res = await fetch(`/api/chat/bot?session_id=${getSessionId()}`)
      if (res.ok) { const data = await res.json(); setBotSettings(data); return data }
    } catch (error) { console.error('Failed to fetch bot settings:', error) }
    return null
  }

  const sendToBotAPI = async (message: string, conversationId?: string): Promise<BotResponse | null> => {
    try {
      const res = await fetch('/api/chat/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message, conversation_id: conversationId, session_id: getSessionId(),
          context: { page: typeof window !== 'undefined' ? window.location.href : '' }
        })
      })
      if (res.ok) return await res.json()
    } catch (error) { console.error('Failed to get bot response:', error) }
    return null
  }

  const addBotMessage = (content: string, botName: string = 'FreshBot', qr?: QuickReply[]) => {
    const botMessage: Message = {
      id: 'bot-' + Date.now(), sender_type: 'bot', sender_name: botName, content,
      message_type: qr ? 'quick_reply' : 'text', attachments: [], metadata: { quickReplies: qr },
      is_read: true, created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, botMessage])
    if (qr) setQuickReplies(qr)
  }

  const handleBotResponse = (botResponse: BotResponse | null) => {
    setBotTyping(false)
    if (!botResponse) return
    addBotMessage(botResponse.message, botResponse.botName || botSettings?.botName || 'FreshBot', botResponse.quickReplies)
    if (botResponse.shouldHandoff) {
      setIsBotActive(false)
      setMessages(prev => [...prev, {
        id: 'system-' + Date.now(), sender_type: 'system', sender_name: null,
        content: 'Connecting you with a customer service agent...', message_type: 'text',
        attachments: [], metadata: {}, is_read: true, created_at: new Date().toISOString()
      }])
    }
  }

  const triggerBotResponse = async (messageContent: string, conversationId?: string) => {
    if (!isBotActive || !botSettings?.isEnabled) return
    setBotTyping(true)
    const botResponse = await sendToBotAPI(messageContent, conversationId)
    setTimeout(() => handleBotResponse(botResponse), botResponse?.typingDelay || botSettings.typingDelay || 1000)
  }

  const checkAvailability = async () => {
    try {
      const res = await fetch('/api/chat?action=availability')
      if (res.ok) setAvailability(await res.json())
    } catch (error) { console.error('Failed to check availability:', error) }
  }

  const fetchMessages = async (conversationId: string, since?: string) => {
    try {
      let url = `/api/chat/messages?conversation_id=${conversationId}`
      if (since) url += `&since=${since}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => since ? [...prev, ...data.messages] : (data.messages || []))
      }
    } catch (error) { console.error('Failed to fetch messages:', error) }
  }

  const checkExistingConversation = async () => {
    try {
      const res = await fetch(`/api/chat?session_id=${getSessionId()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.conversation) {
          setConversation(data.conversation)
          setShowStartForm(false)
          fetchMessages(data.conversation.id)
          if (data.conversation.status === 'waiting' || data.conversation.assigned_agent_id) setIsBotActive(false)
        }
      }
    } catch (error) { console.error('Failed to check conversation:', error) }
  }

  const startConversation = async () => {
    if (!initialMessage.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: getSessionId(), guest_name: name || undefined, guest_email: email || undefined,
          subject: subject || undefined, initial_message: initialMessage, metadata: { page: window.location.href }
        })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.conversation_id) {
          const convRes = await fetch(`/api/chat?conversation_id=${data.conversation_id}`)
          if (convRes.ok) {
            const convData = await convRes.json()
            setConversation(convData.conversation)
            setMessages(convData.conversation?.chat_messages || [])
          }
          setShowStartForm(false)
          await triggerBotResponse(initialMessage, data.conversation_id)
          setInitialMessage('')
        }
      }
    } catch (error) { console.error('Failed to start conversation:', error) }
    finally { setLoading(false) }
  }

  const handleQuickReply = async (reply: QuickReply) => {
    setQuickReplies([])
    setMessages(prev => [...prev, {
      id: 'user-' + Date.now(), sender_type: 'customer', sender_name: name || 'You',
      content: reply.text, message_type: 'text', attachments: [], metadata: {},
      is_read: false, created_at: new Date().toISOString()
    }])
    await triggerBotResponse(reply.value, conversation?.id)
    if (conversation) {
      try {
        await fetch('/api/chat/messages', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conversation.id, content: reply.text })
        })
      } catch (error) { console.error('Failed to save quick reply:', error) }
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return
    const messageContent = newMessage.trim()
    setNewMessage(''); setSending(true); setQuickReplies([])
    const optimisticId = 'temp-' + Date.now()
    const optimisticMessage: Message = {
      id: optimisticId, sender_type: 'customer', sender_name: name || 'You',
      content: messageContent, message_type: 'text', attachments: [], metadata: {},
      is_read: false, created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMessage])
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversation.id, content: messageContent })
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => prev.map(m => m.id === optimisticId ? data.message : m))
        await triggerBotResponse(messageContent, conversation.id)
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
    } finally { setSending(false) }
  }

  const resetChat = () => {
    setConversation(null); setMessages([]); setShowStartForm(true); setShowRatingForm(false)
    setRating(0); setFeedback(''); setIsBotActive(true); setQuickReplies([])
  }

  const submitRating = async () => {
    if (!conversation) return
    try {
      await fetch('/api/chat', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id, action: 'resolve',
          rating: rating || undefined, feedback: feedback || undefined
        })
      })
      resetChat()
    } catch (error) { console.error('Failed to close conversation:', error) }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      showStartForm ? startConversation() : sendMessage()
    }
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, botTyping])

  useEffect(() => {
    if (!conversation || conversation.status === 'closed' || conversation.status === 'resolved') return
    const poll = () => {
      const last = messages[messages.length - 1]
      if (last) fetchMessages(conversation.id, last.created_at)
    }
    pollIntervalRef.current = setInterval(poll, 3000)
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current) }
  }, [conversation, messages])

  useEffect(() => {
    if (isOpen) { checkAvailability(); checkExistingConversation(); fetchBotSettings() }
  }, [isOpen])

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 w-12 h-12 lg:w-14 lg:h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:scale-105 transition-all flex items-center justify-center z-40" aria-label="Open chat">
        <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6" />
      </button>
    )
  }

  return (
    <div role="dialog" aria-label="Live chat" className={`fixed bottom-16 lg:bottom-6 right-2 lg:right-6 w-[calc(100vw-16px)] sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col ${isMinimized ? 'h-14' : 'h-[calc(100vh-5rem)] lg:h-[550px]'} transition-all duration-200`}>
      <ChatHeader isBotActive={isBotActive} botSettings={botSettings} availability={availability} isMinimized={isMinimized} onToggleMinimize={() => setIsMinimized(!isMinimized)} onClose={() => setIsOpen(false)} />
      {!isMinimized && (
        <>
          {showStartForm && !showRatingForm && (
            <ChatStartForm botSettings={botSettings} availability={availability} name={name} email={email} initialMessage={initialMessage} loading={loading} onNameChange={setName} onEmailChange={setEmail} onInitialMessageChange={setInitialMessage} onStart={startConversation} onKeyDown={handleKeyPress} />
          )}
          {showRatingForm && (
            <ChatRating rating={rating} feedback={feedback} onRatingChange={setRating} onFeedbackChange={setFeedback} onSubmit={submitRating} onSkip={resetChat} />
          )}
          {!showStartForm && !showRatingForm && (
            <>
              <ChatMessages messages={messages} botTyping={botTyping} botSettings={botSettings} quickReplies={quickReplies} isBotActive={isBotActive} messagesEndRef={messagesEndRef} onQuickReply={handleQuickReply} />
              <ChatInput newMessage={newMessage} sending={sending} isBotActive={isBotActive} inputRef={inputRef} onMessageChange={setNewMessage} onSend={sendMessage} onEndConversation={() => setShowRatingForm(true)} onKeyDown={handleKeyPress} />
            </>
          )}
        </>
      )}
    </div>
  )
}
