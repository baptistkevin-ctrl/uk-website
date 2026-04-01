# Multi-Tenancy Patterns

> For Webcrafts (per-website), UK Grocery (per-vendor), UK Taxi (per-company).
> Every multi-user platform needs tenant isolation.

---

## 1. TENANT CONTEXT (Know Who's Data You're Touching)

Every request carries the tenant ID. Every query automatically filters
by it. It's impossible to accidentally access another tenant's data.

```typescript
// src/lib/tenant/tenant-context.ts

import { AsyncLocalStorage } from "async_hooks"

interface TenantContext {
  tenantId: string           // The vendor, website, or company ID
  tenantType: string         // "vendor", "website", "company"
  tenantPlan: string         // "free", "starter", "pro", "enterprise"
  tenantLimits: {
    maxProducts: number
    maxStorage: number       // In MB
    maxApiCalls: number      // Per day
  }
}

const tenantStore = new AsyncLocalStorage<TenantContext>()

export function getTenant(): TenantContext {
  const tenant = tenantStore.getStore()
  if (!tenant) throw new UnauthorizedError("No tenant context — are you authenticated?")
  return tenant
}

export function runWithTenant<T>(tenant: TenantContext, fn: () => T): T {
  return tenantStore.run(tenant, fn)
}

// Middleware: extract tenant from auth session
export async function tenantMiddleware(request: NextRequest) {
  const session = await getSession(request)
  if (!session) return NextResponse.next()

  const tenant = await getTenantForUser(session.user.id)
  if (!tenant) return NextResponse.next()

  return runWithTenant(tenant, () => NextResponse.next())
}
```

## 2. TENANT-SCOPED REPOSITORY (Automatic Data Isolation)

Wrap your repository so every query automatically includes the tenant
filter. It's physically impossible to query another tenant's data.

```typescript
// src/lib/tenant/scoped-repository.ts

export function createTenantScopedRepository<T extends { tenant_id: string }>(
  tableName: string
) {
  return {
    async findById(id: string): Promise<T | null> {
      const tenant = getTenant()
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", id)
        .eq("tenant_id", tenant.tenantId)  // ALWAYS filtered
        .is("deleted_at", null)
        .single()
      if (error && error.code !== "PGRST116") throw error
      return data
    },

    async findMany(params: { page: number; limit: number }): Promise<PaginatedResponse<T>> {
      const tenant = getTenant()
      const offset = (params.page - 1) * params.limit
      const { data, error, count } = await supabase
        .from(tableName)
        .select("*", { count: "exact" })
        .eq("tenant_id", tenant.tenantId)  // ALWAYS filtered
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + params.limit - 1)
      if (error) throw error
      return {
        data: data || [],
        meta: { page: params.page, limit: params.limit,
                total: count || 0, totalPages: Math.ceil((count || 0) / params.limit) },
      }
    },

    async create(data: Omit<T, "id" | "tenant_id" | "created_at" | "updated_at">): Promise<T> {
      const tenant = getTenant()
      const { data: record, error } = await supabase
        .from(tableName)
        .insert({ ...data, tenant_id: tenant.tenantId })  // Auto-set tenant
        .select()
        .single()
      if (error) throw error
      return record
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      const tenant = getTenant()
      const { data: record, error } = await supabase
        .from(tableName)
        .update(data)
        .eq("id", id)
        .eq("tenant_id", tenant.tenantId)  // Can't update other tenant's data
        .select()
        .single()
      if (error) throw error
      return record
    },

    async softDelete(id: string): Promise<void> {
      const tenant = getTenant()
      const { error } = await supabase
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("tenant_id", tenant.tenantId)  // Can't delete other tenant's data
      if (error) throw error
    },
  }
}

// Usage — create scoped repositories:
const productRepo = createTenantScopedRepository<Product>("products")
const orderRepo = createTenantScopedRepository<Order>("orders")

// These CANNOT access data from another tenant.
// Even if someone manipulates the ID, the tenant_id filter blocks it.
```

## 3. DATABASE RLS FOR MULTI-TENANCY

```sql
-- Every tenant table has tenant_id
ALTER TABLE products ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);

-- RLS: users can only see their own tenant's data
CREATE POLICY tenant_isolation_products ON products
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members
      WHERE user_id = auth.uid()
    )
  );
```

## 4. TENANT LIMITS ENFORCEMENT

```typescript
// src/lib/tenant/limits.ts

const PLAN_LIMITS = {
  free:       { maxProducts: 10,    maxStorageMB: 100,   maxApiCalls: 1000 },
  starter:    { maxProducts: 100,   maxStorageMB: 1000,  maxApiCalls: 10000 },
  pro:        { maxProducts: 1000,  maxStorageMB: 10000, maxApiCalls: 100000 },
  enterprise: { maxProducts: -1,    maxStorageMB: -1,    maxApiCalls: -1 }, // Unlimited
}

export async function enforceLimit(
  resource: "products" | "storage" | "apiCalls"
): Promise<void> {
  const tenant = getTenant()
  const limits = PLAN_LIMITS[tenant.tenantPlan as keyof typeof PLAN_LIMITS]

  if (resource === "products") {
    if (limits.maxProducts === -1) return // Unlimited
    const count = await countTenantProducts(tenant.tenantId)
    if (count >= limits.maxProducts) {
      throw new AppError(
        `Product limit reached (${limits.maxProducts}). Upgrade your plan.`,
        403, "LIMIT_EXCEEDED"
      )
    }
  }
  // Similar for storage and apiCalls
}

// Usage in services:
async function createProduct(data: CreateProductRequest) {
  await enforceLimit("products")  // Check before creating
  return productRepo.create(data)
}
```

## 5. TENANT-AWARE COMMISSION SYSTEM

```typescript
// src/lib/tenant/commission.ts

interface CommissionConfig {
  tenantId: string
  rate: number           // 0.125 = 12.5%
  minimumCents: number   // Minimum commission per order
  maximumCents: number   // Cap per order (-1 = no cap)
}

export async function calculateCommission(
  orderId: string,
  orderTotalCents: number
): Promise<{ platformCents: number; vendorCents: number }> {
  const tenant = getTenant()
  const config = await getCommissionConfig(tenant.tenantId)

  let platformCents = Math.round(orderTotalCents * config.rate)

  // Apply minimum
  platformCents = Math.max(platformCents, config.minimumCents)

  // Apply maximum (if set)
  if (config.maximumCents > 0) {
    platformCents = Math.min(platformCents, config.maximumCents)
  }

  const vendorCents = orderTotalCents - platformCents

  return { platformCents, vendorCents }
}
```
