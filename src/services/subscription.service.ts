import { ok, fail, type Result } from "@/lib/utils/result"
import { logger } from "@/lib/utils/logger"
import { getSupabaseAdmin } from "@/lib/supabase/server"

type SubStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "paused"

const SUB_TRANSITIONS: Record<SubStatus, Partial<Record<string, SubStatus>>> = {
  trialing: { ACTIVATE: "active", CANCEL: "canceled", EXPIRE: "incomplete" },
  active: { PAYMENT_FAILED: "past_due", CANCEL: "canceled", PAUSE: "paused" },
  past_due: { PAYMENT_SUCCEEDED: "active", CANCEL: "canceled" },
  canceled: { RESUBSCRIBE: "active" },
  incomplete: { PAYMENT_SUCCEEDED: "active", CANCEL: "canceled" },
  paused: { RESUME: "active", CANCEL: "canceled" },
}

function canTransition(currentStatus: SubStatus, action: string): SubStatus | null {
  return SUB_TRANSITIONS[currentStatus]?.[action] || null
}

const log = logger.child({ context: "subscription" })

export const subscriptionService = {
  async findByUserId(userId: string) {
    const { data } = await getSupabaseAdmin()
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["trialing", "active", "past_due", "paused"])
      .single()
    return data
  },

  async updateStatus(
    subscriptionId: string,
    action: string
  ): Promise<Result<{ status: SubStatus }>> {
    const { data: sub } = await getSupabaseAdmin()
      .from("subscriptions")
      .select("id, status")
      .eq("id", subscriptionId)
      .single()

    if (!sub) return fail("Subscription not found", "NOT_FOUND")

    const newStatus = canTransition(sub.status as SubStatus, action)
    if (!newStatus) {
      return fail(
        `Cannot ${action} subscription in ${sub.status} state`,
        "BAD_REQUEST"
      )
    }

    const { error } = await getSupabaseAdmin()
      .from("subscriptions")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", subscriptionId)

    if (error) return fail("Failed to update subscription", "INTERNAL_ERROR")

    log.info("Subscription status changed", {
      subscriptionId,
      from: sub.status,
      to: newStatus,
      action,
    })

    return ok({ status: newStatus })
  },

  async handlePaymentFailed(stripeSubId: string): Promise<void> {
    const { data: sub } = await getSupabaseAdmin()
      .from("subscriptions")
      .select("id, user_id, status")
      .eq("stripe_subscription_id", stripeSubId)
      .single()

    if (!sub) return

    await getSupabaseAdmin()
      .from("subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("id", sub.id)

    log.info("Payment failed — subscription past due", {
      subscriptionId: sub.id,
      userId: sub.user_id,
    })
  },

  async handlePaymentSucceeded(stripeSubId: string): Promise<void> {
    const { data: sub } = await getSupabaseAdmin()
      .from("subscriptions")
      .select("id, user_id, status")
      .eq("stripe_subscription_id", stripeSubId)
      .single()

    if (!sub) return

    if (sub.status === "past_due" || sub.status === "incomplete") {
      await getSupabaseAdmin()
        .from("subscriptions")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("id", sub.id)

      log.info("Payment succeeded — subscription reactivated", {
        subscriptionId: sub.id,
        userId: sub.user_id,
      })
    }
  },
}

export type { SubStatus }
