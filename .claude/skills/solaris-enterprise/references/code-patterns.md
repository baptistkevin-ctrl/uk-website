# Code Patterns

## Import Ordering (every file, always)

```typescript
// GROUP 1: External packages
import { useState, useEffect } from "react"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// GROUP 2: Internal — lib, config, infrastructure
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/utils/logger"

// GROUP 3: Internal — services, repositories
import { userService } from "@/services/user.service"

// GROUP 4: Internal — components
import { Button, Input } from "@/components/ui"

// GROUP 5: Internal — hooks, utils
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/utils/formatting"

// GROUP 6: Types (ALWAYS last, ALWAYS 'type' keyword)
import type { User, CreateUserRequest } from "@/types"

// GROUP 7: Styles (if any)
import "./styles.css"
```

## Service Pattern (Business Logic)

```typescript
// src/services/user.service.ts
import { userRepository } from "@/repositories/user.repository"
import { emailService } from "@/services/email.service"
import { ConflictError, NotFoundError } from "@/lib/utils/errors"
import { logger } from "@/lib/utils/logger"
import type { User, CreateUserRequest } from "@/types"

export const userService = {
  async create(data: CreateUserRequest): Promise<User> {
    // Step 1: Business validation
    const existing = await userRepository.findByEmail(data.email)
    if (existing) throw new ConflictError("Email already in use")

    // Step 2: Execute
    const user = await userRepository.create({
      ...data,
      role: data.role || "member",
    })

    // Step 3: Side effects
    logger.info("User created", { userId: user.id, email: user.email })
    await emailService.sendWelcome(user.email, user.name)

    return user
  },

  async getById(id: string): Promise<User> {
    const user = await userRepository.findById(id)
    if (!user) throw new NotFoundError("User", id)
    return user
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.getById(id) // Verify exists
    if (data.email) {
      const existing = await userRepository.findByEmail(data.email)
      if (existing && existing.id !== id) throw new ConflictError("Email in use")
    }
    const updated = await userRepository.update(id, data)
    logger.info("User updated", { userId: id, fields: Object.keys(data) })
    return updated
  },

  async list(params: { page: number; limit: number; search?: string }) {
    const safePage = Math.max(1, params.page)
    const safeLimit = Math.min(Math.max(1, params.limit), 100)
    return userRepository.findMany({ ...params, page: safePage, limit: safeLimit })
  },
}
```

## Repository Pattern (Database Access)

```typescript
// src/repositories/user.repository.ts
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
      .insert({ email: data.email.toLowerCase(), name: data.name.trim(), role: data.role })
      .select("id, email, name, role, created_at, updated_at")
      .single()
    if (error) throw error
    return user
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from("users").update(data).eq("id", id)
      .select("id, email, name, role, created_at, updated_at").single()
    if (error) throw error
    return user
  },

  async softDelete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from("users").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    if (error) throw error
  },

  async findMany(params: { page: number; limit: number; search?: string }) {
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
    const { data, error, count } = await query
    if (error) throw error
    return {
      data: data || [],
      meta: { page: params.page, limit: params.limit, total: count || 0,
              totalPages: Math.ceil((count || 0) / params.limit) },
    }
  },
}
```

## API Route Pattern

```typescript
// src/app/api/v1/users/route.ts
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
    const result = await userService.list({ page, limit, search })
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

## Error Handling System

```typescript
// src/lib/utils/errors.ts
import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { logger } from "./logger"

export class AppError extends Error {
  constructor(message: string, public statusCode = 500, public code = "INTERNAL_ERROR",
    public details?: Record<string, unknown>) { super(message); this.name = "AppError" }
}
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with ID ${id} not found` : `${resource} not found`, 404, "NOT_FOUND")
  }
}
export class UnauthorizedError extends AppError {
  constructor(msg = "Authentication required") { super(msg, 401, "UNAUTHORIZED") }
}
export class ForbiddenError extends AppError {
  constructor(msg = "Insufficient permissions") { super(msg, 403, "FORBIDDEN") }
}
export class ConflictError extends AppError {
  constructor(msg: string) { super(msg, 409, "CONFLICT") }
}
export class ValidationError extends AppError {
  constructor(msg: string, details?: Record<string, unknown>) {
    super(msg, 422, "VALIDATION_ERROR", details)
  }
}
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super("Too many requests", 429, "RATE_LIMITED", { retryAfter })
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.statusCode }
    )
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request data",
        details: error.errors.map((e) => ({ field: e.path.join("."), message: e.message })) } },
      { status: 422 }
    )
  }
  logger.error("Unhandled error", { error: error instanceof Error ? error.message : "Unknown",
    stack: error instanceof Error ? error.stack : undefined })
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    { status: 500 }
  )
}
```

## Logging System

```typescript
// src/lib/utils/logger.ts
type LogLevel = "debug" | "info" | "warn" | "error"

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const entry = { level, message, timestamp: new Date().toISOString(), ...(data && { data }) }
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
  if (level === "debug" && process.env.NODE_ENV !== "development") return
  fn(JSON.stringify(entry))
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => log("debug", msg, data),
  info: (msg: string, data?: Record<string, unknown>) => log("info", msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => log("warn", msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log("error", msg, data),
}
```

## React Component Pattern

```typescript
// src/components/features/users/user-card.tsx

// 1. Imports (strict ordering)
import { useState } from "react"
import { Button, Badge, Avatar } from "@/components/ui"
import { formatDate } from "@/lib/utils/formatting"
import type { User } from "@/types"

// 2. Types
interface UserCardProps {
  user: User
  onEdit: (id: string) => void
  isCompact?: boolean
}

// 3. Component (consistent internal order)
export function UserCard({ user, onEdit, isCompact = false }: UserCardProps) {
  // 3a. Hooks
  const [isExpanded, setIsExpanded] = useState(false)

  // 3b. Derived values
  const displayName = user.name || user.email
  const isAdmin = user.role === "admin"

  // 3c. Event handlers
  function handleEdit() { onEdit(user.id) }

  // 3d. Early returns
  if (!user) return null

  // 3e. Render
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
      <Button size="sm" variant="outline" onClick={handleEdit}>Edit</Button>
    </div>
  )
}
```

## Custom Hook Pattern

```typescript
// src/hooks/use-users.ts
import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api/client"
import type { User, PaginatedResponse } from "@/types"

export function useUsers(options: { page?: number; limit?: number; search?: string } = {}) {
  const { page = 1, limit = 20, search } = options
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 })

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set("search", search)
      const res = await apiClient.get<PaginatedResponse<User>>(`/api/v1/users?${params}`)
      setUsers(res.data)
      setMeta({ total: res.meta.total, totalPages: res.meta.totalPages })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  return { users, isLoading, error, ...meta, refetch: fetchUsers }
}
```

## Env Validation

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

export const env = envSchema.parse(process.env)
```

## State Management Rules

```
Local state (useState):       Modals, form inputs, UI toggles
Server state (React Query):   Data from API — NEVER put in useState
URL state (searchParams):     Page number, search query, filters
Global state (Zustand/Context): Auth session, theme, toasts
```
