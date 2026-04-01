import { getSupabaseAdmin } from "@/lib/supabase/server"
import { logger } from "@/lib/utils/logger"
import type { ModelConfig } from "./model-router"

interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

interface AICostEntry {
  model: string
  provider: string
  prompt_id?: string
  user_id?: string
  input_tokens: number
  output_tokens: number
  cost_cents: number
  duration_ms: number
  created_at: string
}

export async function trackAICost(
  model: ModelConfig,
  usage: TokenUsage,
  metadata?: { promptId?: string; userId?: string; durationMs?: number }
): Promise<void> {
  const costCents =
    (usage.inputTokens / 1000) * model.costPer1kTokens +
    (usage.outputTokens / 1000) * model.costPer1kTokens * 3

  const entry: AICostEntry = {
    model: model.id,
    provider: model.provider,
    prompt_id: metadata?.promptId,
    user_id: metadata?.userId,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost_cents: Math.round(costCents * 100) / 100,
    duration_ms: metadata?.durationMs || 0,
    created_at: new Date().toISOString(),
  }

  await getSupabaseAdmin().from("ai_usage_logs").insert(entry)

  logger.info("AI usage tracked", {
    model: model.id,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costCents: entry.cost_cents,
  })

  if (costCents > 50) {
    logger.warn("High AI cost detected", entry)
  }
}

export async function checkAIBudget(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0]
  const { data } = await getSupabaseAdmin()
    .from("ai_usage_logs")
    .select("cost_cents")
    .eq("user_id", userId)
    .gte("created_at", `${today}T00:00:00Z`)

  const todayCost = (data || []).reduce((sum, row) => sum + row.cost_cents, 0)
  const dailyBudgetCents = 500 // £5.00 per user per day

  return todayCost < dailyBudgetCents
}

export type { TokenUsage, AICostEntry }
