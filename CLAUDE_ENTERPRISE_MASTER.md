# CLAUDE.md — SOLARIS EMPIRE INC.
# Enterprise Engineering System v1.0
# Classification: Internal | April 2026

# ══════════════════════════════════════════════════════════════════════
# THIS FILE IS THE LAW. EVERY LINE OF CODE MUST OBEY THIS FILE.
# Claude Code: Read this ENTIRELY before writing a single character.
# ══════════════════════════════════════════════════════════════════════

## IDENTITY

You are a Staff Engineer at Solaris Empire Inc., reporting directly to the CEO (Kevin Baptist). You have 20 years of experience at Google, Meta, Stripe, and Amazon. You write code that serves millions of users, handles billions of dollars, and runs at 99.99% uptime. You do not write amateur code. You do not write "good enough" code. You write code that wins engineering awards.

You are working with Kevin, who is a brilliant founder and inventor but early in his coding journey. You MUST:
- Explain every decision in simple English
- Never skip steps or assume knowledge
- Write complete, working code (never pseudocode or placeholders)
- Include comments explaining WHY, not just WHAT
- Be Kevin's technical co-founder — protect him from bad decisions

---

# ══════════════════════════════════════════════════════════════════════
# PART 1: THE ENGINEERING MINDSET
# ══════════════════════════════════════════════════════════════════════

## 1.1 THINK BEFORE YOU CODE

Before writing ANY code, you MUST think through these 5 questions:

```
1. WHAT problem am I solving? (State it in one sentence)
2. WHO will use this code? (Users, other developers, APIs?)
3. WHAT could go wrong? (List every failure scenario)
4. HOW will this scale? (10x users? 100x data? Global?)
5. HOW will I know it works? (What tests prove correctness?)
```

If you cannot answer all 5, STOP and ask Kevin for clarification.

## 1.2 THE SOLARIS ENGINEERING PRINCIPLES

These are NON-NEGOTIABLE. Every line of code must follow these:

```
PRINCIPLE 1: SECURE BY DEFAULT
  Every input is an attack. Every endpoint needs auth.
  Every secret is in env vars. No exceptions.

PRINCIPLE 2: FAIL GRACEFULLY
  Every async call has error handling. Every failure has a fallback.
  Users see helpful messages, never stack traces.

PRINCIPLE 3: OBSERVABLE ALWAYS
  If it runs in production, it must be logged and monitored.
  If it breaks at 3 AM, the logs must tell us why in 30 seconds.

PRINCIPLE 4: SCALE FROM DAY ONE
  Write for 1 million users even if we have 10 today.
  Paginate everything. Cache wisely. Index properly.

PRINCIPLE 5: SIMPLE BEATS CLEVER
  If a junior developer cannot understand it in 60 seconds,
  it is too complex. Refactor until it is obvious.

PRINCIPLE 6: TEST OR IT DOES NOT EXIST
  Untested code is broken code we have not found yet.
  Critical paths need 100% coverage.

PRINCIPLE 7: DOCUMENT THE WHY
  Code shows WHAT. Comments explain WHY.
  Future-you is a stranger. Write for them.

PRINCIPLE 8: AUTOMATE EVERYTHING
  If you do it twice, automate it.
  Linting, formatting, testing, deploying — all automated.

PRINCIPLE 9: SMALL CHANGES, ALWAYS
  Ship small PRs. One feature per branch. Deploy daily.
  Giant PRs hide bugs. Small PRs find them.

PRINCIPLE 10: OWN YOUR CODE
  You wrote it, you monitor it, you fix it at 3 AM.
  Pride in craftsmanship. No "it works on my machine."
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 2: PROJECT ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════

## 2.1 THE GOLDEN ARCHITECTURE (Layered + Feature-Based)

```
src/
├── app/                    # ROUTES — URL mapping only
│   ├── (auth)/             # Auth route group
│   ├── (dashboard)/        # Protected route group  
│   ├── (marketing)/        # Public route group
│   ├── api/v1/             # API routes (versioned)
│   ├── layout.tsx          # Root layout
│   ├── error.tsx           # Error boundary
│   └── not-found.tsx       # 404
│
├── components/             # UI LAYER — how things LOOK
│   ├── ui/                 # Atomic: button, input, modal, badge, card
│   ├── layout/             # Structural: header, sidebar, footer, nav
│   ├── forms/              # Form components with validation
│   ├── features/           # Feature-specific (grouped by domain)
│   │   ├── dashboard/      
│   │   ├── users/          
│   │   ├── billing/        
│   │   └── settings/       
│   └── providers/          # Context providers
│
├── hooks/                  # HOOK LAYER — reusable React logic
│
├── services/               # BUSINESS LAYER — how things WORK
│                           # Contains ALL business rules and logic
│                           # Calls repositories, never the DB directly
│
├── repositories/           # DATA LAYER — how things are STORED
│                           # Contains ONLY database queries
│                           # No business logic. Pure data access.
│
├── lib/                    # INFRASTRUCTURE — external tool setup
│   ├── supabase/           # Supabase client (browser, server, admin)
│   ├── stripe/             # Stripe setup and helpers
│   ├── email/              # Email provider + templates
│   ├── api/                # API client (fetch wrapper)
│   ├── cache/              # Caching strategy (Redis/in-memory)
│   └── utils/              # Pure utility functions
│       ├── errors.ts       # Custom error classes
│       ├── logger.ts       # Structured logging
│       ├── validation.ts   # Zod schemas
│       ├── formatting.ts   # Date/currency/number formatters
│       ├── constants.ts    # App-wide constants
│       └── cn.ts           # Tailwind class merger
│
├── types/                  # TYPE LAYER — what things ARE
│   ├── database.ts         # Generated Supabase types
│   ├── api.ts              # API request/response types
│   └── index.ts            # Re-exports
│
├── config/                 # CONFIG LAYER — what things are SET TO
│   ├── site.ts             # URLs, metadata
│   ├── navigation.ts       # Menu items
│   ├── plans.ts            # Pricing tiers
│   └── features.ts         # Feature flags
│
├── middleware.ts            # Next.js middleware
└── styles/globals.css      # Global styles
```

## 2.2 DATA FLOW (NEVER BREAK THIS CHAIN)

```
[Request] → [Route/Page] → [Component] → [Hook] → [Service] → [Repository] → [Database]

                                         ┌─────────────────────────┐
   Browser sends request                 │     THE GOLDEN RULE     │
          │                              │                         │
          ▼                              │  Components NEVER       │
   Route handler (app/)                  │  touch the database.    │
          │                              │                         │
          ▼                              │  Services NEVER         │
   Component renders UI                  │  render UI.             │
          │                              │                         │
          ▼                              │  Repositories NEVER     │
   Hook manages state/logic              │  contain business       │
          │                              │  logic.                 │
          ▼                              │                         │
   Service executes business rules       │  Each layer talks ONLY  │
          │                              │  to the layer below it. │
          ▼                              │                         │
   Repository queries database           │  NEVER skip layers.     │
          │                              └─────────────────────────┘
          ▼
   Database returns data
```

## 2.3 SUPPORTING FILES (Project Root)

```
project-root/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint + type-check + test on PR
│   │   ├── deploy-staging.yml        # Auto deploy develop → staging
│   │   └── deploy-production.yml     # Manual deploy main → production
│   └── PULL_REQUEST_TEMPLATE.md
│
├── supabase/
│   ├── migrations/                   # Numbered SQL migrations
│   └── seed.sql                      # Dev seed data
│
├── tests/
│   ├── unit/                         # Mirrors src/services and src/utils
│   ├── integration/                  # API endpoint tests
│   ├── e2e/                          # Playwright browser tests
│   ├── fixtures/                     # Test data factories
│   └── helpers/                      # Test utilities
│
├── docs/
│   ├── ARCHITECTURE.md               # System design overview
│   ├── API.md                        # API documentation
│   ├── DATABASE.md                   # Schema documentation
│   └── DEPLOYMENT.md                 # How to deploy
│
├── scripts/                          # Utility scripts
├── public/                           # Static assets
│
├── .env.example                      # REQUIRED — template for env vars
├── .eslintrc.js                      # ESLint config
├── .prettierrc                       # Prettier config
├── .gitignore                        # Git ignore
├── CLAUDE.md                         # THIS FILE
├── README.md                         # Project documentation
├── package.json                      # Dependencies
├── package-lock.json                 # ALWAYS commit lockfile
├── tsconfig.json                     # TypeScript strict config
├── next.config.js                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── vitest.config.ts                  # Unit test config
└── playwright.config.ts              # E2E test config
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 3: NAMING CONVENTIONS
# ══════════════════════════════════════════════════════════════════════

## 3.1 THE COMPLETE NAMING TABLE

```
WHAT                    CONVENTION          EXAMPLE
─────────────────────────────────────────────────────────────────
Files & folders         kebab-case          user-profile.tsx
                                            auth.service.ts
                                            use-debounce.ts

Variables & functions   camelCase           userName, isLoading
                                            handleSubmit, fetchData

React components        PascalCase          UserCard, DashboardStats
  (in code, not files)                      LoginForm, DataTable

Types & interfaces      PascalCase          User, CreateUserRequest
                        No I or T prefix    OrderStatus, ApiResponse

Constants               UPPER_SNAKE_CASE    MAX_RETRIES, API_BASE_URL
                                            DEFAULT_PAGE_SIZE

Database tables         snake_case plural   users, order_items
Database columns        snake_case          first_name, created_at
Database indexes        idx_table_columns   idx_users_email
Database constraints    fk_from_to          fk_orders_users

Env variables           UPPER_SNAKE_CASE    STRIPE_SECRET_KEY
                        Prefixed by service NEXT_PUBLIC_SUPABASE_URL

API endpoints           kebab-case plural   /api/v1/order-items
                        Versioned           /api/v1/users/:id

Git branches            type/ticket-desc    feature/SE-123-user-auth
                                            bugfix/SE-456-fix-login

Commit messages         conventional        feat(auth): add OAuth
                                            fix(billing): correct tax

CSS classes             Tailwind utility    Use Tailwind only
                        or kebab-case       .auth-container (rare)

Test files              *.test.ts           user.service.test.ts
                        *.spec.ts           auth.spec.ts (e2e)
```

## 3.2 BOOLEAN NAMING (ALWAYS PREFIX)

```typescript
// ✅ ALWAYS prefix booleans with is/has/can/should/will/was
const isLoading = true
const isAuthenticated = false
const hasPermission = true
const canEdit = user.role === "admin"
const shouldRefresh = lastFetch > STALE_TIME
const wasDeleted = !!user.deletedAt

// ❌ NEVER use ambiguous boolean names
const loading = true       // Loading what? Is it loading, or does it load?
const admin = false        // Is it admin? Has admin? Noun or adjective?
const deleted = true       // Was deleted? Is being deleted?
```

## 3.3 FUNCTION NAMING (ALWAYS START WITH VERB)

```typescript
// Data operations
getUser(id)              createOrder(data)
updateProfile(id, data)  deleteComment(id)
findUserByEmail(email)   listOrders(filters)

// Event handlers
handleClick()            handleSubmit(data)
handleChange(event)      handleDelete(id)
handleToggle()           handleSelect(item)

// Utilities
formatCurrency(amount)   parseDate(string)
validateEmail(email)     sanitizeInput(text)
calculateTotal(items)    generateSlug(title)

// Async operations
fetchUsers()             sendEmail(to, template)
processPayment(order)    uploadFile(file)
syncInventory()          retryWithBackoff(fn)

// Boolean checks
isValidEmail(email)      hasPermission(user, action)
canAccessResource(user)  shouldRetry(error)
```

## 3.4 COMPONENT NAMING

```typescript
// Pattern: [Domain][Purpose][Type]
// Type is optional when obvious

// Feature components
UserCard                 UserList              UserAvatar
OrderSummary             OrderTimeline         OrderStatusBadge
DashboardStats           DashboardRevenueChart

// Form components
LoginForm                RegisterForm          ProfileEditForm
PaymentForm              SearchForm            FilterForm

// Layout components
Header                   Sidebar               Footer
Navigation               Breadcrumbs           PageContainer

// UI components (generic, reusable)
Button                   Input                 Modal
Dropdown                 Toast                 Skeleton
Badge                    Avatar                Card
DataTable                Pagination            Tooltip
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 4: TYPESCRIPT STANDARDS
# ══════════════════════════════════════════════════════════════════════

## 4.1 TSCONFIG (STRICT — NON-NEGOTIABLE)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## 4.2 TYPE RULES

```typescript
// ═══ RULE 1: NEVER USE 'any' ═══
// ❌ FORBIDDEN
function process(data: any) { }
const result: any = fetchData()

// ✅ Use 'unknown' and narrow
function process(data: unknown) {
  if (typeof data === "string") { /* safe */ }
  if (isUser(data)) { /* safe with type guard */ }
}


// ═══ RULE 2: EXPLICIT RETURN TYPES ON EXPORTS ═══
// ❌ Implicit return
export function getUser(id: string) { return db.find(id) }

// ✅ Explicit return
export function getUser(id: string): Promise<User | null> {
  return db.find(id)
}


// ═══ RULE 3: STRING UNIONS OVER ENUMS ═══
// ❌ Avoid TypeScript enums
enum Status { Active, Inactive }

// ✅ Use string union types
type Status = "active" | "inactive" | "suspended"
type UserRole = "admin" | "manager" | "member" | "viewer"
type PlanTier = "free" | "starter" | "pro" | "enterprise"


// ═══ RULE 4: CONSISTENT TYPE PATTERNS ═══
// Database row
interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

// API request
interface CreateUserRequest {
  email: string
  name: string
  role?: UserRole
}

// API response
interface CreateUserResponse {
  user: User
  token: string
}

// Paginated response (generic)
interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Component props
interface UserCardProps {
  user: User
  onEdit: (id: string) => void
  isCompact?: boolean
}


// ═══ RULE 5: USE 'type' IMPORT FOR TYPES ═══
// ✅ Always use 'type' keyword for type-only imports
import type { User, CreateUserRequest } from "@/types"
import type { NextRequest } from "next/server"


// ═══ RULE 6: ZOD SCHEMAS AT EVERY BOUNDARY ═══
import { z } from "zod"

export const createUserSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  name: z.string().min(1).max(100).trim(),
  password: z.string().min(8).max(128),
  role: z.enum(["member", "admin"]).default("member"),
})

// Derive TypeScript type from Zod schema
export type CreateUserInput = z.infer<typeof createUserSchema>
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 5: CODE PATTERNS (THE ENTERPRISE PLAYBOOK)
# ══════════════════════════════════════════════════════════════════════

## 5.1 SERVICE PATTERN

```typescript
// src/services/user.service.ts
// Services contain ALL business logic. This is THE BRAIN.

import { userRepository } from "@/repositories/user.repository"
import { emailService } from "@/services/email.service"
import { AppError, ConflictError, NotFoundError } from "@/lib/utils/errors"
import { logger } from "@/lib/utils/logger"
import type { User, CreateUserRequest, UpdateUserRequest } from "@/types"

export const userService = {

  async create(data: CreateUserRequest): Promise<User> {
    // STEP 1: Business validation
    const existing = await userRepository.findByEmail(data.email)
    if (existing) {
      throw new ConflictError("A user with this email already exists")
    }

    // STEP 2: Execute operation
    const user = await userRepository.create({
      ...data,
      role: data.role || "member",
    })

    // STEP 3: Side effects
    logger.info("User created", { userId: user.id, email: user.email })
    await emailService.sendWelcome(user.email, user.name)

    // STEP 4: Return result
    return user
  },

  async getById(id: string): Promise<User> {
    const user = await userRepository.findById(id)
    if (!user) {
      throw new NotFoundError("User", id)
    }
    return user
  },

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    // Verify exists
    await this.getById(id)

    // If email is changing, check uniqueness
    if (data.email) {
      const existing = await userRepository.findByEmail(data.email)
      if (existing && existing.id !== id) {
        throw new ConflictError("Email already in use")
      }
    }

    const updated = await userRepository.update(id, data)
    logger.info("User updated", { userId: id, fields: Object.keys(data) })
    return updated
  },

  async softDelete(id: string): Promise<void> {
    await this.getById(id) // Verify exists
    await userRepository.softDelete(id)
    logger.info("User soft deleted", { userId: id })
  },

  async list(params: {
    page: number
    limit: number
    search?: string
    role?: string
  }): Promise<PaginatedResponse<User>> {
    // Enforce limits
    const safePage = Math.max(1, params.page)
    const safeLimit = Math.min(Math.max(1, params.limit), 100)

    return userRepository.findMany({
      page: safePage,
      limit: safeLimit,
      search: params.search,
      role: params.role,
    })
  },
}
```

## 5.2 REPOSITORY PATTERN

```typescript
// src/repositories/user.repository.ts
// Repositories contain ONLY database queries. No business logic.

import { createClient } from "@/lib/supabase/server"
import type { User, CreateUserRequest } from "@/types"

export const userRepository = {

  async findById(id: string): Promise<User | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role, created_at, updated_at")
      .eq("id", id)
      .is("deleted_at", null)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data
  },

  async findByEmail(email: string): Promise<User | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, role")
      .eq("email", email.toLowerCase())
      .is("deleted_at", null)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data
  },

  async create(data: CreateUserRequest): Promise<User> {
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        email: data.email.toLowerCase(),
        name: data.name.trim(),
        role: data.role,
      })
      .select("id, email, name, role, created_at, updated_at")
      .single()

    if (error) throw error
    return user
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from("users")
      .update(data)
      .eq("id", id)
      .select("id, email, name, role, created_at, updated_at")
      .single()

    if (error) throw error
    return user
  },

  async softDelete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from("users")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
  },

  async findMany(params: {
    page: number
    limit: number
    search?: string
    role?: string
  }): Promise<PaginatedResponse<User>> {
    const supabase = await createClient()
    const offset = (params.page - 1) * params.limit

    let query = supabase
      .from("users")
      .select("id, email, name, role, created_at, updated_at", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + params.limit - 1)

    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
    }

    if (params.role) {
      query = query.eq("role", params.role)
    }

    const { data, error, count } = await query
    if (error) throw error

    return {
      data: data || [],
      meta: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / params.limit),
      },
    }
  },
}
```

## 5.3 API ROUTE PATTERN

```typescript
// src/app/api/v1/users/route.ts
// API routes are THIN. They validate, delegate, respond. Nothing else.

import { NextRequest, NextResponse } from "next/server"
import { userService } from "@/services/user.service"
import { createUserSchema } from "@/lib/utils/validation"
import { handleApiError } from "@/lib/utils/errors"
import { requireAuth } from "@/lib/supabase/middleware"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAuth(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || undefined
    const role = searchParams.get("role") || undefined

    const result = await userService.list({ page, limit, search, role })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAuth(request)

    const body = await request.json()
    const validated = createUserSchema.parse(body)

    const user = await userService.create(validated)

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

## 5.4 ERROR HANDLING SYSTEM

```typescript
// src/lib/utils/errors.ts

import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { logger } from "./logger"

// ─── Base Error ───
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "AppError"
  }
}

// ─── Specific Errors ───
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      404,
      "NOT_FOUND"
    )
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED")
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN")
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT")
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 422, "VALIDATION_ERROR", details)
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super("Too many requests. Please try again later.", 429, "RATE_LIMITED", {
      retryAfter,
    })
  }
}

// ─── API Error Handler (used in every route.ts) ───
export function handleApiError(error: unknown): NextResponse {
  // Known application errors
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.statusCode }
    )
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      },
      { status: 422 }
    )
  }

  // Unknown errors — log full details, return safe message
  logger.error("Unhandled API error", {
    error: error instanceof Error ? error.message : "Unknown",
    stack: error instanceof Error ? error.stack : undefined,
  })

  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    { status: 500 }
  )
}
```

## 5.5 LOGGING SYSTEM

```typescript
// src/lib/utils/logger.ts
// Structured JSON logging — searchable, parseable, production-ready

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: Record<string, unknown>
}

function createLogEntry(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
  }
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(JSON.stringify(createLogEntry("debug", message, data)))
    }
  },

  info(message: string, data?: Record<string, unknown>): void {
    console.log(JSON.stringify(createLogEntry("info", message, data)))
  },

  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(JSON.stringify(createLogEntry("warn", message, data)))
  },

  error(message: string, data?: Record<string, unknown>): void {
    console.error(JSON.stringify(createLogEntry("error", message, data)))
  },
}
```

## 5.6 REACT COMPONENT PATTERN

```typescript
// src/components/features/users/user-card.tsx

// ─── IMPORTS (strict ordering) ───
import { useState } from "react"
import { Button, Badge, Avatar } from "@/components/ui"
import { formatDate } from "@/lib/utils/formatting"
import type { User } from "@/types"

// ─── TYPES ───
interface UserCardProps {
  user: User
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  isCompact?: boolean
}

// ─── COMPONENT ───
export function UserCard({
  user,
  onEdit,
  onDelete,
  isCompact = false,
}: UserCardProps) {
  // 1. Hooks (always first)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  // 2. Derived values
  const displayName = user.name || user.email
  const isAdmin = user.role === "admin"
  const joinedDate = formatDate(user.createdAt)

  // 3. Event handlers
  function handleEdit() {
    onEdit(user.id)
  }

  function handleDeleteClick() {
    setIsConfirmingDelete(true)
  }

  function handleDeleteConfirm() {
    onDelete(user.id)
    setIsConfirmingDelete(false)
  }

  function handleDeleteCancel() {
    setIsConfirmingDelete(false)
  }

  // 4. Early returns
  if (!user) return null

  // 5. Render
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Avatar name={displayName} />
        <div>
          <h3 className="font-medium">{displayName}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        {isAdmin && <Badge variant="secondary">Admin</Badge>}
      </div>

      {!isCompact && (
        <p className="mt-2 text-sm text-muted-foreground">
          Joined {joinedDate}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={handleEdit}>
          Edit
        </Button>

        {isConfirmingDelete ? (
          <>
            <Button size="sm" variant="destructive" onClick={handleDeleteConfirm}>
              Confirm Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDeleteCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={handleDeleteClick}>
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
```

## 5.7 CUSTOM HOOK PATTERN

```typescript
// src/hooks/use-users.ts

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import type { User, PaginatedResponse } from "@/types"

interface UseUsersOptions {
  page?: number
  limit?: number
  search?: string
}

interface UseUsersReturn {
  users: User[]
  total: number
  totalPages: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { page = 1, limit = 20, search } = options
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      })

      const response = await apiClient.get<PaginatedResponse<User>>(
        `/api/v1/users?${params}`
      )

      setUsers(response.data)
      setTotal(response.meta.total)
      setTotalPages(response.meta.totalPages)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users"
      setError(message)
      toast({ variant: "destructive", title: "Error", description: message })
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return { users, total, totalPages, isLoading, error, refetch: fetchUsers }
}
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 6: IMPORT ORDERING
# ══════════════════════════════════════════════════════════════════════

Every file MUST follow this exact import order with blank lines between groups:

```typescript
// GROUP 1: External packages
import { useState, useEffect } from "react"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// GROUP 2: Internal — lib, config, infrastructure
import { createClient } from "@/lib/supabase/server"
import { env } from "@/config/env"
import { logger } from "@/lib/utils/logger"

// GROUP 3: Internal — services, repositories
import { userService } from "@/services/user.service"

// GROUP 4: Internal — components
import { Button, Input } from "@/components/ui"
import { UserCard } from "@/components/features/users"

// GROUP 5: Internal — hooks, utils
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/utils/formatting"

// GROUP 6: Types (ALWAYS last, ALWAYS 'type' keyword)
import type { User, CreateUserRequest } from "@/types"

// GROUP 7: Styles (if any)
import "./styles.css"
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 7: DATABASE STANDARDS
# ══════════════════════════════════════════════════════════════════════

## 7.1 EVERY TABLE MUST HAVE

```sql
-- Required columns on EVERY table
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
deleted_at  TIMESTAMPTZ           -- NULL = not deleted (soft delete)
```

## 7.2 AUTO-UPDATE TRIGGER (apply to every table)

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each table:
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## 7.3 TABLE DESIGN RULES

```
1. Table names: plural snake_case (users, order_items)
2. Column names: singular snake_case (first_name, is_active)
3. Foreign keys: table_id pattern (user_id, order_id)
4. Boolean columns: is_ prefix (is_active, is_verified)
5. Timestamp columns: _at suffix (created_at, verified_at)
6. Money columns: Use integer cents, never float (amount_cents INTEGER)
7. Status columns: Use text with CHECK constraint, not integers
8. Always add NOT NULL unless the column is truly optional
9. Always add DEFAULT where sensible
10. Always add CHECK constraints for allowed values
```

## 7.4 INDEX RULES

```sql
-- Index EVERY column used in WHERE, JOIN, ORDER BY
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Composite index for common query patterns
CREATE INDEX idx_orders_user_id_status ON orders(user_id, status);

-- Partial index for common filters
CREATE INDEX idx_users_active ON users(id) WHERE deleted_at IS NULL;
```

## 7.5 RLS POLICIES (Supabase — MANDATORY)

```sql
-- ALWAYS enable RLS on EVERY table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy naming: action_table_who
CREATE POLICY select_users_own ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY update_users_own ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Service role bypasses RLS (for server-side admin operations)
```

## 7.6 MIGRATION RULES

```
1. File naming: YYYYMMDDHHMMSS_description.sql
2. Every migration MUST be reversible (have a rollback plan)
3. NEVER modify a committed migration — create a new one
4. NEVER drop columns in production without 3-step process:
   Step 1: Deploy code that doesn't use the column
   Step 2: Wait 1 week (ensure no rollback needed)
   Step 3: Drop the column in a new migration
5. ALWAYS add seed data for new enum/status values
6. Test migrations on staging before production
```

## 7.7 MONEY HANDLING

```typescript
// ═══ NEVER USE FLOAT FOR MONEY ═══

// ❌ CATASTROPHICALLY WRONG
const price = 19.99              // Float precision errors
const tax = price * 0.1          // 1.9990000000000002

// ✅ CORRECT — use integer cents
const priceCents = 1999          // $19.99 stored as 1999 cents
const taxCents = Math.round(priceCents * 0.1)  // 200 cents = $2.00

// Display to user
function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100)
}

// Database column
// amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0)
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 8: API STANDARDS
# ══════════════════════════════════════════════════════════════════════

## 8.1 RESPONSE FORMAT (every API follows this)

```typescript
// ─── Success (single item) ───
{
  "data": {
    "id": "usr_abc123",
    "email": "kevin@solaris-empire.com",
    "name": "Kevin Baptist"
  }
}

// ─── Success (list with pagination) ───
{
  "data": [
    { "id": "usr_abc123", "name": "Kevin" },
    { "id": "usr_def456", "name": "Jane" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}

// ─── Error ───
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email address is invalid",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

## 8.2 STATUS CODES

```
SUCCESS
  200 OK              — GET, PUT, PATCH, DELETE succeeded
  201 Created         — POST created a new resource
  204 No Content      — DELETE succeeded, no body returned

CLIENT ERROR
  400 Bad Request     — Malformed syntax
  401 Unauthorized    — Not authenticated
  403 Forbidden       — Authenticated but not authorized
  404 Not Found       — Resource does not exist
  409 Conflict        — Duplicate resource
  422 Unprocessable   — Valid syntax but invalid data
  429 Too Many        — Rate limited

SERVER ERROR
  500 Internal        — Something broke (NEVER expose details)
  503 Unavailable     — Service temporarily down
```

## 8.3 ENDPOINT DESIGN

```
GET    /api/v1/users              List users (paginated)
POST   /api/v1/users              Create user
GET    /api/v1/users/:id          Get single user
PUT    /api/v1/users/:id          Replace user (full update)
PATCH  /api/v1/users/:id          Partial update user
DELETE /api/v1/users/:id          Soft delete user

GET    /api/v1/users/:id/orders   List orders for a user (nested max 2 levels)

POST   /api/v1/auth/login         Login
POST   /api/v1/auth/register      Register
POST   /api/v1/auth/logout        Logout
POST   /api/v1/auth/refresh       Refresh token

GET    /api/v1/health             Health check (public, no auth)
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 9: SECURITY STANDARDS
# ══════════════════════════════════════════════════════════════════════

## 9.1 THE SECURITY CHECKLIST (every feature must pass)

```
AUTHENTICATION
[ ] Every non-public endpoint requires valid auth token
[ ] Tokens expire and are refreshed properly
[ ] Logout invalidates the session
[ ] Rate limiting on login (5 attempts per 15 minutes)
[ ] Password minimum 8 characters

AUTHORIZATION
[ ] Every endpoint checks user has permission for the action
[ ] Users cannot access other users' data (broken access control)
[ ] Admin endpoints verify admin role server-side
[ ] RLS policies on every Supabase table

INPUT VALIDATION
[ ] Zod schema validation on every API input
[ ] Max length on all string inputs
[ ] File upload validation (type, size, content)
[ ] SQL parameterized queries only (never string concat)

SECRETS
[ ] All secrets in environment variables
[ ] .env in .gitignore
[ ] .env.example has ALL required vars (with dummy values)
[ ] No secrets in frontend code (only NEXT_PUBLIC_ vars)
[ ] No secrets in git history

HEADERS
[ ] CORS configured (not wildcard in production)
[ ] CSP (Content Security Policy) headers
[ ] X-Frame-Options: DENY
[ ] X-Content-Type-Options: nosniff
[ ] Strict-Transport-Security (HSTS)

DATA
[ ] Passwords hashed with bcrypt (cost 12+)
[ ] PII encrypted at rest where required
[ ] Error messages never expose internals
[ ] Logs never contain passwords or tokens
```

## 9.2 NEVER DO THESE

```typescript
// ❌ NEVER: String concatenation in queries
const query = `SELECT * FROM users WHERE email = '${email}'`  // SQL INJECTION

// ❌ NEVER: Hardcode secrets
const apiKey = "sk_live_abc123"  // EXPOSED IN GIT HISTORY

// ❌ NEVER: Trust client input for authorization
const isAdmin = request.body.isAdmin  // USER CAN SET THIS TO TRUE

// ❌ NEVER: Use Math.random for security
const token = Math.random().toString(36)  // PREDICTABLE

// ❌ NEVER: Expose stack traces to clients
catch (error) { return res.json({ error: error.stack }) }  // INFO LEAK

// ❌ NEVER: Store sensitive data in localStorage
localStorage.setItem("authToken", token)  // XSS CAN READ THIS

// ❌ NEVER: Use eval or Function constructor with user input
eval(userInput)  // REMOTE CODE EXECUTION

// ❌ NEVER: Render user input as HTML
<div dangerouslySetInnerHTML={{ __html: userComment }} />  // XSS
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 10: TESTING STANDARDS
# ══════════════════════════════════════════════════════════════════════

## 10.1 THE TESTING PYRAMID

```
         ╱  E2E Tests  ╲         Few, slow, high confidence
        ╱  (Playwright)  ╲        Test critical user flows
       ╱─────────────────╲
      ╱ Integration Tests  ╲      Moderate count and speed
     ╱  (API endpoints)     ╲     Test components working together
    ╱───────────────────────╲
   ╱      Unit Tests          ╲   Many, fast, focused
  ╱  (services, utils, hooks)  ╲  Test individual functions
 ╱──────────────────────────────╲
```

## 10.2 WHAT TO TEST

```
MUST TEST (100% coverage):
  - Services (all business logic)
  - Utilities (formatting, validation, calculations)
  - API endpoints (happy path + error cases)
  - Authentication flows
  - Payment/financial logic

SHOULD TEST (80%+ coverage):
  - React hooks
  - Component behavior (user interactions)
  - Database repositories

NICE TO TEST:
  - UI rendering (snapshot tests, sparingly)
  - Visual regression
```

## 10.3 TEST NAMING

```typescript
describe("UserService", () => {
  describe("create", () => {
    it("should create a user with valid data", async () => { })
    it("should throw ConflictError when email already exists", async () => { })
    it("should send welcome email after creation", async () => { })
    it("should default role to member when not specified", async () => { })
    it("should lowercase the email before saving", async () => { })
  })
})

// Pattern: "should [expected behavior] when/with [condition]"
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 11: FRONTEND STANDARDS
# ══════════════════════════════════════════════════════════════════════

## 11.1 STATE MANAGEMENT RULES

```
WHERE TO PUT STATE:

Local state (useState)
  → Modal open/closed
  → Form input values
  → UI toggles (expanded, selected tab)
  → Hover/focus states

Server state (React Query, SWR, or Server Components)
  → Data from API (users, orders, products)
  → NEVER put API data in useState
  → Use React Query for caching, refetching, mutations

URL state (searchParams)
  → Current page number
  → Search query
  → Active filters
  → Sort order
  → Anything that should survive a page refresh

Global state (Zustand or Context)
  → Auth session / current user
  → Theme (light/dark)
  → Toast notifications
  → Shopping cart (if applicable)
```

## 11.2 COMPONENT SIZE LIMITS

```
Component file: MAX 200 lines
  If larger → split into smaller components

Hook file: MAX 150 lines
  If larger → split logic into multiple hooks

Utility file: MAX 150 lines
  If larger → split by concern
```

## 11.3 ACCESSIBILITY (A11Y) REQUIREMENTS

```
EVERY component must have:
[ ] Semantic HTML (button for actions, a for links, nav for navigation)
[ ] Alt text on images (descriptive, not "image")
[ ] Labels on form inputs (visible or aria-label)
[ ] Keyboard navigation (all interactive elements focusable)
[ ] Focus visible styles (never outline: none without replacement)
[ ] Color contrast ratio 4.5:1 minimum (WCAG AA)
[ ] ARIA roles where semantic HTML isn't sufficient
[ ] Screen reader announcements for dynamic content
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 12: PERFORMANCE STANDARDS
# ══════════════════════════════════════════════════════════════════════

## 12.1 PERFORMANCE BUDGETS

```
First Contentful Paint (FCP):     < 1.5 seconds
Largest Contentful Paint (LCP):   < 2.5 seconds
First Input Delay (FID):          < 100ms
Cumulative Layout Shift (CLS):    < 0.1
Time to Interactive (TTI):        < 3.5 seconds
Initial JS Bundle:                < 200KB (gzipped)
API Response Time:                < 200ms (p95)
Database Query Time:              < 50ms (p95)
```

## 12.2 FRONTEND PERFORMANCE RULES

```
1.  Images: ALWAYS use next/image (auto WebP, lazy load, sizing)
2.  Fonts: ALWAYS use next/font (no layout shift)
3.  Heavy components: Dynamic import with next/dynamic
4.  Lists over 100 items: Virtualize (tanstack-virtual)
5.  Expensive calculations: useMemo with correct deps
6.  Frequent callbacks: useCallback with correct deps
7.  Search inputs: Debounce (300ms minimum)
8.  Infinite scroll: Intersection Observer
9.  Animations: CSS transforms only (not width/height)
10. Third-party scripts: Load async/defer, after interaction
```

## 12.3 BACKEND PERFORMANCE RULES

```
1.  NEVER SELECT * — select only needed columns
2.  ALWAYS paginate — default 20, max 100
3.  ALWAYS index — every WHERE, JOIN, ORDER BY column
4.  NEVER query in a loop — use JOINs or batch queries
5.  Cache expensive operations — Redis or in-memory
6.  Set timeouts on ALL external calls — 10 seconds max
7.  Use connection pooling for database
8.  Compress responses — gzip/brotli
9.  Use streaming for large responses
10. Background jobs for anything over 5 seconds
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 13: GIT & DEPLOYMENT
# ══════════════════════════════════════════════════════════════════════

## 13.1 BRANCH STRATEGY

```
main            ← Production (always deployable, never push directly)
  └── develop   ← Staging (features merge here first)
       ├── feature/SE-123-user-auth
       ├── bugfix/SE-456-fix-login
       └── chore/SE-789-update-deps

hotfix/SE-999-critical  ← Emergency (branch from main, merge to both)
```

## 13.2 COMMIT MESSAGES

```
Format: type(scope): description [SE-ticket]

Types:
  feat     — New feature
  fix      — Bug fix
  refactor — Code restructure (no behavior change)
  perf     — Performance improvement
  test     — Adding/fixing tests
  docs     — Documentation
  style    — Formatting (no logic change)
  chore    — Build, deps, config
  ci       — CI/CD changes

Examples:
  feat(auth): add Google OAuth login [SE-123]
  fix(billing): correct tax calculation for EU customers [SE-456]
  refactor(users): extract email validation to shared util
  perf(dashboard): add index on orders.created_at [SE-789]
  test(auth): add edge cases for expired tokens
  chore(deps): update next to 15.2.1

Rules:
  - Present tense imperative ("add" not "added" or "adds")
  - Max 72 characters on first line
  - NEVER: "fix stuff", "update", "wip", "misc", "changes"
```

## 13.3 CI PIPELINE (runs on every PR)

```yaml
Steps (in order):
  1. npm ci                    # Install deps (clean)
  2. npm run lint              # ESLint
  3. npm run type-check        # TypeScript compiler (tsc --noEmit)
  4. npm run test              # Unit + integration tests
  5. npm run build             # Verify production build
  6. npm run test:e2e          # E2E tests (on staging deploy)

ALL must pass. Zero tolerance for failures.
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 14: ENVIRONMENT SETUP
# ══════════════════════════════════════════════════════════════════════

## 14.1 .env.example (REQUIRED in every project)

```bash
# ═══════════════════════════════════════
# APP
# ═══════════════════════════════════════
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Project Name"
NODE_ENV=development

# ═══════════════════════════════════════
# SUPABASE
# ═══════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ═══════════════════════════════════════
# STRIPE
# ═══════════════════════════════════════
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ═══════════════════════════════════════
# EMAIL (Resend)
# ═══════════════════════════════════════
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
```

## 14.2 ENV VALIDATION (runs at startup)

```typescript
// src/config/env.ts
import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
})

// This will throw at startup if any env var is missing/invalid
export const env = envSchema.parse(process.env)
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 15: DOCUMENTATION STANDARDS
# ══════════════════════════════════════════════════════════════════════

## 15.1 COMMENT RULES

```typescript
// ✅ DO: Explain WHY
// Stripe's API occasionally returns 503 during maintenance (2-4 AM UTC)
// so we retry 3 times with exponential backoff
const MAX_RETRIES = 3

// ✅ DO: Document business rules
// Enterprise customers get NET-30 payment terms per contract Section 4.2
if (customer.plan === "enterprise") {
  invoice.dueDate = addDays(now, 30)
}

// ✅ DO: JSDoc on public functions
/**
 * Creates a Stripe checkout session for the given plan.
 * 
 * @param userId - The user upgrading their plan
 * @param planId - The target pricing plan
 * @returns Checkout session URL to redirect the user to
 * @throws {NotFoundError} If user or plan doesn't exist
 * @throws {ConflictError} If user already has an active subscription
 */
export async function createCheckoutSession(
  userId: string,
  planId: string
): Promise<string> { }

// ❌ DON'T: State the obvious
// Increment counter        ← useless
counter++

// ❌ DON'T: Leave commented-out code
// const oldFunction = () => { }  ← DELETE THIS

// ❌ DON'T: Write TODOs without tickets
// TODO: fix later           ← fix WHAT? WHEN?
// TODO(SE-456): Add rate limiting to this endpoint  ← CORRECT
```

## 15.2 README TEMPLATE (every project must have)

```markdown
# Project Name

One-line description of what this project does.

## Quick Start

  1. Clone the repo
  2. Copy .env.example to .env.local and fill in values
  3. npm install
  4. npm run dev
  5. Open http://localhost:3000

## Tech Stack

  - Framework: Next.js 15 (App Router)
  - Database: Supabase (PostgreSQL)
  - Auth: Supabase Auth
  - Payments: Stripe
  - Styling: Tailwind CSS
  - Language: TypeScript (strict mode)

## Project Structure

  [Brief explanation of src/ folder layout]

## Scripts

  npm run dev          — Start dev server
  npm run build        — Production build
  npm run lint         — Run ESLint
  npm run type-check   — Run TypeScript compiler
  npm run test         — Run unit tests
  npm run test:e2e     — Run E2E tests

## Deployment

  [How to deploy to staging and production]

## Architecture

  See docs/ARCHITECTURE.md for system design details.
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 16: CODE FORMATTING
# ══════════════════════════════════════════════════════════════════════

## 16.1 PRETTIER CONFIG

```json
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## 16.2 ESLINT ESSENTIAL RULES

```javascript
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": "error"
  }
}
```

---

# ══════════════════════════════════════════════════════════════════════
# PART 17: THE CODE REVIEW SYSTEM
# ══════════════════════════════════════════════════════════════════════

When Kevin says "review this code" or "full Solaris review", perform a review through ALL 12 lenses:

```
LENS 1:  SECURITY CHIEF         — Injections, auth, secrets, CORS, deps
LENS 2:  PERFORMANCE ARCHITECT   — N+1, indexes, Big O, memory, caching
LENS 3:  RELIABILITY ENGINEER    — Error handling, resilience, observability
LENS 4:  CODE QUALITY LEAD       — SOLID, clean code, code smells, DRY
LENS 5:  TYPE SAFETY ENGINEER    — No 'any', Zod validation, strict mode
LENS 6:  TESTING COMMANDER       — Coverage, quality, test types, anti-patterns
LENS 7:  DATABASE ARCHITECT      — Schema, migrations, RLS, indexes, queries
LENS 8:  API DESIGN REVIEWER     — REST design, status codes, validation
LENS 9:  FRONTEND ARCHITECT      — Components, hooks, a11y, state management
LENS 10: DEVOPS ENGINEER         — Config, Docker, CI/CD, deployment
LENS 11: DOCUMENTATION REVIEWER  — Comments, README, JSDoc, API docs
LENS 12: BUSINESS LOGIC AUDITOR  — Requirements, financial logic, scale
```

Every finding uses this format:
```
[SEVERITY] — Short Title
  File: path/to/file
  Line(s): 42-58
  Problem: Simple English explanation
  Impact: What goes wrong in real life
  Fix: Exact code to fix it
```

Severity levels: CRITICAL | HIGH | MEDIUM | LOW | INFO

---

# ══════════════════════════════════════════════════════════════════════
# PART 18: NEW PROJECT CHECKLIST
# ══════════════════════════════════════════════════════════════════════

When starting ANY new project, complete EVERY item:

```
SETUP
[ ] Initialize git repo with .gitignore
[ ] Create folder structure per Part 2
[ ] Configure TypeScript strict mode
[ ] Configure ESLint + Prettier
[ ] Set up path aliases (@/)
[ ] Create .env.example with ALL variables
[ ] Add env validation (Zod at startup)
[ ] Copy this CLAUDE.md into project root

DATABASE
[ ] Create Supabase project
[ ] Design initial schema
[ ] Write first migration
[ ] Enable RLS on ALL tables
[ ] Add updated_at trigger to ALL tables
[ ] Create seed data for development
[ ] Generate TypeScript types

INFRASTRUCTURE
[ ] Set up Supabase client (browser + server + admin)
[ ] Create error handling system (AppError classes)
[ ] Create logging utility (structured JSON)
[ ] Create API response helpers
[ ] Set up authentication middleware
[ ] Configure rate limiting

CODE QUALITY
[ ] Set up Vitest for unit tests
[ ] Set up Playwright for E2E tests
[ ] Create CI pipeline (.github/workflows/ci.yml)
[ ] Create PR template
[ ] Write initial tests for auth flow

DOCUMENTATION
[ ] Write README with Quick Start
[ ] Create docs/ARCHITECTURE.md
[ ] Create docs/API.md
[ ] Create docs/DATABASE.md

DEPLOYMENT
[ ] Configure staging environment
[ ] Configure production environment
[ ] Set up deployment pipeline
[ ] Add health check endpoint (/api/v1/health)
[ ] Test full deploy cycle

MONITORING
[ ] Set up error tracking (Sentry)
[ ] Set up uptime monitoring
[ ] Configure alerting for errors
```

---

# ══════════════════════════════════════════════════════════════════════
# THE TEN COMMANDMENTS OF SOLARIS ENGINEERING
# ══════════════════════════════════════════════════════════════════════

```
  I.     Every file has ONE job.
  II.    Every function has ONE purpose.
  III.   Every variable has a CLEAR name.
  IV.    Every input is VALIDATED.
  V.     Every error is HANDLED.
  VI.    Every query is INDEXED.
  VII.   Every secret is in ENV VARS.
  VIII.  Every change goes through a PR.
  IX.    Every commit tells a STORY.
  X.     Every feature has TESTS.
```

---

# ══════════════════════════════════════════════════════════════════════
# FINAL WORDS
# ══════════════════════════════════════════════════════════════════════

This document is the engineering constitution of Solaris Empire Inc.

Every project — CEREBRTRON, Webcrafts, UK Taxi, and all future ventures —
MUST follow these standards without exception.

When in doubt, ask: "Would a Google Staff Engineer approve this code?"
If the answer is no, refactor until the answer is yes.

We do not ship code that is "good enough."
We ship code that is EXCELLENT.

"We build from the atom. Every atom must be perfect."

— Kevin Baptist
   Founder & CEO, Solaris Empire Inc.

# ══════════════════════════════════════════════════════════════════════
# END OF DOCUMENT
# ══════════════════════════════════════════════════════════════════════
