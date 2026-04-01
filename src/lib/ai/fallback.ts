import { ok, fail, type Result } from "@/lib/utils/result"
import { logger } from "@/lib/utils/logger"
import type { ModelConfig } from "./model-router"
import type { TokenUsage } from "./cost-tracker"

interface CompletionResult {
  response: string
  model: string
  usage: TokenUsage
}

export async function completeWithFallback(params: {
  messages: { role: string; content: string }[]
  models: ModelConfig[]
}): Promise<Result<CompletionResult>> {
  for (let i = 0; i < params.models.length; i++) {
    const model = params.models[i]
    try {
      const response = await callModel(model, params.messages)
      return ok({
        response: response.text,
        model: model.id,
        usage: response.usage,
      })
    } catch (error) {
      const nextModel = params.models[i + 1]
      logger.warn(`Model ${model.id} failed, trying next`, {
        error: error instanceof Error ? error.message : "Unknown",
        nextModel: nextModel?.id || "none",
      })
      continue
    }
  }

  return fail("All AI models failed", "INTERNAL_ERROR")
}

async function callModel(
  model: ModelConfig,
  messages: { role: string; content: string }[]
): Promise<{ text: string; usage: TokenUsage }> {
  const url = getProviderUrl(model.provider)
  const apiKey = getApiKey(model.provider)

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages,
      max_tokens: model.maxTokens,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Normalize response across providers
  const text = data.choices?.[0]?.message?.content || data.content?.[0]?.text || ""
  const usage: TokenUsage = {
    inputTokens: data.usage?.prompt_tokens || data.usage?.input_tokens || 0,
    outputTokens: data.usage?.completion_tokens || data.usage?.output_tokens || 0,
  }

  return { text, usage }
}

function getProviderUrl(provider: string): string {
  switch (provider) {
    case "anthropic":
      return "https://api.anthropic.com/v1/messages"
    case "openai":
      return "https://api.openai.com/v1/chat/completions"
    case "deepseek":
      return "https://api.deepseek.com/v1/chat/completions"
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

function getApiKey(provider: string): string {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || ""
    case "openai":
      return process.env.OPENAI_API_KEY || ""
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY || ""
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}
