import { logger } from "@/lib/utils/logger"

type ModelTier = "fast" | "balanced" | "powerful"

interface ModelConfig {
  id: string
  provider: "anthropic" | "openai" | "deepseek"
  tier: ModelTier
  costPer1kTokens: number
  maxTokens: number
  contextWindow: number
  supportsStreaming: boolean
  supportsVision: boolean
}

const MODELS: Record<string, ModelConfig> = {
  "deepseek-v3": {
    id: "deepseek-v3",
    provider: "deepseek",
    tier: "fast",
    costPer1kTokens: 0.1,
    maxTokens: 8192,
    contextWindow: 64000,
    supportsStreaming: true,
    supportsVision: false,
  },
  "claude-sonnet": {
    id: "claude-sonnet-4-20250514",
    provider: "anthropic",
    tier: "balanced",
    costPer1kTokens: 3,
    maxTokens: 8192,
    contextWindow: 200000,
    supportsStreaming: true,
    supportsVision: true,
  },
  "claude-opus": {
    id: "claude-opus-4-20250514",
    provider: "anthropic",
    tier: "powerful",
    costPer1kTokens: 15,
    maxTokens: 4096,
    contextWindow: 200000,
    supportsStreaming: true,
    supportsVision: true,
  },
}

interface RoutingRequest {
  task: string
  complexity: "low" | "medium" | "high"
  requiresVision?: boolean
  maxBudgetCents?: number
  preferredModel?: string
}

export function selectModel(req: RoutingRequest): ModelConfig {
  if (req.preferredModel && MODELS[req.preferredModel]) {
    return MODELS[req.preferredModel]
  }

  if (req.requiresVision) {
    return MODELS["claude-sonnet"]
  }

  switch (req.complexity) {
    case "low":
      return MODELS["deepseek-v3"]
    case "medium":
      return MODELS["claude-sonnet"]
    case "high":
      return MODELS["claude-opus"]
  }
}

export function estimateComplexity(prompt: string): "low" | "medium" | "high" {
  const wordCount = prompt.split(/\s+/).length
  const hasCode = /```|function|class|import|const|let/.test(prompt)
  const hasAnalysis = /analyze|compare|evaluate|review|design|architect/.test(prompt.toLowerCase())
  const hasSimple = /translate|summarize|rewrite|list|define/.test(prompt.toLowerCase())

  if (hasSimple && wordCount < 200) return "low"
  if (hasAnalysis || hasCode || wordCount > 1000) return "high"
  return "medium"
}

export { MODELS, type ModelConfig, type RoutingRequest }
