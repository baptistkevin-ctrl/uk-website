import { AsyncLocalStorage } from "async_hooks"
import { UnauthorizedError } from "@/lib/utils/errors"

interface TenantContext {
  tenantId: string
  tenantType: "vendor" | "platform"
  tenantPlan: "free" | "starter" | "pro" | "enterprise"
  tenantLimits: {
    maxProducts: number
    maxStorageMB: number
    maxApiCalls: number
  }
}

const tenantStore = new AsyncLocalStorage<TenantContext>()

export function getTenant(): TenantContext {
  const tenant = tenantStore.getStore()
  if (!tenant) {
    throw new UnauthorizedError("No tenant context — are you authenticated?")
  }
  return tenant
}

export function getTenantOrNull(): TenantContext | null {
  return tenantStore.getStore() || null
}

export function runWithTenant<T>(tenant: TenantContext, fn: () => T): T {
  return tenantStore.run(tenant, fn)
}

export type { TenantContext }
