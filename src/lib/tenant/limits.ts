import { supabaseAdmin } from "@/lib/supabase/admin"
import { AppError } from "@/lib/utils/errors"
import { getTenant } from "./tenant-context"

const PLAN_LIMITS = {
  free: { maxProducts: 10, maxStorageMB: 100, maxApiCalls: 1000 },
  starter: { maxProducts: 100, maxStorageMB: 1000, maxApiCalls: 10000 },
  pro: { maxProducts: 1000, maxStorageMB: 10000, maxApiCalls: 100000 },
  enterprise: { maxProducts: -1, maxStorageMB: -1, maxApiCalls: -1 },
} as const

type PlanName = keyof typeof PLAN_LIMITS

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanName] || PLAN_LIMITS.free
}

export async function enforceLimit(
  resource: "products" | "storage" | "apiCalls"
): Promise<void> {
  const tenant = getTenant()
  const limits = getPlanLimits(tenant.tenantPlan)

  if (resource === "products") {
    if (limits.maxProducts === -1) return
    const { count } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", tenant.tenantId)
      .is("deleted_at", null)

    if ((count || 0) >= limits.maxProducts) {
      throw new AppError(
        `Product limit reached (${limits.maxProducts}). Upgrade your plan.`,
        403,
        "LIMIT_EXCEEDED"
      )
    }
  }

  if (resource === "storage") {
    if (limits.maxStorageMB === -1) return
    // Storage limit check would query file storage usage
  }

  if (resource === "apiCalls") {
    if (limits.maxApiCalls === -1) return
    // API call limit check would query daily API call count
  }
}

export { PLAN_LIMITS, type PlanName }
