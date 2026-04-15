import { create } from 'zustand'

export interface ChatMessage {
  id: string
  orderId: string
  senderId: string
  senderName: string
  senderRole: 'customer' | 'picker'
  message: string
  type: 'text' | 'preference' | 'photo_request' | 'photo_response' | 'substitution' | 'system'
  imageUrl?: string
  timestamp: string
  read: boolean
  /** Tracks optimistic send failures */
  _failed?: boolean
}

export interface ItemPreference {
  productId: string
  productName: string
  note: string
  substitutionPref: 'accept_similar' | 'contact_me' | 'remove_item'
}

interface PickerChatStore {
  // State
  messages: ChatMessage[]
  activeOrderId: string | null
  pickerName: string | null
  isPickerOnline: boolean
  isOpen: boolean
  unreadCount: number
  preferences: ItemPreference[]
  generalNote: string
  isLoading: boolean

  // Actions
  setActiveOrder: (orderId: string) => void
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
  addMessage: (message: ChatMessage) => void
  markAllRead: () => void
  setPreference: (pref: ItemPreference) => void
  removePreference: (productId: string) => void
  setGeneralNote: (note: string) => void
  clearChat: () => void

  // Fetch
  fetchMessages: (orderId: string) => Promise<void>
  sendMessage: (message: string, type?: ChatMessage['type']) => Promise<void>
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf_token') return value
  }
  return null
}

export const usePickerChatStore = create<PickerChatStore>()((set, get) => ({
  messages: [],
  activeOrderId: null,
  pickerName: null,
  isPickerOnline: false,
  isOpen: false,
  unreadCount: 0,
  preferences: [],
  generalNote: '',
  isLoading: false,

  setActiveOrder: (orderId) => {
    set({ activeOrderId: orderId })
  },

  openChat: () => set({ isOpen: true }),

  closeChat: () => set({ isOpen: false }),

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      unreadCount: message.senderRole === 'picker'
        ? state.unreadCount + 1
        : state.unreadCount,
    }))
  },

  markAllRead: () => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.read ? m : { ...m, read: true }
      ),
      unreadCount: 0,
    }))
  },

  setPreference: (pref) => {
    set((state) => {
      const existing = state.preferences.findIndex(
        (p) => p.productId === pref.productId
      )
      if (existing >= 0) {
        const updated = [...state.preferences]
        updated[existing] = pref
        return { preferences: updated }
      }
      return { preferences: [...state.preferences, pref] }
    })
  },

  removePreference: (productId) => {
    set((state) => ({
      preferences: state.preferences.filter((p) => p.productId !== productId),
    }))
  },

  setGeneralNote: (note) => set({ generalNote: note }),

  clearChat: () => {
    set({
      messages: [],
      activeOrderId: null,
      pickerName: null,
      isPickerOnline: false,
      isOpen: false,
      unreadCount: 0,
      preferences: [],
      generalNote: '',
      isLoading: false,
    })
  },

  fetchMessages: async (orderId) => {
    set({ isLoading: true })

    try {
      const response = await fetch(`/api/picker-chat?orderId=${encodeURIComponent(orderId)}`)

      if (!response.ok) {
        console.error('Failed to fetch picker chat messages:', response.status)
        set({ isLoading: false })
        return
      }

      const data = await response.json()

      const unread = (data.messages || []).filter(
        (m: ChatMessage) => !m.read && m.senderRole === 'picker'
      ).length

      set({
        messages: data.messages || [],
        pickerName: data.pickerName || null,
        isPickerOnline: data.isPickerOnline || false,
        activeOrderId: orderId,
        unreadCount: unread,
        isLoading: false,
      })
    } catch (error) {
      console.error('Picker chat fetch error:', error)
      set({ isLoading: false })
    }
  },

  sendMessage: async (message, type = 'text') => {
    const { activeOrderId, messages } = get()

    if (!activeOrderId) {
      console.error('No active order for picker chat')
      return
    }

    // Optimistic message
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      orderId: activeOrderId,
      senderId: 'self',
      senderName: 'You',
      senderRole: 'customer',
      message,
      type,
      timestamp: new Date().toISOString(),
      read: true,
    }

    set({ messages: [...messages, optimisticMessage] })

    try {
      const csrfToken = getCsrfToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken
      }

      const response = await fetch('/api/picker-chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: activeOrderId,
          message,
          type,
        }),
      })

      if (!response.ok) {
        throw new Error(`Send failed: ${response.status}`)
      }

      const data = await response.json()

      // Replace optimistic message with server response
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === optimisticId
            ? { ...data.message, read: true }
            : m
        ),
      }))
    } catch (error) {
      console.error('Picker chat send error:', error)

      // Mark optimistic message as failed
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === optimisticId
            ? { ...m, _failed: true }
            : m
        ),
      }))
    }
  },
}))
