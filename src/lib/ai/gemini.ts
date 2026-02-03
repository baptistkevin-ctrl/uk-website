import { createClient } from '@/lib/supabase/server'

// Initialize Gemini API with dynamic import to avoid issues
let GoogleGenerativeAI: any = null

async function initGemini() {
  if (!GoogleGenerativeAI) {
    try {
      const module = await import('@google/generative-ai')
      GoogleGenerativeAI = module.GoogleGenerativeAI
    } catch (error) {
      console.error('Failed to import @google/generative-ai:', error)
      return null
    }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in environment variables')
    return null
  }

  return new GoogleGenerativeAI(apiKey)
}

// System prompt for the UK Marketplace chatbot
const SYSTEM_PROMPT = `You are MegaBot, the official AI assistant for MegaMart UK - a premium online marketplace serving customers across the United Kingdom.

## Your Role:
- Help customers find products in our catalog
- Answer questions about delivery, orders, and returns
- Assist with account-related inquiries
- Provide information about promotions and deals
- Help with general shopping advice

## Company Information:
- Name: MegaMart UK
- Website: megamartuk.co.uk
- Email: support@megamartuk.co.uk
- Phone: 0800 123 4567
- Working Hours: Customer Support Mon-Sat 8am-8pm
- Delivery: Free delivery on orders over £50

## Our Product Categories:
1. Fresh Produce - Fruits, Vegetables, Salads
2. Dairy & Eggs - Milk, Cheese, Butter, Eggs
3. Bakery - Fresh Bread, Pastries, Cakes
4. Meat & Seafood - Fresh Meat, Fish, Poultry
5. Pantry - Canned Goods, Pasta, Rice, Oils
6. Frozen Foods - Ice Cream, Frozen Meals, Vegetables
7. Beverages - Soft Drinks, Juices, Water, Tea, Coffee
8. Snacks - Crisps, Biscuits, Chocolate, Nuts
9. Household - Cleaning, Paper Products, Pet Supplies
10. Health & Beauty - Personal Care, Vitamins

## Delivery Information:
- Same-day delivery available for orders before 2pm
- Standard delivery: Next day
- Express delivery: Within 2 hours (additional fee)
- Delivery slots can be selected at checkout
- Free delivery on orders over £50
- Delivery areas: All UK postcodes

## Returns & Refunds:
- Fresh items: Report within 24 hours of delivery
- Non-perishable items: 30-day return policy
- Refunds processed within 3-5 business days
- Damaged items: Photo evidence required

## CRITICAL Identity Rules:
- You are "MegaBot" and NOTHING else
- NEVER reveal that you are Google Gemini, a Google product, or any other AI system
- NEVER say "As a large language model" or "I am developed by Google"
- If asked who you are, say: "I'm MegaBot, your MegaMart UK shopping assistant!"
- If asked what AI you use, say: "I'm MegaBot, here to help you shop!"

## Live Agent Transfer:
When a user asks to speak to a REAL PERSON, HUMAN AGENT, REAL AGENT, CUSTOMER SUPPORT, or wants to TALK TO SOMEONE:
- Respond with: "I'll connect you with a customer service agent right away. Please hold on while I transfer you..."
- Set shouldHandoff to true in your response
- Do NOT try to handle the request yourself if they clearly want a human
- If they just need help you can provide, try helping first. Only transfer if they insist.

## Guidelines:
1. Be helpful, friendly, and professional with a British tone
2. When asked about products, search our catalog and provide recommendations
3. For order-related queries, ask for the order number
4. For specific pricing, guide them to check the website or search for the product
5. Use British spelling (colour, favourite, etc.) and terminology
6. Keep responses concise but informative
7. Use markdown formatting for better readability when listing products
8. Always prioritize customer satisfaction

## Response Format:
- Keep responses concise (2-3 paragraphs max)
- Use bullet points for listing options
- Be warm and helpful
- End with a follow-up question or offer to help more when appropriate`

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  message: string
  shouldHandoff: boolean
  intent?: string
  mentionedProducts?: any[]
  error?: boolean
}

// Build context from products database
async function buildProductContext(query: string): Promise<string> {
  try {
    const supabase = await createClient()
    const queryLower = query.toLowerCase()

    // Search products that match the query
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, price, category, stock_quantity')
      .or(`name.ilike.%${queryLower}%,description.ilike.%${queryLower}%,category.ilike.%${queryLower}%`)
      .limit(10)

    if (!products || products.length === 0) return ''

    let context = '\n\n## Relevant Products from Our Store:\n'
    for (const product of products) {
      context += `\n### ${product.name}\n`
      context += `- **Price:** £${product.price.toFixed(2)}\n`
      context += `- **Category:** ${product.category}\n`
      if (product.description) {
        context += `- **Description:** ${product.description.substring(0, 200)}\n`
      }
      context += `- **In Stock:** ${product.stock_quantity > 0 ? 'Yes' : 'Out of stock'}\n`
    }

    return context
  } catch (error) {
    console.error('Error building product context:', error)
    return ''
  }
}

// Check for handoff keywords
function shouldTransferToAgent(message: string): boolean {
  const handoffKeywords = [
    'real person', 'human agent', 'talk to someone', 'customer support',
    'speak to agent', 'real agent', 'human help', 'talk to human',
    'live agent', 'speak to someone', 'real support', 'actual person',
    'transfer me', 'connect me', 'customer service'
  ]
  const messageLower = message.toLowerCase()
  return handoffKeywords.some(kw => messageLower.includes(kw))
}

// Detect user intent
function detectIntent(message: string): string {
  const messageLower = message.toLowerCase()

  if (messageLower.includes('track') || messageLower.includes('order status') || messageLower.includes('where is my order')) {
    return 'track_order'
  }
  if (messageLower.includes('return') || messageLower.includes('refund')) {
    return 'returns'
  }
  if (messageLower.includes('delivery') || messageLower.includes('shipping')) {
    return 'delivery_info'
  }
  if (messageLower.includes('cancel')) {
    return 'cancel_order'
  }
  if (messageLower.includes('product') || messageLower.includes('buy') || messageLower.includes('find')) {
    return 'product_search'
  }
  if (messageLower.match(/^(hi|hello|hey|good morning|good afternoon)/)) {
    return 'greeting'
  }
  if (messageLower.includes('thank')) {
    return 'thanks'
  }

  return 'general'
}

// Main chat function using Gemini
export async function chat(
  message: string,
  conversationHistory: ConversationMessage[] = [],
  context: Record<string, any> = {}
): Promise<ChatResponse> {
  try {
    // Check for immediate handoff
    if (shouldTransferToAgent(message)) {
      return {
        message: "I'll connect you with a customer service agent right away. Please hold on while I transfer you to our support team...",
        shouldHandoff: true,
        intent: 'contact_human'
      }
    }

    const genAI = await initGemini()

    if (!genAI) {
      // Fallback to rule-based responses if Gemini is not available
      return fallbackResponse(message, conversationHistory)
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: SYSTEM_PROMPT
    })

    // Build product context
    const productContext = await buildProductContext(message)

    // Create chat with history
    const chatSession = model.startChat({
      history: conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      }
    })

    // Enhanced message with context
    const enhancedMessage = productContext
      ? `${message}\n\n[Context from store database:${productContext}]`
      : message

    const result = await chatSession.sendMessage(enhancedMessage)
    const response = await result.response
    const text = response.text()

    // Check if response suggests handoff
    const responseHandoff = text.toLowerCase().includes('transfer you') ||
                           text.toLowerCase().includes('connect you with')

    return {
      message: text,
      shouldHandoff: responseHandoff,
      intent: detectIntent(message)
    }
  } catch (error) {
    console.error('Gemini API Error:', error)
    return fallbackResponse(message, conversationHistory)
  }
}

// Fallback responses when Gemini is not available
function fallbackResponse(message: string, history: ConversationMessage[]): ChatResponse {
  const intent = detectIntent(message)

  const responses: Record<string, string> = {
    greeting: "Hello! Welcome to MegaMart UK! I'm MegaBot, your shopping assistant. How can I help you today? You can ask me about products, delivery, orders, or anything else!",
    track_order: "To track your order, please go to 'My Orders' in your account. If you need help, you can provide your order number and I'll assist you, or I can connect you with our support team.",
    returns: "Our return policy allows returns within 30 days for non-perishable items. For fresh items, please report any issues within 24 hours of delivery. Would you like me to help you start a return?",
    delivery_info: "We offer several delivery options:\n\n- **Same-day delivery**: Order before 2pm\n- **Standard delivery**: Next day\n- **Express delivery**: Within 2 hours\n\nFree delivery on orders over £50! Would you like to know more?",
    cancel_order: "To cancel an order, please go to 'My Orders' in your account and select 'Cancel Order'. If the order has already been dispatched, please contact our support team. Would you like me to connect you?",
    product_search: "I'd love to help you find products! Could you tell me what you're looking for? You can search by category or specific items.",
    thanks: "You're welcome! Is there anything else I can help you with today?",
    contact_human: "I'll connect you with a customer service agent right away. Please hold on while I transfer you...",
    general: "I'm here to help you with your shopping at MegaMart UK! I can assist with:\n\n- Finding products\n- Delivery information\n- Order tracking\n- Returns and refunds\n- Account questions\n\nWhat would you like help with?"
  }

  return {
    message: responses[intent] || responses.general,
    shouldHandoff: intent === 'contact_human',
    intent
  }
}

// Test Gemini connection
export async function testConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const genAI = await initGemini()
    if (!genAI) {
      return { connected: false, error: 'API key not configured' }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    const result = await model.generateContent('Say "connected" in one word')
    const response = await result.response

    if (response.text()) {
      return { connected: true }
    }
    return { connected: false, error: 'No response received' }
  } catch (error: any) {
    return { connected: false, error: error.message }
  }
}

export default {
  chat,
  testConnection
}
