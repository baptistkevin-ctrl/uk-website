export interface Message {
  id: string
  sender_type: 'customer' | 'agent' | 'system' | 'bot'
  sender_name: string | null
  content: string
  message_type: string
  attachments: any[]
  metadata: any
  is_read: boolean
  created_at: string
}

export interface QuickReply {
  text: string
  value: string
}

export interface BotResponse {
  message: string
  type: 'text' | 'quick_reply' | 'card' | 'carousel'
  quickReplies?: QuickReply[]
  shouldHandoff?: boolean
  intent?: string
  confidence?: number
  botName?: string
  typingDelay?: number
}

export interface BotSettings {
  isEnabled: boolean
  botName: string
  welcomeMessage: string
  botAvatar: string
  typingDelay: number
  suggestedFaqs: { id: string; question: string; category: string }[]
}

export interface Conversation {
  id: string
  status: string
  assigned_agent_id: string | null
  department: string
  subject: string | null
  rating: number | null
  created_at: string
}

export interface Availability {
  is_available: boolean
  estimated_wait_minutes: number
  available_agents: number
}
