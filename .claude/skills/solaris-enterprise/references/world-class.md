# The Solaris Way — World-Class Engineering Patterns

> This file elevates Solaris Empire code from "standard enterprise" to
> "industry-leading." These are patterns used by the top 1% of engineering
> teams. Read this file for every new feature and every architecture decision.

---

## 1. THE RESULT PATTERN (Never Throw, Always Return)

Most companies use try/catch everywhere. Solaris uses the Result pattern —
functions RETURN success or failure instead of throwing. This makes error
handling explicit, composable, and impossible to forget.

```typescript
// src/lib/utils/result.ts

type Success<T> = { ok: true; data: T }
type Failure<E = string> = { ok: false; error: E; code: string }
type Result<T, E = string> = Success<T> | Failure<E>

// Helper functions to create results
export function ok<T>(data: T): Success<T> {
  return { ok: true, data }
}

export function fail<E = string>(error: E, code = "ERROR"): Failure<E> {
  return { ok: false, error, code }
}

// Usage in services:
export const userService = {
  async create(data: CreateUserRequest): Promise<Result<User>> {
    const existing = await userRepository.findByEmail(data.email)
    if (existing) {
      return fail("Email already in use", "CONFLICT")
    }

    const user = await userRepository.create(data)
    return ok(user)
  },
}

// Usage in API routes — no try/catch needed:
export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = await userService.create(body)

  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code, message: result.error } },
      { status: mapCodeToStatus(result.code) }
    )
  }

  return NextResponse.json({ data: result.data }, { status: 201 })
}

// WHY THIS IS BETTER:
// 1. You can NEVER forget to handle an error — TypeScript forces you
//    to check result.ok before accessing result.data
// 2. No hidden control flow — you see exactly where errors happen
// 3. Composable — you can chain results together
// 4. Testable — just check the return value, no expect().toThrow()
```

---

## 2. BRANDED TYPES (Types That Can't Be Mixed Up)

Standard TypeScript lets you accidentally pass a userId where an orderId
is expected because they're both strings. Branded types prevent this.

```typescript
// src/types/branded.ts

// Create brand symbols — these make types unique
declare const __brand: unique symbol
type Brand<T, B> = T & { [__brand]: B }

// Now create branded ID types
export type UserId = Brand<string, "UserId">
export type OrderId = Brand<string, "OrderId">
export type ProductId = Brand<string, "ProductId">
export type SubscriptionId = Brand<string, "SubscriptionId">

// Helper to create branded IDs
export function userId(id: string): UserId { return id as UserId }
export function orderId(id: string): OrderId { return id as OrderId }
export function productId(id: string): ProductId { return id as ProductId }

// Now TypeScript PREVENTS mixing them up:
function getOrder(id: OrderId): Promise<Order> { /* ... */ }
function getUser(id: UserId): Promise<User> { /* ... */ }

const myUserId = userId("usr_123")
const myOrderId = orderId("ord_456")

getUser(myUserId)    // ✅ Compiles
getUser(myOrderId)   // ❌ TypeScript ERROR — can't pass OrderId as UserId

// Branded money types (prevents mixing currencies)
export type USD = Brand<number, "USD">
export type GBP = Brand<number, "GBP">
export type Cents = Brand<number, "Cents">

function chargeCard(amount: Cents): void { /* ... */ }

const price = 1999 as Cents
chargeCard(price)         // ✅ Compiles
chargeCard(19.99 as any)  // You'd need to explicitly cast — makes mistakes visible

// WHY THIS IS BETTER:
// At Google scale, passing wrong IDs causes real bugs in production.
// Branded types catch these at compile time. Zero runtime cost.
```

---

## 3. VERTICAL SLICE ARCHITECTURE (Feature-First, Not Layer-First)

Standard architecture organizes by technical layer (all services together,
all components together). Vertical slices organize by FEATURE — everything
for one feature lives together. This scales better with large teams.

```
// STANDARD (what everyone does)
src/
├── components/users/
├── services/user.service.ts
├── repositories/user.repository.ts
├── types/user.ts
└── tests/unit/services/user.service.test.ts

// VERTICAL SLICE (the Solaris Way for large features)
src/features/
├── auth/
│   ├── components/           # Auth-specific UI
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   ├── actions/              # Server actions
│   │   ├── login.action.ts
│   │   └── register.action.ts
│   ├── services/             # Auth business logic
│   │   └── auth.service.ts
│   ├── repositories/         # Auth data access
│   │   └── auth.repository.ts
│   ├── schemas/              # Zod validation
│   │   └── auth.schema.ts
│   ├── types.ts              # Auth types
│   ├── constants.ts          # Auth constants
│   └── index.ts              # Public API of this feature
│
├── billing/
│   ├── components/
│   ├── actions/
│   ├── services/
│   ├── repositories/
│   ├── schemas/
│   ├── types.ts
│   └── index.ts
│
└── users/
    ├── components/
    ├── actions/
    ├── services/
    ├── repositories/
    ├── schemas/
    ├── types.ts
    └── index.ts
```

**Rule:** Each feature folder exports a clean public API through `index.ts`.
Features can ONLY import from each other's `index.ts` — never reach into
another feature's internal files.

```typescript
// ✅ CORRECT — import from feature's public API
import { loginAction } from "@/features/auth"
import { UserCard } from "@/features/users"

// ❌ WRONG — reaching into another feature's internals
import { authService } from "@/features/auth/services/auth.service"
```

---

## 4. STATE MACHINES FOR COMPLEX FLOWS

Instead of scattered if/else chains for complex state (order processing,
payment flows, onboarding), use explicit state machines. This makes
impossible states impossible.

```typescript
// src/features/orders/machines/order-machine.ts

// Define all possible states
type OrderState =
  | "draft"
  | "pending_payment"
  | "payment_processing"
  | "payment_failed"
  | "confirmed"
  | "preparing"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"

// Define all possible events (things that can happen)
type OrderEvent =
  | { type: "SUBMIT" }
  | { type: "PAYMENT_INITIATED" }
  | { type: "PAYMENT_SUCCEEDED"; transactionId: string }
  | { type: "PAYMENT_FAILED"; reason: string }
  | { type: "CONFIRM" }
  | { type: "START_PREPARING" }
  | { type: "MARK_READY" }
  | { type: "DISPATCH" }
  | { type: "DELIVER" }
  | { type: "CANCEL"; reason: string }
  | { type: "REFUND" }

// Define valid transitions — if it's not here, it CAN'T happen
const transitions: Record<OrderState, Partial<Record<OrderEvent["type"], OrderState>>> = {
  draft:                { SUBMIT: "pending_payment", CANCEL: "cancelled" },
  pending_payment:      { PAYMENT_INITIATED: "payment_processing", CANCEL: "cancelled" },
  payment_processing:   { PAYMENT_SUCCEEDED: "confirmed", PAYMENT_FAILED: "payment_failed" },
  payment_failed:       { PAYMENT_INITIATED: "payment_processing", CANCEL: "cancelled" },
  confirmed:            { START_PREPARING: "preparing", CANCEL: "cancelled" },
  preparing:            { MARK_READY: "ready_for_delivery" },
  ready_for_delivery:   { DISPATCH: "out_for_delivery" },
  out_for_delivery:     { DELIVER: "delivered" },
  delivered:            { REFUND: "refunded" },
  cancelled:            {},  // Terminal state — no transitions out
  refunded:             {},  // Terminal state — no transitions out
}

// The transition function — pure, testable, predictable
export function transitionOrder(
  currentState: OrderState,
  event: OrderEvent
): Result<OrderState> {
  const nextState = transitions[currentState]?.[event.type]
  if (!nextState) {
    return fail(
      `Cannot ${event.type} when order is ${currentState}`,
      "INVALID_TRANSITION"
    )
  }
  return ok(nextState)
}

// Usage:
const result = transitionOrder("confirmed", { type: "START_PREPARING" })
// result = { ok: true, data: "preparing" }

const bad = transitionOrder("delivered", { type: "START_PREPARING" })
// bad = { ok: false, error: "Cannot START_PREPARING when order is delivered" }

// WHY THIS IS BETTER:
// 1. You can SEE every possible state and transition in one place
// 2. Impossible states are impossible — you can't ship a cancelled order
// 3. Easy to test — test every transition with a simple table
// 4. Easy to visualize — generate a diagram from the transitions map
// 5. New developers instantly understand the business flow
```

---

## 5. INVARIANT ASSERTIONS (Catch Impossible Bugs)

Invariants are conditions that must ALWAYS be true. If they're ever false,
something deeply wrong happened. Invariant checks catch these early.

```typescript
// src/lib/utils/invariant.ts

export function invariant(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    // In development: throw with full details
    // In production: log to Sentry and throw generic error
    const error = new Error(`Invariant violation: ${message}`)
    error.name = "InvariantError"

    if (process.env.NODE_ENV === "production") {
      // Log to error tracking (Sentry)
      logger.error("Invariant violation", { message, stack: error.stack })
    }

    throw error
  }
}

// Usage — guard against "should never happen" scenarios:

async function processPayment(order: Order) {
  // This should be checked before calling, but guard anyway
  invariant(order.status === "confirmed", `Cannot process payment for order in ${order.status} state`)
  invariant(order.totalCents > 0, "Order total must be positive")
  invariant(order.userId, "Order must have a user")

  // If we get here, TypeScript KNOWS all conditions are true
  // (the asserts keyword narrows the type)
}

async function transferFunds(from: Account, to: Account, amountCents: number) {
  invariant(from.id !== to.id, "Cannot transfer to same account")
  invariant(amountCents > 0, "Transfer amount must be positive")
  invariant(from.balanceCents >= amountCents, "Insufficient funds")
}

// WHY THIS IS BETTER:
// 1. Documents assumptions in code (not just comments)
// 2. Catches "impossible" bugs instantly
// 3. TypeScript narrows types after invariant checks
// 4. In production, logs to Sentry before crashing — you know EXACTLY what went wrong
```

---

## 6. THE PIPELINE PATTERN (Compose Operations Cleanly)

Instead of deeply nested function calls, chain operations in a readable
pipeline. Especially powerful for data transformation and validation.

```typescript
// src/lib/utils/pipeline.ts

export function pipe<T>(initial: T) {
  return {
    then<R>(fn: (value: T) => R) {
      return pipe(fn(initial))
    },
    value() {
      return initial
    },
  }
}

// Usage — data transformation pipeline:
const processedUser = pipe(rawInput)
  .then(trimWhitespace)
  .then(lowercaseEmail)
  .then(validateWithSchema)
  .then(hashPassword)
  .then(addDefaultRole)
  .then(addTimestamps)
  .value()

// Async pipeline for request processing:
export async function processRequest(request: NextRequest) {
  return await pipeline(request)
    .step(extractBody)
    .step(validateInput)
    .step(checkPermissions)
    .step(executeBusinessLogic)
    .step(formatResponse)
    .run()
}

// WHY THIS IS BETTER:
// 1. Each step does ONE thing — easy to test individually
// 2. The flow reads top to bottom like a story
// 3. Easy to add/remove steps without touching others
// 4. Each step is reusable across different pipelines
```

---

## 7. SMART CONFIGURATION SYSTEM

Instead of scattered constants, build a centralized config system with
validation, defaults, and environment awareness.

```typescript
// src/config/app.config.ts

import { z } from "zod"

// Define the complete app configuration schema
const appConfigSchema = z.object({
  app: z.object({
    name: z.string().default("Solaris Empire"),
    url: z.string().url(),
    environment: z.enum(["development", "staging", "production"]),
  }),
  auth: z.object({
    sessionDurationSeconds: z.number().default(3600),
    maxLoginAttempts: z.number().default(5),
    lockoutDurationMinutes: z.number().default(15),
    passwordMinLength: z.number().default(8),
    requireEmailVerification: z.boolean().default(true),
  }),
  billing: z.object({
    defaultCurrency: z.enum(["usd", "gbp", "eur"]).default("usd"),
    trialDays: z.number().default(14),
    maxRefundDays: z.number().default(30),
    commissionRate: z.number().min(0).max(1).default(0.125), // 12.5%
  }),
  limits: z.object({
    maxFileUploadMB: z.number().default(10),
    maxPageSize: z.number().default(100),
    defaultPageSize: z.number().default(20),
    rateLimitPerMinute: z.number().default(100),
  }),
  features: z.object({
    enableAI: z.boolean().default(false),
    enableRealtime: z.boolean().default(false),
    enableAnalytics: z.boolean().default(true),
    enableMaintenanceMode: z.boolean().default(false),
  }),
})

export type AppConfig = z.infer<typeof appConfigSchema>

// Build config from environment
export const config: AppConfig = appConfigSchema.parse({
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME,
    url: process.env.NEXT_PUBLIC_APP_URL,
    environment: process.env.NODE_ENV,
  },
  auth: {
    sessionDurationSeconds: Number(process.env.SESSION_DURATION) || undefined,
    maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS) || undefined,
  },
  billing: {
    commissionRate: Number(process.env.COMMISSION_RATE) || undefined,
  },
  limits: {},
  features: {
    enableAI: process.env.FEATURE_AI === "true",
    enableRealtime: process.env.FEATURE_REALTIME === "true",
    enableMaintenanceMode: process.env.MAINTENANCE_MODE === "true",
  },
})

// Usage anywhere in the app:
import { config } from "@/config/app.config"

if (config.features.enableMaintenanceMode) {
  return <MaintenancePage />
}

const maxAttempts = config.auth.maxLoginAttempts
const commission = order.totalCents * config.billing.commissionRate
```

---

## 8. AUDIT TRAIL SYSTEM (Track Everything Important)

Every enterprise app needs to know WHO did WHAT and WHEN. Build it in
from day one.

```typescript
// src/lib/audit/audit.service.ts

interface AuditEntry {
  action: string          // "user.created", "order.cancelled", "plan.upgraded"
  actor: {
    id: string            // Who did it
    type: "user" | "admin" | "system" | "webhook"
  }
  resource: {
    type: string          // "user", "order", "subscription"
    id: string            // The affected resource ID
  }
  changes?: {
    before: Record<string, unknown>  // Old values
    after: Record<string, unknown>   // New values
  }
  metadata?: Record<string, unknown>  // Extra context (IP, user agent)
  timestamp: string
}

export const auditService = {
  async log(entry: Omit<AuditEntry, "timestamp">): Promise<void> {
    const fullEntry: AuditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    }

    // Store in database
    await supabase.from("audit_logs").insert({
      action: fullEntry.action,
      actor_id: fullEntry.actor.id,
      actor_type: fullEntry.actor.type,
      resource_type: fullEntry.resource.type,
      resource_id: fullEntry.resource.id,
      changes: fullEntry.changes,
      metadata: fullEntry.metadata,
      created_at: fullEntry.timestamp,
    })

    // Also log for observability
    logger.info("Audit", fullEntry)
  },
}

// Usage in services:
async function updateUserRole(userId: string, newRole: string, adminId: string) {
  const user = await userRepository.findById(userId)
  const oldRole = user.role

  await userRepository.update(userId, { role: newRole })

  await auditService.log({
    action: "user.role_changed",
    actor: { id: adminId, type: "admin" },
    resource: { type: "user", id: userId },
    changes: { before: { role: oldRole }, after: { role: newRole } },
  })
}
```

---

## 9. GRACEFUL DEGRADATION PATTERN

When external services fail (Stripe, email, AI), the app should still
work — just with reduced functionality, not a crash.

```typescript
// src/lib/utils/graceful.ts

interface GracefulOptions<T> {
  operation: () => Promise<T>
  fallback: T
  service: string              // For logging: "stripe", "resend", "openai"
  critical?: boolean           // If true, throw instead of falling back
  timeoutMs?: number           // Max wait time
  retries?: number             // Number of retries before fallback
}

export async function graceful<T>(options: GracefulOptions<T>): Promise<T> {
  const { operation, fallback, service, critical = false, timeoutMs = 5000, retries = 2 } = options

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Race between operation and timeout
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${service} timed out`)), timeoutMs)
        ),
      ])
      return result
    } catch (error) {
      const isLastAttempt = attempt === retries

      logger.warn(`${service} failed (attempt ${attempt + 1}/${retries + 1})`, {
        service,
        error: error instanceof Error ? error.message : "Unknown",
        attempt: attempt + 1,
        willRetry: !isLastAttempt,
      })

      if (isLastAttempt) {
        if (critical) throw error
        logger.error(`${service} degraded — using fallback`, { service })
        return fallback
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms...
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)))
    }
  }

  return fallback // TypeScript safety
}

// Usage:
const emailSent = await graceful({
  operation: () => emailService.sendWelcome(user.email),
  fallback: false,
  service: "resend",
  critical: false,   // Email failing shouldn't break registration
})

const paymentIntent = await graceful({
  operation: () => stripe.paymentIntents.create({ amount, currency }),
  fallback: null,
  service: "stripe",
  critical: true,    // Payment failing SHOULD stop the flow
})
```

---

## 10. THE SOLARIS IDENTITY SYSTEM

Every entity in a Solaris app has a prefixed, readable ID. Not just random
UUIDs — IDs that tell you what they are at a glance.

```typescript
// src/lib/utils/ids.ts

import { randomBytes } from "crypto"

const PREFIXES = {
  user: "usr",
  order: "ord",
  product: "prd",
  subscription: "sub",
  invoice: "inv",
  payment: "pay",
  session: "ses",
  apiKey: "key",
  webhook: "whk",
  notification: "ntf",
  file: "fil",
  comment: "cmt",
} as const

type EntityType = keyof typeof PREFIXES

export function generateId(entity: EntityType): string {
  const prefix = PREFIXES[entity]
  const random = randomBytes(12).toString("base64url") // URL-safe, 16 chars
  return `${prefix}_${random}`
}

// Usage:
const userId = generateId("user")       // "usr_a8Kf2mB9xQz4pL1w"
const orderId = generateId("order")     // "ord_j7Hn3kR5tYv2mW8e"
const invoiceId = generateId("invoice") // "inv_q4Lm9sF6uXc1nP3r"

// WHY THIS IS BETTER:
// 1. Looking at a log, you instantly know "ord_xxx" is an order
// 2. Support tickets become easier: "order ord_j7Hn..." vs "order f47ac10b-58cc-..."
// 3. Prevents accidentally querying wrong table with wrong ID
// 4. Combine with branded types for compile-time safety too
```

---

## 11. DEFENSIVE CODING CHECKLIST

Before shipping ANY feature, verify these defensive patterns:

```
DATA VALIDATION
[ ] Input validated at API boundary (Zod)
[ ] Output validated before sending to client (no extra fields)
[ ] Database constraints match application validation
[ ] File uploads validated by content, not just extension

ERROR RECOVERY
[ ] What happens if the database is slow? (timeout + retry)
[ ] What happens if Stripe is down? (graceful degradation)
[ ] What happens if the user double-clicks submit? (idempotency)
[ ] What happens if the browser closes mid-operation? (recovery)
[ ] What happens if two users edit the same thing? (optimistic locking)

EDGE CASES
[ ] Empty list (zero results)
[ ] Single item list
[ ] Maximum allowed items
[ ] Unicode in user input (emojis, RTL text, special chars)
[ ] Very long strings (10,000+ characters)
[ ] Negative numbers where only positive expected
[ ] Null/undefined where object expected
[ ] Timezone differences (always store UTC)
[ ] Daylight saving time transitions
[ ] Leap years (Feb 29)

SECURITY
[ ] Can a user access another user's data by changing the URL?
[ ] Can a user escalate their role by modifying the request?
[ ] Can a user bypass payment by manipulating the frontend?
[ ] Are webhook signatures verified?
[ ] Are rate limits in place?

PERFORMANCE
[ ] What happens with 10,000 rows? 100,000? 1,000,000?
[ ] Are queries using indexes? (check EXPLAIN ANALYZE)
[ ] Is the N+1 query problem avoided?
[ ] Are large lists paginated?
[ ] Are heavy operations running in background jobs?
```

---

## 12. THE SOLARIS CODE QUALITY OATH

Every Solaris engineer recites this before shipping:

```
I ship code that I would trust with my own money.
I handle errors that "should never happen."
I test the paths users will take and the ones they shouldn't.
I write code my future self will thank me for.
I name things so clearly that comments are redundant.
I build for a million users even if we have ten today.
I secure every door, not just the front entrance.
I make impossible states impossible in the type system.
I choose boring technology that works over exciting technology that might.
I document decisions, not just code.

We build from the atom. Every atom must be perfect.
```

---

*The Solaris Way — Version 1.0*
*"Different is not enough. We are better."*
