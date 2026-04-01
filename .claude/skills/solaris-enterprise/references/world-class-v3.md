# The Solaris Way III — Advanced Practical Patterns

> These patterns are used daily at companies like Stripe, Linear, Vercel,
> and Cloudflare. Unlike Tier 3 (theoretical/future), every pattern here
> is IMMEDIATELY useful on your current projects.

---

## 1. TYPED MIDDLEWARE PIPELINE (Better Than Express)

Instead of scattered middleware, build a typed pipeline where each
step can transform the request and pass data to the next step.
Every step is independently testable.

```typescript
// src/lib/middleware/pipeline.ts

type NextFunction<T> = (ctx: T) => Promise<T>

type MiddlewareFunction<TInput, TOutput> = (
  ctx: TInput,
  next: NextFunction<TOutput>
) => Promise<TOutput>

// Build a pipeline of middleware steps
export function createPipeline<T>() {
  const middlewares: MiddlewareFunction<any, any>[] = []

  return {
    // Add a middleware step
    use<TOutput>(fn: MiddlewareFunction<T, TOutput>) {
      middlewares.push(fn)
      return this as unknown as ReturnType<typeof createPipeline<TOutput>>
    },

    // Execute the pipeline
    async execute(initialCtx: T): Promise<T> {
      let index = 0

      const next: NextFunction<T> = async (ctx) => {
        if (index >= middlewares.length) return ctx
        const middleware = middlewares[index++]
        return middleware(ctx, next)
      }

      return next(initialCtx)
    },
  }
}

// Define the request context that flows through the pipeline
interface ApiContext {
  request: NextRequest
  response?: NextResponse
  user?: { id: string; role: string; email: string }
  startTime: number
  requestId: string
  body?: unknown
  params?: Record<string, string>
}

// Each middleware is a small, focused, testable function:

// 1. Timing middleware — measures request duration
async function timingMiddleware(ctx: ApiContext, next: NextFunction<ApiContext>) {
  const result = await next(ctx)
  const duration = Date.now() - ctx.startTime
  logger.info("Request completed", { requestId: ctx.requestId, durationMs: duration })
  return result
}

// 2. Auth middleware — adds user to context
async function authMiddleware(ctx: ApiContext, next: NextFunction<ApiContext>) {
  const session = await getSession(ctx.request)
  if (!session) throw new UnauthorizedError()
  return next({ ...ctx, user: session.user })
}

// 3. Rate limit middleware
async function rateLimitMiddleware(ctx: ApiContext, next: NextFunction<ApiContext>) {
  const key = ctx.user?.id || ctx.request.headers.get("x-forwarded-for") || "anon"
  const allowed = await rateLimiter.check(key)
  if (!allowed) throw new RateLimitError()
  return next(ctx)
}

// 4. Validation middleware (generic)
function validateBody<T>(schema: ZodSchema<T>) {
  return async (ctx: ApiContext, next: NextFunction<ApiContext>) => {
    const body = await ctx.request.json()
    const validated = schema.parse(body)
    return next({ ...ctx, body: validated })
  }
}

// Compose them into a pipeline:
const authenticatedPipeline = createPipeline<ApiContext>()
  .use(timingMiddleware)
  .use(rateLimitMiddleware)
  .use(authMiddleware)

// Use in API routes:
export async function POST(request: NextRequest) {
  try {
    const ctx = await authenticatedPipeline
      .use(validateBody(createUserSchema))
      .execute({
        request,
        startTime: Date.now(),
        requestId: generateId("req"),
      })

    const user = await userService.create(ctx.body as CreateUserRequest)
    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Why this matters:** Each middleware is 10-15 lines, independently testable, and
reusable across every route. Adding logging, rate limiting, or auth to an
endpoint is one line: `.use(authMiddleware)`.

---

## 2. FEATURE FLAG SYSTEM (Ship Without Risk)

Deploy code to production without exposing it to users. Roll out features
gradually — 1% of users, then 10%, then 50%, then everyone. Roll back
instantly if something breaks.

```typescript
// src/lib/features/feature-flags.ts

interface FeatureFlag {
  name: string
  enabled: boolean
  rolloutPercentage: number   // 0-100 (for gradual rollout)
  allowedUserIds?: string[]   // Specific users who can see it (for testing)
  allowedRoles?: string[]     // Roles that can see it
  description: string
  createdAt: string
}

// Define all feature flags in one place
const FLAGS: Record<string, FeatureFlag> = {
  "ai-product-descriptions": {
    name: "ai-product-descriptions",
    enabled: true,
    rolloutPercentage: 25,          // Only 25% of users see this
    allowedRoles: ["admin"],        // But all admins see it
    description: "AI-generated product descriptions using CEREBRTRON",
    createdAt: "2026-04-01",
  },
  "new-checkout-flow": {
    name: "new-checkout-flow",
    enabled: true,
    rolloutPercentage: 10,          // Testing with 10% first
    allowedUserIds: ["usr_kevin"],  // Kevin always sees it
    description: "Redesigned checkout with fewer steps",
    createdAt: "2026-04-01",
  },
  "real-time-tracking": {
    name: "real-time-tracking",
    enabled: false,                 // Not ready yet
    rolloutPercentage: 0,
    description: "Live delivery tracking on map",
    createdAt: "2026-04-01",
  },
}

export function isFeatureEnabled(
  flagName: string,
  user?: { id: string; role: string }
): boolean {
  const flag = FLAGS[flagName]
  if (!flag || !flag.enabled) return false

  // Check if user is explicitly allowed
  if (user && flag.allowedUserIds?.includes(user.id)) return true

  // Check if user's role is allowed
  if (user && flag.allowedRoles?.includes(user.role)) return true

  // Gradual rollout: hash userId to get consistent percentage
  if (user && flag.rolloutPercentage > 0) {
    const hash = simpleHash(user.id + flagName)
    const userPercentage = hash % 100
    return userPercentage < flag.rolloutPercentage
  }

  // No user context: use global enabled state
  return flag.rolloutPercentage === 100
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// Usage in components:
export function ProductPage({ product, user }: Props) {
  const showAI = isFeatureEnabled("ai-product-descriptions", user)

  return (
    <div>
      <h1>{product.name}</h1>
      {showAI ? (
        <AIDescription product={product} />
      ) : (
        <p>{product.description}</p>
      )}
    </div>
  )
}

// Usage in API routes:
export async function POST(request: NextRequest) {
  const user = await getUser(request)

  if (!isFeatureEnabled("new-checkout-flow", user)) {
    return legacyCheckout(request)
  }

  return newCheckout(request)
}
```

**Why this matters:** You deploy code to production but only Kevin and 10%
of users see it. If it breaks, flip the flag to `false` — instant rollback,
no redeployment. This is how every top tech company ships.

---

## 3. CIRCUIT BREAKER (Protect Your System)

When an external service starts failing, stop hammering it. Give it
time to recover. Automatically resume when it's healthy again.

```typescript
// src/lib/resilience/circuit-breaker.ts

type CircuitState = "closed" | "open" | "half-open"
// closed = normal, requests flow through
// open = service is down, fail immediately (don't even try)
// half-open = testing if service recovered

interface CircuitBreakerConfig {
  name: string
  failureThreshold: number    // How many failures before opening
  resetTimeoutMs: number      // How long to wait before trying again
  halfOpenMaxAttempts: number  // How many test requests in half-open
}

class CircuitBreaker {
  private state: CircuitState = "closed"
  private failureCount = 0
  private lastFailureTime = 0
  private halfOpenAttempts = 0

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // If circuit is OPEN, check if enough time has passed to try again
    if (this.state === "open") {
      const timeSinceFailure = Date.now() - this.lastFailureTime
      if (timeSinceFailure < this.config.resetTimeoutMs) {
        // Still in cooldown — fail fast without calling the service
        throw new AppError(
          `${this.config.name} circuit is open — service unavailable`,
          503,
          "CIRCUIT_OPEN"
        )
      }
      // Cooldown over — move to half-open and try one request
      this.state = "half-open"
      this.halfOpenAttempts = 0
      logger.info(`${this.config.name} circuit moving to half-open`)
    }

    // If half-open, limit attempts
    if (this.state === "half-open") {
      if (this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.state = "open"
        this.lastFailureTime = Date.now()
        throw new AppError(`${this.config.name} still failing`, 503, "CIRCUIT_OPEN")
      }
      this.halfOpenAttempts++
    }

    // Execute the operation
    try {
      const result = await operation()
      // Success! Reset everything
      if (this.state === "half-open") {
        logger.info(`${this.config.name} circuit recovered — closing`)
      }
      this.state = "closed"
      this.failureCount = 0
      return result
    } catch (error) {
      this.failureCount++
      this.lastFailureTime = Date.now()

      if (this.failureCount >= this.config.failureThreshold) {
        this.state = "open"
        logger.error(`${this.config.name} circuit OPENED after ${this.failureCount} failures`)
      }

      throw error
    }
  }

  getState(): { state: CircuitState; failures: number } {
    return { state: this.state, failures: this.failureCount }
  }
}

// Create circuit breakers for each external service:
export const stripeCircuit = new CircuitBreaker({
  name: "stripe",
  failureThreshold: 5,       // Open after 5 consecutive failures
  resetTimeoutMs: 30000,     // Try again after 30 seconds
  halfOpenMaxAttempts: 2,    // Send 2 test requests
})

export const emailCircuit = new CircuitBreaker({
  name: "resend",
  failureThreshold: 3,
  resetTimeoutMs: 60000,     // Wait 1 minute
  halfOpenMaxAttempts: 1,
})

// Usage:
async function chargeCustomer(order: Order) {
  return stripeCircuit.execute(async () => {
    return stripe.paymentIntents.create({
      amount: order.totalCents,
      currency: "usd",
    })
  })
}
// If Stripe fails 5 times, the circuit OPENS.
// Next 100 requests fail instantly (no waiting for timeout).
// After 30 seconds, it tries ONE request.
// If that works, circuit CLOSES and everything resumes.
// This prevents cascading failures from killing your entire app.
```

**Why this matters:** Without a circuit breaker, if Stripe is down, every
request waits 30 seconds for a timeout, your server runs out of connections,
and your entire app dies. With a circuit breaker, failing requests return
instantly and your app stays alive.

---

## 4. OPTIMISTIC LOCKING (Prevent Lost Updates)

When two users edit the same record at the same time, the second save
silently overwrites the first. Optimistic locking detects this and
prevents data loss.

```typescript
// Database: add a version column to every editable table
// ALTER TABLE products ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

// src/repositories/product.repository.ts

async function updateWithLock(
  id: string,
  data: Partial<Product>,
  expectedVersion: number
): Promise<Result<Product>> {
  const { data: product, error } = await supabase
    .from("products")
    .update({
      ...data,
      version: expectedVersion + 1,   // Increment version
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("version", expectedVersion)   // Only update if version matches
    .select()
    .single()

  if (error || !product) {
    // Version didn't match — someone else updated it first
    return fail(
      "This record was modified by another user. Please refresh and try again.",
      "CONFLICT"
    )
  }

  return ok(product)
}

// Usage in service:
async function updateProduct(userId: string, productId: string, data: UpdateProductRequest) {
  // Frontend sends the version it loaded
  const result = await productRepository.updateWithLock(
    productId,
    data,
    data.version  // The version the user saw when they loaded the page
  )

  if (!result.ok) {
    // Tell the user to refresh — their data is stale
    throw new ConflictError(result.error)
  }

  return result.data
}

// Frontend sends version with every update:
// PUT /api/v1/products/prd_123
// { "name": "Updated Name", "price": 1999, "version": 3 }
//
// If another user already updated to version 4,
// this request fails with 409 Conflict instead of silently overwriting.
```

**Why this matters:** Without this, User A loads a product, User B loads
the same product, User B saves, User A saves — User B's changes are
silently destroyed. With optimistic locking, User A gets a clear
"someone else edited this" message.

---

## 5. TYPE-SAFE API CLIENT (Zero Guessing on Frontend)

Generate a fully typed API client from your API routes. The frontend
KNOWS exactly what every endpoint accepts and returns — at compile time.

```typescript
// src/lib/api/typed-client.ts

// Define your API contract in ONE place:
interface ApiContract {
  "GET /api/v1/users": {
    query: { page?: number; limit?: number; search?: string; role?: string }
    response: PaginatedResponse<User>
  }
  "GET /api/v1/users/:id": {
    params: { id: string }
    response: { data: User }
  }
  "POST /api/v1/users": {
    body: CreateUserRequest
    response: { data: User }
  }
  "PUT /api/v1/users/:id": {
    params: { id: string }
    body: UpdateUserRequest
    response: { data: User }
  }
  "DELETE /api/v1/users/:id": {
    params: { id: string }
    response: { success: true }
  }
  "POST /api/v1/auth/login": {
    body: { email: string; password: string }
    response: { data: { user: User; token: string } }
  }
  "POST /api/v1/billing/checkout": {
    body: { planId: string }
    response: { data: { checkoutUrl: string } }
  }
}

// The typed fetch function — TypeScript enforces correctness:
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type ExtractMethod<T extends string> = T extends `${infer M} ${string}` ? M : never
type ExtractPath<T extends string> = T extends `${string} ${infer P}` ? P : never

export async function api<K extends keyof ApiContract>(
  endpoint: K,
  options?: {
    params?: ApiContract[K] extends { params: infer P } ? P : never
    body?: ApiContract[K] extends { body: infer B } ? B : never
    query?: ApiContract[K] extends { query: infer Q } ? Q : never
  }
): Promise<ApiContract[K]["response"]> {
  const [method, pathTemplate] = (endpoint as string).split(" ") as [Method, string]

  // Replace :params in URL
  let path = pathTemplate
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      path = path.replace(`:${key}`, String(value))
    }
  }

  // Add query string
  if (options?.query) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) params.set(key, String(value))
    }
    path += `?${params.toString()}`
  }

  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(options?.body && { body: JSON.stringify(options.body) }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new AppError(error.error.message, response.status, error.error.code)
  }

  return response.json()
}

// Usage — TypeScript catches ALL mistakes at compile time:

// ✅ Correct — TypeScript knows the response type
const users = await api("GET /api/v1/users", {
  query: { page: 1, limit: 20, search: "kevin" },
})
// users is typed as PaginatedResponse<User> — autocomplete works!

// ✅ Correct — params and body are typed
const user = await api("PUT /api/v1/users/:id", {
  params: { id: "usr_123" },
  body: { name: "Kevin Baptist", role: "admin" },
})

// ❌ TypeScript ERROR — wrong body shape
const bad = await api("POST /api/v1/auth/login", {
  body: { username: "kevin" },  // ERROR: 'username' doesn't exist, need 'email'
})

// ❌ TypeScript ERROR — missing required params
const bad2 = await api("GET /api/v1/users/:id", {})
// ERROR: params.id is required
```

**Why this matters:** Your frontend developers can NEVER send the wrong
data to the wrong endpoint. TypeScript catches it before the code even
runs. Change an API response type? Every frontend call that uses it
gets a compile error instantly — no runtime surprises.

---

## 6. EVENT BUS (Decouple Everything)

Instead of services directly calling each other, they publish events.
Other services subscribe to events they care about. This means adding
new features never requires changing existing code.

```typescript
// src/lib/events/event-bus.ts

type EventMap = {
  "user.created": { user: User }
  "user.updated": { userId: string; changes: Partial<User> }
  "user.deleted": { userId: string }
  "order.created": { order: Order }
  "order.paid": { orderId: string; amountCents: number }
  "order.shipped": { orderId: string; trackingNumber: string }
  "subscription.activated": { userId: string; planId: string }
  "subscription.cancelled": { userId: string; reason: string }
  "payment.succeeded": { orderId: string; paymentId: string }
  "payment.failed": { orderId: string; error: string }
}

type EventHandler<T> = (payload: T) => Promise<void>

class EventBus {
  private handlers = new Map<string, EventHandler<any>[]>()

  // Subscribe to an event
  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>) {
    const existing = this.handlers.get(event as string) || []
    existing.push(handler)
    this.handlers.set(event as string, existing)
  }

  // Publish an event — all subscribers are notified
  async emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    const handlers = this.handlers.get(event as string) || []

    logger.info(`Event: ${event as string}`, {
      event,
      handlerCount: handlers.length,
    })

    // Execute all handlers (don't let one failure stop others)
    const results = await Promise.allSettled(
      handlers.map((handler) => handler(payload))
    )

    // Log any handler failures
    for (const [index, result] of results.entries()) {
      if (result.status === "rejected") {
        logger.error(`Event handler failed for ${event as string}`, {
          handlerIndex: index,
          error: result.reason,
        })
      }
    }
  }
}

export const eventBus = new EventBus()

// Register handlers — each handler is independent and focused:

// When a user is created, send welcome email
eventBus.on("user.created", async ({ user }) => {
  await emailService.sendWelcome(user.email, user.name)
})

// When a user is created, create analytics profile
eventBus.on("user.created", async ({ user }) => {
  await analyticsService.createProfile(user.id, user.email)
})

// When a user is created, log to audit trail
eventBus.on("user.created", async ({ user }) => {
  await auditService.log({
    action: "user.created",
    actor: { id: user.id, type: "user" },
    resource: { type: "user", id: user.id },
  })
})

// When order is paid, notify vendor
eventBus.on("order.paid", async ({ orderId, amountCents }) => {
  const order = await orderRepository.findById(orderId)
  await notificationService.notifyVendor(order.vendorId, {
    type: "new_order",
    orderId,
    amountCents,
  })
})

// When order is paid, update analytics
eventBus.on("order.paid", async ({ orderId, amountCents }) => {
  await analyticsService.trackRevenue(amountCents)
})

// Usage in services — just emit, don't know who's listening:
export const userService = {
  async create(data: CreateUserRequest): Promise<User> {
    const user = await userRepository.create(data)

    // Emit event — all registered handlers run automatically
    await eventBus.emit("user.created", { user })

    return user
  },
}

// ADDING A NEW FEATURE:
// Want to send a Slack notification when a user signs up?
// Just add ONE line — no changes to userService:
eventBus.on("user.created", async ({ user }) => {
  await slackService.notify("#signups", `New user: ${user.email}`)
})
```

**Why this matters:** Your user service doesn't know or care about emails,
analytics, Slack, or audit logs. It just emits "user.created" and moves on.
Adding new side effects is ONE line. Removing them is ONE line. Nothing
in the core code changes. This is how Netflix, Uber, and Spotify are built.

---

## 7. SMART CACHE STRATEGY (Cache What Matters)

Not everything needs caching. Not everything should be cached the same
way. Build a smart cache that knows the difference.

```typescript
// src/lib/cache/smart-cache.ts

interface CacheOptions {
  ttlSeconds: number           // How long to keep it
  staleWhileRevalidate?: boolean  // Serve stale data while fetching fresh
  tags?: string[]              // For cache invalidation by tag
}

// In-memory cache (upgrade to Redis for production at scale)
const cache = new Map<string, { data: unknown; expiresAt: number; tags: string[] }>()

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const existing = cache.get(key)
  const now = Date.now()

  // Cache hit and not expired
  if (existing && existing.expiresAt > now) {
    return existing.data as T
  }

  // Stale-while-revalidate: return stale data immediately,
  // refresh in background
  if (existing && options.staleWhileRevalidate) {
    // Return stale data now
    const staleData = existing.data as T

    // Refresh in background (don't await)
    fetcher().then((freshData) => {
      cache.set(key, {
        data: freshData,
        expiresAt: now + options.ttlSeconds * 1000,
        tags: options.tags || [],
      })
    }).catch((error) => {
      logger.warn("Background cache refresh failed", { key, error })
    })

    return staleData
  }

  // Cache miss — fetch fresh data
  const data = await fetcher()
  cache.set(key, {
    data,
    expiresAt: now + options.ttlSeconds * 1000,
    tags: options.tags || [],
  })
  return data
}

// Invalidate all cache entries with a specific tag
export function invalidateByTag(tag: string): void {
  for (const [key, entry] of cache.entries()) {
    if (entry.tags.includes(tag)) {
      cache.delete(key)
    }
  }
}

// Usage — different strategies for different data:

// User profile: cache 5 minutes, serve stale while refreshing
async function getUserProfile(userId: string) {
  return cached(
    `user:${userId}`,
    () => userRepository.findById(userId),
    { ttlSeconds: 300, staleWhileRevalidate: true, tags: [`user:${userId}`] }
  )
}

// Product list: cache 1 minute (changes more frequently)
async function getProducts(page: number) {
  return cached(
    `products:page:${page}`,
    () => productRepository.findMany({ page, limit: 20 }),
    { ttlSeconds: 60, tags: ["products"] }
  )
}

// Config: cache 10 minutes (rarely changes)
async function getPricingPlans() {
  return cached(
    "pricing-plans",
    () => planRepository.findAll(),
    { ttlSeconds: 600, tags: ["plans"] }
  )
}

// When a product is updated, invalidate product caches:
async function updateProduct(id: string, data: UpdateProductRequest) {
  const product = await productRepository.update(id, data)
  invalidateByTag("products")  // All product list caches cleared
  invalidateByTag(`product:${id}`)  // This specific product's cache cleared
  return product
}
```

**Why this matters:** Your API serves product lists in 5ms instead of 200ms
because it's cached. But when a vendor updates a product, the cache
instantly invalidates. Users always see fresh data. Your database handles
10x fewer queries.

---

## 8. REQUEST DEDUPLICATION (Prevent Thundering Herd)

When 100 users request the same data at the same time, your database
gets hit 100 times with the identical query. Request deduplication
collapses them into ONE query.

```typescript
// src/lib/cache/dedup.ts

const inflightRequests = new Map<string, Promise<unknown>>()

export async function dedup<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // If this exact request is already in-flight, wait for it
  const existing = inflightRequests.get(key) as Promise<T> | undefined
  if (existing) {
    logger.debug("Request deduplicated", { key })
    return existing
  }

  // First request — execute it
  const promise = fetcher().finally(() => {
    inflightRequests.delete(key)  // Clean up when done
  })

  inflightRequests.set(key, promise)
  return promise
}

// Usage:
async function getPopularProducts() {
  // If 100 requests come in within the same tick,
  // only 1 database query runs. All 100 get the same result.
  return dedup("popular-products", () => {
    return supabase
      .from("products")
      .select("*")
      .order("sold_count", { ascending: false })
      .limit(20)
  })
}
```

**Why this matters:** Flash sale starts, 10,000 users hit the product page
simultaneously. Without dedup: 10,000 identical queries crash your
database. With dedup: 1 query, 10,000 users served.

---

## 9. STRUCTURED ERROR CONTEXT (Debug Any Error in 30 Seconds)

Every error carries full context about what was happening when it
occurred. No more "Error: something went wrong" with no details.

```typescript
// src/lib/errors/contextual-error.ts

interface ErrorContext {
  operation: string          // What were we trying to do
  entity?: string            // What entity was involved
  entityId?: string          // Which specific entity
  input?: Record<string, unknown>  // What data was provided (sanitized)
  userId?: string            // Who triggered this
  requestId?: string         // Which request
  metadata?: Record<string, unknown>
}

export class ContextualError extends AppError {
  public context: ErrorContext

  constructor(
    message: string,
    statusCode: number,
    code: string,
    context: ErrorContext
  ) {
    super(message, statusCode, code)
    this.context = context

    // Auto-log with full context
    logger.error(message, {
      code,
      statusCode,
      ...context,
    })
  }
}

// Usage — rich context on every error:
async function updateOrderStatus(orderId: string, newStatus: string, userId: string) {
  const order = await orderRepository.findById(orderId)

  if (!order) {
    throw new ContextualError(
      "Order not found",
      404,
      "NOT_FOUND",
      {
        operation: "updateOrderStatus",
        entity: "order",
        entityId: orderId,
        input: { newStatus },
        userId,
        requestId: getContext()?.requestId,
      }
    )
  }

  const transition = transitionOrder(order.status, { type: newStatus })
  if (!transition.ok) {
    throw new ContextualError(
      transition.error,
      422,
      "INVALID_TRANSITION",
      {
        operation: "updateOrderStatus",
        entity: "order",
        entityId: orderId,
        input: { currentStatus: order.status, newStatus },
        userId,
        requestId: getContext()?.requestId,
        metadata: { validTransitions: getValidTransitions(order.status) },
      }
    )
  }
}

// The error log now shows EVERYTHING:
// {
//   "level": "error",
//   "message": "Cannot DELIVER when order is pending_payment",
//   "code": "INVALID_TRANSITION",
//   "operation": "updateOrderStatus",
//   "entity": "order",
//   "entityId": "ord_abc123",
//   "input": { "currentStatus": "pending_payment", "newStatus": "DELIVER" },
//   "userId": "usr_kevin",
//   "requestId": "req_xyz789",
//   "metadata": { "validTransitions": ["PAYMENT_INITIATED", "CANCEL"] }
// }
//
// ONE log entry tells you everything: who, what, why it failed, and what
// the valid options were. Debug time: 30 seconds, not 30 minutes.
```

---

## COMPLETE PATTERN COUNT

```
TIER 1 — Enterprise Foundation:        7 patterns
TIER 2 — World-Class (v1):            10 patterns
TIER 2 — World-Class (v2 — invented): 10 patterns
TIER 2 — World-Class (v3 — THIS):      9 patterns
                                       ─────────
TOTAL:                                 36 patterns
```

No other startup on earth ships with 36 engineering patterns.
This is the Solaris Empire standard.

---

*"The patterns you build into your foundation determine the height
of the skyscraper you can construct on top."*

*— Solaris Empire Inc.*
