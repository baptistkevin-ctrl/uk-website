import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chat as geminiChat } from '@/lib/ai/gemini'

export const dynamic = 'force-dynamic'

interface BotResponse {
  message: string
  type: 'text' | 'quick_reply' | 'card' | 'carousel'
  quickReplies?: { text: string; value: string }[]
  cardData?: Record<string, unknown>
  shouldHandoff?: boolean
  intent?: string
  confidence?: number
}

// Process message with the chatbot (Gemini AI powered)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const {
      message,
      conversation_id,
      session_id,
      context = {},
      history = []
    } = body

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Get chatbot settings
    const { data: settings } = await supabase
      .from('chatbot_settings')
      .select('setting_key, setting_value')

    const settingsMap = settings?.reduce((acc, s) => {
      acc[s.setting_key] = s.setting_value
      return acc
    }, {} as Record<string, unknown>) || {}

    const isEnabled = settingsMap['is_enabled'] === true || settingsMap['is_enabled'] === 'true'
    const useAI = settingsMap['use_ai'] === true || settingsMap['use_ai'] === 'true' || true // Default to AI
    const botName = (settingsMap['bot_name'] as string) || 'FreshBot'
    const typingDelay = parseInt(String(settingsMap['typing_delay_ms'] || '1000'))

    if (!isEnabled) {
      return NextResponse.json({
        message: 'Our chatbot is currently offline. Connecting you to a human agent...',
        type: 'text',
        shouldHandoff: true
      })
    }

    let response: BotResponse

    // Use Gemini AI for intelligent responses
    if (useAI) {
      // Get conversation history from database if available
      let conversationHistory = history
      if (conversation_id && (!history || history.length === 0)) {
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('sender_type, content')
          .eq('conversation_id', conversation_id)
          .order('created_at', { ascending: true })
          .limit(20)

        if (messages) {
          conversationHistory = messages
            .filter(m => m.sender_type === 'customer' || m.sender_type === 'bot')
            .map(m => ({
              role: m.sender_type === 'customer' ? 'user' : 'assistant',
              content: m.content
            }))
        }
      }

      // Call Gemini AI
      const aiResponse = await geminiChat(message, conversationHistory, context)

      // Build quick replies based on intent
      let quickReplies: { text: string; value: string }[] = []
      if (aiResponse.intent === 'track_order') {
        quickReplies = [
          { text: 'View my orders', value: 'view_orders' },
          { text: 'Talk to agent', value: 'contact_human' }
        ]
      } else if (aiResponse.intent === 'delivery_info') {
        quickReplies = [
          { text: 'Track my order', value: 'track_order' },
          { text: 'Change delivery', value: 'change_delivery' }
        ]
      } else if (aiResponse.intent === 'returns') {
        quickReplies = [
          { text: 'Start a return', value: 'start_return' },
          { text: 'Check refund status', value: 'refund_status' }
        ]
      } else if (aiResponse.intent === 'product_search') {
        quickReplies = [
          { text: 'View all categories', value: 'categories' },
          { text: 'Today\'s deals', value: 'deals' }
        ]
      } else if (!aiResponse.shouldHandoff) {
        quickReplies = [
          { text: 'This helped!', value: 'thanks' },
          { text: 'Talk to agent', value: 'contact_human' }
        ]
      }

      response = {
        message: aiResponse.message,
        type: quickReplies.length > 0 ? 'quick_reply' : 'text',
        quickReplies,
        shouldHandoff: aiResponse.shouldHandoff,
        intent: aiResponse.intent,
        confidence: aiResponse.shouldHandoff ? 1.0 : 0.9
      }
    } else {
      // Fallback to database-driven responses
      const handoffKeywords = (settingsMap['handoff_keywords'] as string[]) || ['agent', 'human', 'person']
      const fallbackThreshold = parseFloat(String(settingsMap['fallback_threshold'] || '0.3'))
      const messageLower = message.toLowerCase()
      const shouldHandoffImmediately = handoffKeywords.some(kw =>
        messageLower.includes(kw.toLowerCase())
      )

      if (shouldHandoffImmediately) {
        if (conversation_id) {
          await supabase
            .from('chatbot_conversations')
            .upsert({
              conversation_id,
              session_id,
              handoff_requested: true,
              is_bot_active: false,
              updated_at: new Date().toISOString()
            }, { onConflict: 'conversation_id' })
        }

        return NextResponse.json({
          message: "I'll connect you with a customer service agent right away. Please hold on while I transfer you...",
          type: 'text',
          shouldHandoff: true,
          intent: 'contact_human',
          confidence: 1.0,
          botName,
          typingDelay
        })
      }

      // Try to match intent using the database function
      const { data: intentMatch, error: matchError } = await supabase
        .rpc('match_chatbot_intent', { p_message: message })

      if (matchError || !intentMatch || intentMatch.length === 0) {
        const { data: faqResults } = await supabase
          .rpc('search_chatbot_faqs', { p_query: message, p_limit: 3 })

        if (faqResults && faqResults.length > 0 && faqResults[0].relevance >= 0.5) {
          const topFaq = faqResults[0]
          await supabase
            .from('chatbot_faqs')
            .update({ view_count: topFaq.view_count + 1 })
            .eq('id', topFaq.id)

          response = {
            message: topFaq.answer,
            type: 'quick_reply',
            quickReplies: [
              { text: 'This helped!', value: 'thanks' },
              { text: 'I need more help', value: 'contact_human' }
            ],
            intent: 'faq_match',
            confidence: topFaq.relevance
          }
        } else {
          response = {
            message: "I'm not sure I understood that. Could you try rephrasing, or would you like to speak with a customer service agent?",
            type: 'quick_reply',
            quickReplies: [
              { text: 'Talk to agent', value: 'contact_human' },
              { text: 'Show main menu', value: 'greeting' }
            ],
            intent: 'fallback',
            confidence: 0
          }
        }
      } else {
        const match = intentMatch[0]

        if (match.confidence < fallbackThreshold) {
          response = {
            message: "I'm not quite sure what you're asking. Let me show you some options:",
            type: 'quick_reply',
            quickReplies: [
              { text: 'Track my order', value: 'track_order' },
              { text: 'Delivery info', value: 'delivery_info' },
              { text: 'Talk to agent', value: 'contact_human' }
            ],
            intent: 'low_confidence',
            confidence: match.confidence
          }
        } else {
          let shouldHandoff = false
          let processedMessage = match.response_text

          if (match.intent_name === 'contact_human' || match.intent_name === 'complaint') {
            shouldHandoff = true
          }

          let quickReplies = match.quick_replies || []
          if (typeof quickReplies === 'string') {
            try {
              quickReplies = JSON.parse(quickReplies)
            } catch {
              quickReplies = []
            }
          }

          response = {
            message: processedMessage,
            type: match.response_type || 'text',
            quickReplies: quickReplies,
            cardData: match.card_data || {},
            shouldHandoff,
            intent: match.intent_name,
            confidence: match.confidence
          }
        }
      }
    }

    // Store/update conversation context
    if (conversation_id || session_id) {
      await supabase
        .from('chatbot_conversations')
        .upsert({
          conversation_id: conversation_id || null,
          session_id: session_id || null,
          current_intent: response.intent,
          context: { ...context, lastMessage: message },
          is_bot_active: !response.shouldHandoff,
          handoff_requested: response.shouldHandoff || false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'conversation_id' })
    }

    // Save bot message to chat_messages if conversation exists
    if (conversation_id) {
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id,
          sender_type: 'bot',
          sender_name: botName,
          content: response.message,
          message_type: response.type === 'quick_reply' ? 'quick_reply' : 'text',
          metadata: {
            intent: response.intent,
            confidence: response.confidence,
            quickReplies: response.quickReplies
          }
        })

      // If handoff requested, add system message
      if (response.shouldHandoff) {
        await supabase
          .from('chat_messages')
          .insert({
            conversation_id,
            sender_type: 'system',
            content: 'Customer requested to speak with an agent. Transferring to available agent...'
          })

        // Update conversation status
        await supabase
          .from('chat_conversations')
          .update({
            status: 'waiting',
            unread_agent: 1
          })
          .eq('id', conversation_id)
      }
    }

    return NextResponse.json({
      ...response,
      botName,
      typingDelay
    })
  } catch (error) {
    console.error('Chatbot error:', error)
    return NextResponse.json({
      error: 'Failed to process message',
      message: "I'm having trouble right now. Let me connect you with a human agent.",
      type: 'text',
      shouldHandoff: true
    }, { status: 500 })
  }
}

// Get chatbot status and settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const sessionId = searchParams.get('session_id')

    // Get settings
    const { data: settings } = await supabase
      .from('chatbot_settings')
      .select('setting_key, setting_value')

    const settingsMap = settings?.reduce((acc, s) => {
      acc[s.setting_key] = s.setting_value
      return acc
    }, {} as Record<string, unknown>) || {}

    // Get conversation context if exists
    let conversationContext = null
    if (conversationId || sessionId) {
      const query = supabase
        .from('chatbot_conversations')
        .select('*')

      if (conversationId) {
        query.eq('conversation_id', conversationId)
      } else if (sessionId) {
        query.eq('session_id', sessionId)
      }

      const { data } = await query.single()
      conversationContext = data
    }

    // Get suggested FAQs
    const { data: faqs } = await supabase
      .from('chatbot_faqs')
      .select('id, question, category')
      .eq('is_active', true)
      .order('view_count', { ascending: false })
      .limit(5)

    return NextResponse.json({
      isEnabled: settingsMap['is_enabled'] === true || settingsMap['is_enabled'] === 'true',
      botName: settingsMap['bot_name'] || 'FreshBot',
      welcomeMessage: settingsMap['welcome_message'] || "Hi! I'm FreshBot, your virtual assistant. How can I help you today?",
      botAvatar: settingsMap['bot_avatar'] || '/images/bot-avatar.png',
      typingDelay: parseInt(String(settingsMap['typing_delay_ms'] || '1000')),
      conversationContext,
      suggestedFaqs: faqs || []
    })
  } catch (error) {
    console.error('Get chatbot status error:', error)
    return NextResponse.json({ error: 'Failed to get chatbot status' }, { status: 500 })
  }
}
