# AI / LLM Integration Patterns

> For CEREBRTRON and any project using AI. Covers multi-model routing,
> streaming, prompt management, cost control, and structured outputs.

---

## 1. MODEL ROUTER (The Penta Brain Pattern)

Route tasks to the best model automatically. Simple questions go to
cheap/fast models. Complex tasks go to powerful models. Save money
without sacrificing quality.

```typescript
// src/lib/ai/model-router.ts

type ModelTier = "fast" | "balanced" | "powerful"

interface ModelConfig {
  id: string                    // "deepseek-v3", "claude-sonnet", "gpt-4o"
  provider: "anthropic" | "openai" | "deepseek" | "local"
  tier: ModelTier
  costPer1kTokens: number      // In cents
  maxTokens: number
  contextWindow: number
  supportsStreaming: boolean
  supportsVision: boolean
}

const MODELS: Record<string, ModelConfig> = {
  "deepseek-v3": {
    id: "deepseek-v3", provider: "deepseek", tier: "fast",
    costPer1kTokens: 0.1, maxTokens: 8192, contextWindow: 64000,
    supportsStreaming: true, supportsVision: false,
  },
  "claude-sonnet": {
    id: "claude-sonnet-4-20250514", provider: "anthropic", tier: "balanced",
    costPer1kTokens: 3, maxTokens: 8192, contextWindow: 200000,
    supportsStreaming: true, supportsVision: true,
  },
  "claude-opus": {
    id: "claude-opus-4-20250514", provider: "anthropic", tier: "powerful",
    costPer1kTokens: 15, maxTokens: 4096, contextWindow: 200000,
    supportsStreaming: true, supportsVision: true,
  },
}

interface RoutingRequest {
  task: string                  // "summarize", "code", "analyze", "chat", "generate"
  complexity: "low" | "medium" | "high"
  requiresVision?: boolean
  maxBudgetCents?: number       // Cost limit for this request
  preferredModel?: string       // User can override
}

export function selectModel(req: RoutingRequest): ModelConfig {
  // User override
  if (req.preferredModel && MODELS[req.preferredModel]) {
    return MODELS[req.preferredModel]
  }

  // Vision required
  if (req.requiresVision) {
    return MODELS["claude-sonnet"]
  }

  // Route by complexity
  switch (req.complexity) {
    case "low": return MODELS["deepseek-v3"]        // Fast and cheap
    case "medium": return MODELS["claude-sonnet"]    // Best balance
    case "high": return MODELS["claude-opus"]        // Maximum intelligence
  }
}

// Auto-detect complexity from the prompt
export function estimateComplexity(prompt: string): "low" | "medium" | "high" {
  const wordCount = prompt.split(/\s+/).length
  const hasCode = /```|function|class|import|const|let/.test(prompt)
  const hasAnalysis = /analyze|compare|evaluate|review|design|architect/.test(prompt.toLowerCase())
  const hasSimple = /translate|summarize|rewrite|list|define/.test(prompt.toLowerCase())

  if (hasSimple && wordCount < 200) return "low"
  if (hasAnalysis || hasCode || wordCount > 1000) return "high"
  return "medium"
}
```

## 2. STREAMING RESPONSE HANDLER

Stream AI responses word-by-word to the user instead of waiting for
the full response. Users see output immediately.

```typescript
// src/lib/ai/stream.ts

export async function streamCompletion(params: {
  model: ModelConfig
  messages: { role: "user" | "assistant" | "system"; content: string }[]
  onToken: (token: string) => void
  onComplete: (fullResponse: string, usage: TokenUsage) => void
  onError: (error: Error) => void
  signal?: AbortSignal               // Allow cancellation
}): Promise<void> {
  const { model, messages, onToken, onComplete, onError, signal } = params
  let fullResponse = ""

  try {
    const response = await fetch(getProviderUrl(model.provider), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getApiKey(model.provider)}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages,
        stream: true,
        max_tokens: model.maxTokens,
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "))

      for (const line of lines) {
        const data = line.slice(6) // Remove "data: "
        if (data === "[DONE]") continue

        try {
          const parsed = JSON.parse(data)
          const token = extractToken(parsed, model.provider)
          if (token) {
            fullResponse += token
            onToken(token)
          }
        } catch {
          // Skip unparseable chunks
        }
      }
    }

    const usage = estimateTokenUsage(messages, fullResponse)
    onComplete(fullResponse, usage)
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      onComplete(fullResponse, estimateTokenUsage(messages, fullResponse))
      return
    }
    onError(error instanceof Error ? error : new Error("Stream failed"))
  }
}

// API route for streaming to frontend:
// src/app/api/v1/ai/chat/route.ts
export async function POST(request: NextRequest) {
  const { messages, task } = await request.json()
  const complexity = estimateComplexity(messages[messages.length - 1].content)
  const model = selectModel({ task, complexity })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      await streamCompletion({
        model,
        messages,
        onToken: (token) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
        },
        onComplete: (fullResponse, usage) => {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ done: true, usage })}\n\n`
          ))
          controller.close()
          // Track cost
          trackAICost(model, usage)
        },
        onError: (error) => {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ error: error.message })}\n\n`
          ))
          controller.close()
        },
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
```

## 3. PROMPT MANAGEMENT

Store prompts as versioned templates, not hardcoded strings. Test them,
improve them, roll them back — without changing code.

```typescript
// src/lib/ai/prompts.ts

interface PromptTemplate {
  id: string
  version: number
  system: string
  user: string                   // Template with {{variables}}
  model: string                  // Which model this is tuned for
  temperature: number
  maxTokens: number
  description: string
}

const PROMPTS: Record<string, PromptTemplate> = {
  "product-description": {
    id: "product-description",
    version: 3,
    system: `You are a product copywriter for an online grocery store.
Write compelling, accurate product descriptions. Be concise.
Focus on freshness, quality, and value.`,
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

  "code-review": {
    id: "code-review",
    version: 2,
    system: `You are a senior engineer at Solaris Empire Inc.
Review code through all 12 lenses: security, performance, reliability,
code quality, type safety, testing, database, API design, frontend,
devops, documentation, and business logic.`,
    user: `Review this code:\n\n{{code}}\n\nContext: {{context}}`,
    model: "claude-opus",
    temperature: 0,
    maxTokens: 4096,
    description: "Enterprise code review",
  },

  "website-generator": {
    id: "website-generator",
    version: 1,
    system: `You are an expert web developer. Generate complete,
production-ready HTML/CSS/JS for websites.`,
    user: `Generate a website for: {{description}}
Style: {{style}}
Sections: {{sections}}`,
    model: "claude-sonnet",
    temperature: 0.5,
    maxTokens: 8192,
    description: "AI website generator for Webcrafts",
  },
}

// Render a template with variables
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

  // Check for unreplaced variables
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
```

## 4. AI COST TRACKING

Track every API call, every token, every cent. Know exactly how much
AI costs per user, per feature, per day.

```typescript
// src/lib/ai/cost-tracker.ts

interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

interface AICostEntry {
  model: string
  provider: string
  promptId?: string
  userId?: string
  inputTokens: number
  outputTokens: number
  costCents: number
  durationMs: number
  timestamp: string
}

export async function trackAICost(
  model: ModelConfig,
  usage: TokenUsage,
  metadata?: { promptId?: string; userId?: string; durationMs?: number }
): Promise<void> {
  const costCents =
    (usage.inputTokens / 1000) * model.costPer1kTokens +
    (usage.outputTokens / 1000) * model.costPer1kTokens * 3 // Output typically 3x input cost

  const entry: AICostEntry = {
    model: model.id,
    provider: model.provider,
    promptId: metadata?.promptId,
    userId: metadata?.userId,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costCents: Math.round(costCents * 100) / 100,
    durationMs: metadata?.durationMs || 0,
    timestamp: new Date().toISOString(),
  }

  // Store in database
  await supabase.from("ai_usage_logs").insert(entry)

  // Log for monitoring
  logger.info("AI usage tracked", entry)

  // Alert if cost is unusually high
  if (costCents > 50) { // More than $0.50 for a single call
    logger.warn("High AI cost detected", entry)
  }
}

// Budget enforcement per user per day
export async function checkAIBudget(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0]
  const { data } = await supabase
    .from("ai_usage_logs")
    .select("cost_cents")
    .eq("user_id", userId)
    .gte("timestamp", `${today}T00:00:00Z`)

  const todayCost = (data || []).reduce((sum, row) => sum + row.cost_cents, 0)
  const dailyBudgetCents = 500 // $5.00 per user per day

  return todayCost < dailyBudgetCents
}
```

## 5. MODEL FALLBACK CHAIN

If the primary model fails, automatically try the next model in line.
User never sees an error — they just get a response from a different model.

```typescript
// src/lib/ai/fallback.ts

export async function completeWithFallback(params: {
  messages: { role: string; content: string }[]
  models: ModelConfig[]          // Ordered: try first, fallback to second, etc.
  maxRetries?: number
}): Promise<Result<{ response: string; model: string; usage: TokenUsage }>> {
  for (const model of params.models) {
    try {
      const response = await callModel(model, params.messages)
      return ok({
        response: response.text,
        model: model.id,
        usage: response.usage,
      })
    } catch (error) {
      logger.warn(`Model ${model.id} failed, trying next`, {
        error: error instanceof Error ? error.message : "Unknown",
        nextModel: params.models[params.models.indexOf(model) + 1]?.id || "none",
      })
      continue
    }
  }

  return fail("All AI models failed", "AI_UNAVAILABLE")
}

// Usage:
const result = await completeWithFallback({
  messages: [{ role: "user", content: "Describe this product..." }],
  models: [
    MODELS["deepseek-v3"],       // Try cheap model first
    MODELS["claude-sonnet"],     // Fallback to Anthropic
    MODELS["claude-opus"],       // Last resort: most powerful
  ],
})
```
