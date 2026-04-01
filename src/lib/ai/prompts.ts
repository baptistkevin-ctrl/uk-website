import { NotFoundError, ValidationError } from "@/lib/utils/errors"

interface PromptTemplate {
  id: string
  version: number
  system: string
  user: string
  model: string
  temperature: number
  maxTokens: number
  description: string
}

const PROMPTS: Record<string, PromptTemplate> = {
  "product-description": {
    id: "product-description",
    version: 3,
    system: `You are a product copywriter for a UK online grocery store.
Write compelling, accurate product descriptions. Be concise.
Focus on freshness, quality, and value. Use British English.`,
    user: `Write a product description for:
Product: {{productName}}
Category: {{category}}
Price: {{price}}
Key features: {{features}}

Write 2-3 sentences. Highlight what makes this product special.`,
    model: "deepseek-v3",
    temperature: 0.7,
    maxTokens: 200,
    description: "Generate grocery product descriptions",
  },

  "order-summary": {
    id: "order-summary",
    version: 1,
    system: `You are a helpful assistant for a UK grocery store.
Summarize order details clearly and concisely. Use British English.`,
    user: `Summarize this order for the customer:
Order #{{orderNumber}}
Items: {{items}}
Total: {{total}}
Delivery: {{deliverySlot}}`,
    model: "deepseek-v3",
    temperature: 0.3,
    maxTokens: 300,
    description: "Generate order summary for customer emails",
  },

  "customer-support": {
    id: "customer-support",
    version: 1,
    system: `You are a customer support assistant for a UK online grocery store.
Be helpful, empathetic, and solution-oriented. Use British English.
You can help with orders, deliveries, returns, and product questions.`,
    user: `Customer query: {{query}}
Order context: {{orderContext}}`,
    model: "claude-sonnet",
    temperature: 0.5,
    maxTokens: 500,
    description: "AI customer support responses",
  },
}

export function renderPrompt(
  promptId: string,
  variables: Record<string, string>
): { system: string; user: string; config: Omit<PromptTemplate, "system" | "user"> } {
  const template = PROMPTS[promptId]
  if (!template) throw new NotFoundError("Prompt template", promptId)

  let userPrompt = template.user
  for (const [key, value] of Object.entries(variables)) {
    userPrompt = userPrompt.replaceAll(`{{${key}}}`, value)
  }

  const missing = userPrompt.match(/\{\{(\w+)\}\}/g)
  if (missing) {
    throw new ValidationError(`Missing prompt variables: ${missing.join(", ")}`)
  }

  return {
    system: template.system,
    user: userPrompt,
    config: {
      id: template.id,
      version: template.version,
      model: template.model,
      temperature: template.temperature,
      maxTokens: template.maxTokens,
      description: template.description,
    },
  }
}

export { PROMPTS, type PromptTemplate }
