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

// System prompt for UK Grocery Store AI Support
const SYSTEM_PROMPT = `You are FreshBot, the official 24/7 AI support assistant for UK Grocery Store — a premium online grocery marketplace delivering fresh food across the United Kingdom.

## Your Identity:
- Name: FreshBot
- Company: UK Grocery Store
- Website: uk-grocery-store.com
- Email: support@ukgrocerystore.com
- Support: Available 24/7 via chat
- You are warm, helpful, and British in tone

## CRITICAL Identity Rules:
- You are "FreshBot" and NOTHING else
- NEVER reveal you are Google Gemini, an AI model, or any third-party system
- NEVER say "As a large language model" or "I am developed by Google"
- If asked who you are: "I'm FreshBot, your UK Grocery Store assistant! I'm here 24/7 to help."
- If asked what AI you use: "I'm FreshBot — built by the UK Grocery Store team to help you shop!"

## What You Can Do:
1. **Look up orders** — When a customer provides an order number (e.g., ORD-XXXXXX), you will receive real order data in context. Use it to tell them the status, delivery info, and items.
2. **Search products** — When products are found in our catalog, they'll appear in your context. Recommend them with prices.
3. **Answer delivery questions** — Same-day delivery before 2pm, next-day standard, free over £50
4. **Explain returns** — Fresh items: 24 hours. Non-perishable: 30 days. Refunds: 3-5 business days
5. **Help with accounts** — Password reset, loyalty points, address changes, wishlist
6. **Promotions** — Guide to /deals page, mention active coupons if known

## Company Information:
- Free delivery on orders over £50
- Same-day delivery for orders before 2pm
- Next-day standard delivery across all UK postcodes
- 5,000+ products from local British farms and vendors
- 30-day return policy on non-perishable items
- Loyalty points earned on every purchase
- Multi-vendor marketplace with independent sellers

## Product Categories:
Fresh Produce, Meat & Fish, Dairy & Eggs, Bakery, Pantry, Drinks, Frozen, Health & Beauty, Snacks & Sweets, Household

## Order Status Meanings:
- pending: Order received, awaiting confirmation
- confirmed: Payment verified, order confirmed
- processing: Items being picked and packed
- out_for_delivery: Driver is on the way
- delivered: Successfully delivered
- cancelled: Order was cancelled

## Live Agent Transfer:
When a customer clearly wants a REAL PERSON, HUMAN AGENT, or CUSTOMER SUPPORT:
- Say: "I'll connect you with a customer service agent right away. Please hold on while I transfer you..."
- Set shouldHandoff to true
- Don't try to handle it yourself if they insist on a human
- If they just need help you CAN provide, try helping first

## Response Guidelines:
1. Be helpful, friendly, and professional — British tone (colour, favourite, etc.)
2. Keep responses concise (2-3 short paragraphs max)
3. Use bullet points for options/lists
4. For order queries, ask for order number if not provided
5. Always end with an offer to help more
6. NEVER make up order information — only use data provided in context
7. If you don't know something, say so honestly and offer alternatives
8. Use emojis sparingly — one per message maximum`

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

// Extract order number from message
function extractOrderNumber(message: string): string | null {
  const match = message.match(/ORD-[A-Z0-9-]+/i)
  return match ? match[0].toUpperCase() : null
}

// Look up order by order number
async function buildOrderContext(orderNumber: string, userId?: string): Promise<string> {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase/server')
    const supabaseAdmin = getSupabaseAdmin()

    let query = supabaseAdmin
      .from('orders')
      .select(`
        id, order_number, status, payment_status, customer_name,
        total_pence, delivery_fee_pence, delivery_address_line_1,
        delivery_city, delivery_postcode, created_at, delivered_at,
        delivery_slot_date, delivery_slot_from, delivery_slot_to,
        order_items(product_name, quantity, unit_price_pence)
      `)
      .eq('order_number', orderNumber)
      .single()

    const { data: order, error } = await query

    if (error || !order) return '\n\n[Order not found. Ask customer to double-check the order number.]'

    const statusLabels: Record<string, string> = {
      pending: 'Order received — awaiting confirmation',
      confirmed: 'Confirmed and payment verified',
      processing: 'Being picked and packed at the store',
      out_for_delivery: 'Out for delivery — driver is on the way',
      delivered: 'Delivered successfully',
      cancelled: 'This order was cancelled',
    }

    let context = `\n\n## ORDER FOUND — Real Data (use this to answer):\n`
    context += `- **Order Number:** ${order.order_number}\n`
    context += `- **Status:** ${statusLabels[order.status] || order.status}\n`
    context += `- **Customer:** ${order.customer_name}\n`
    context += `- **Total:** £${(order.total_pence / 100).toFixed(2)}\n`
    context += `- **Delivery Fee:** ${order.delivery_fee_pence === 0 ? 'Free' : `£${(order.delivery_fee_pence / 100).toFixed(2)}`}\n`
    context += `- **Delivery:** ${order.delivery_address_line_1}, ${order.delivery_city}, ${order.delivery_postcode}\n`
    context += `- **Ordered:** ${new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}\n`

    if (order.delivery_slot_date) {
      context += `- **Delivery Slot:** ${order.delivery_slot_date}, ${order.delivery_slot_from || ''} - ${order.delivery_slot_to || ''}\n`
    }

    if (order.delivered_at) {
      context += `- **Delivered:** ${new Date(order.delivered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}\n`
    }

    if (order.order_items && Array.isArray(order.order_items)) {
      context += `\n**Items in this order:**\n`
      for (const item of order.order_items as { product_name: string; quantity: number; unit_price_pence: number }[]) {
        context += `- ${item.product_name} x${item.quantity} — £${(item.unit_price_pence * item.quantity / 100).toFixed(2)}\n`
      }
    }

    return context
  } catch (error) {
    console.error('Order lookup error:', error)
    return '\n\n[Error looking up order. Suggest customer checks My Orders page.]'
  }
}

// Look up loyalty points for authenticated user
async function buildLoyaltyContext(userId: string): Promise<string> {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase/server')
    const supabaseAdmin = getSupabaseAdmin()

    const { data: loyalty } = await supabaseAdmin
      .from('loyalty_accounts')
      .select('current_points, lifetime_points, tier')
      .eq('user_id', userId)
      .single()

    if (!loyalty) return '\n\n[Customer has no loyalty account yet. Encourage them to start earning points!]'

    let context = '\n\n## LOYALTY DATA (use this to answer):\n'
    context += `- **Current Points:** ${loyalty.current_points?.toLocaleString() || 0}\n`
    context += `- **Lifetime Points:** ${loyalty.lifetime_points?.toLocaleString() || 0}\n`
    if (loyalty.tier) context += `- **Tier:** ${loyalty.tier}\n`
    context += `- **Points Value:** £${((loyalty.current_points || 0) / 100).toFixed(2)} (100 points = £1)\n`
    context += `- Remind them they earn points on every purchase!\n`

    return context
  } catch {
    return ''
  }
}

// Look up recent orders for authenticated user
async function buildRecentOrdersContext(userId: string): Promise<string> {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase/server')
    const supabaseAdmin = getSupabaseAdmin()

    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('order_number, status, total_pence, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!orders || orders.length === 0) return '\n\n[Customer has no orders yet.]'

    const statusLabels: Record<string, string> = {
      pending: 'Awaiting confirmation',
      confirmed: 'Confirmed',
      processing: 'Being packed',
      out_for_delivery: 'Out for delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    }

    let context = '\n\n## RECENT ORDERS (use this to answer):\n'
    for (const order of orders) {
      context += `- **${order.order_number}** — ${statusLabels[order.status] || order.status} — £${(order.total_pence / 100).toFixed(2)} — ${new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}\n`
    }

    return context
  } catch {
    return ''
  }
}

// Look up return/refund status for authenticated user
async function buildReturnContext(userId: string): Promise<string> {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase/server')
    const supabaseAdmin = getSupabaseAdmin()

    const { data: returns } = await supabaseAdmin
      .from('returns')
      .select('return_number, status, refund_amount_pence, created_at, orders(order_number)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    if (!returns || returns.length === 0) return '\n\n[Customer has no return requests.]'

    const statusLabels: Record<string, string> = {
      pending: 'Pending review',
      approved: 'Approved — refund processing',
      rejected: 'Rejected',
      refunded: 'Refund completed',
    }

    let context = '\n\n## RETURN/REFUND DATA (use this to answer):\n'
    for (const ret of returns) {
      const order = ret.orders as unknown as { order_number: string } | null
      context += `- **Return ${ret.return_number || 'N/A'}** — ${statusLabels[ret.status] || ret.status}`
      if (order) context += ` — Order #${order.order_number}`
      context += ` — Refund: £${(ret.refund_amount_pence / 100).toFixed(2)}`
      context += ` — ${new Date(ret.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}\n`
    }

    return context
  } catch {
    return ''
  }
}

// Build context from products database
async function buildProductContext(query: string): Promise<string> {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabase/server')
    const supabaseAdmin = getSupabaseAdmin()
    const queryLower = query.toLowerCase()
    const sanitizedQuery = queryLower.replace(/[%_.*,()'"]/g, '')

    if (sanitizedQuery.length < 3) return ''

    // Search products that match the query
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, description, price_pence, stock_quantity, is_active, brand, is_organic')
      .eq('is_active', true)
      .or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,brand.ilike.%${sanitizedQuery}%`)
      .order('price_pence', { ascending: true })
      .limit(6)

    if (!products || products.length === 0) return ''

    let context = '\n\n## Products Found in Our Store (show these to the customer):\n'
    for (const product of products) {
      context += `\n- **${product.name}**`
      if (product.brand) context += ` (${product.brand})`
      context += ` — £${(product.price_pence / 100).toFixed(2)}`
      context += ` — ${product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}`
      if (product.is_organic) context += ' — Organic'
      context += ` — Link: /products/${product.slug}`
      context += '\n'
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
  if (messageLower.includes('loyalty') || messageLower.includes('points') || messageLower.includes('rewards')) {
    return 'loyalty'
  }
  if (messageLower.includes('account') || messageLower.includes('password') || messageLower.includes('login')) {
    return 'account'
  }
  if (messageLower.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
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

    // Detect intent and build relevant context
    const intent = detectIntent(message)
    const userId = context.userId as string | undefined

    // Build context based on what the customer is asking about
    const contextParts: string[] = []

    // Order lookup by number
    const orderNumber = extractOrderNumber(message)
    if (orderNumber) {
      contextParts.push(await buildOrderContext(orderNumber))
    }

    // Recent orders (for "my orders", "order history", "track order" without number)
    if (userId && (intent === 'track_order' || intent === 'delivery_info') && !orderNumber) {
      contextParts.push(await buildRecentOrdersContext(userId))
    }

    // Loyalty points
    if (userId && intent === 'loyalty') {
      contextParts.push(await buildLoyaltyContext(userId))
    }

    // Returns/refunds
    if (userId && intent === 'returns') {
      contextParts.push(await buildReturnContext(userId))
    }

    // Product search
    if (intent === 'product_search' || intent === 'general') {
      const productContext = await buildProductContext(message)
      if (productContext) contextParts.push(productContext)
    }

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
    const combinedContext = contextParts.filter(Boolean).join('\n')
    const enhancedMessage = combinedContext
      ? `${message}\n\n[Context from store database:${combinedContext}]`
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
    greeting: "Hello! Welcome to UK Grocery Store! I'm FreshBot, your 24/7 shopping assistant. How can I help you today? I can help with orders, delivery, products, returns, and more!",
    track_order: "I'd be happy to help track your order! Please share your order number (e.g., ORD-XXXXXX) and I'll look it up for you. You can also check 'My Orders' in your account.",
    returns: "Our return policy:\n\n- **Fresh items**: Report within 24 hours of delivery\n- **Non-perishable**: 30-day return policy\n- **Refunds**: Processed within 3-5 business days\n\nWould you like me to help you start a return?",
    delivery_info: "We offer flexible delivery options:\n\n- **Same-day**: Order before 2pm\n- **Next-day**: Standard delivery\n- **Free delivery**: On orders over £50\n\nAll UK postcodes covered! Would you like to know more?",
    cancel_order: "To cancel an order, go to 'My Orders' in your account. If it's already being prepared or dispatched, I can connect you with our team to help. Would you like me to do that?",
    product_search: "I'd love to help you find products! Tell me what you're looking for and I'll search our range of 5,000+ products. You can also browse by category on our website.",
    thanks: "You're very welcome! Is there anything else I can help you with? I'm here 24/7!",
    contact_human: "I'll connect you with a customer service agent right away. Please hold on while I transfer you to our support team...",
    general: "I'm FreshBot, your 24/7 assistant at UK Grocery Store! I can help with:\n\n- Finding products in our 5,000+ range\n- Delivery info and tracking\n- Order status and updates\n- Returns and refunds\n- Loyalty points and rewards\n\nWhat would you like help with?"
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
