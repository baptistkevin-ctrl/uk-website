# Naming Conventions

## Complete Naming Table

```
WHAT                    CONVENTION          EXAMPLE
─────────────────────────────────────────────────────────────────
Files & folders         kebab-case          user-profile.tsx, auth.service.ts
Variables & functions   camelCase           userName, handleSubmit, fetchData
React components        PascalCase (code)   UserCard, DashboardStats
  (files stay kebab)    kebab-case (file)   user-card.tsx, dashboard-stats.tsx
Types & interfaces      PascalCase          User, CreateUserRequest
  No I or T prefix                          NOT IUser, NOT TOrderStatus
Constants               UPPER_SNAKE_CASE    MAX_RETRIES, API_BASE_URL
Database tables         snake_case plural   users, order_items
Database columns        snake_case          first_name, created_at
Database indexes        idx_table_columns   idx_users_email
Database constraints    fk_from_to          fk_orders_users
Env variables           UPPER_SNAKE_CASE    STRIPE_SECRET_KEY
API endpoints           kebab-case plural   /api/v1/order-items
Git branches            type/ticket-desc    feature/SE-123-user-auth
CSS classes             Tailwind utility    (use Tailwind only)
Test files              .test.ts/.spec.ts   user.service.test.ts
```

## File Naming Patterns

```
Components:        user-card.tsx, stats-chart.tsx, login-form.tsx
Pages:             page.tsx (Next.js convention)
API Routes:        route.ts (Next.js convention)
Services:          user.service.ts, auth.service.ts, billing.service.ts
Repositories:      user.repository.ts, order.repository.ts
Hooks:             use-auth.ts, use-debounce.ts, use-pagination.ts
Types:             auth.ts, billing.ts, common.ts, database.ts
Utils:             formatting.ts, validation.ts, errors.ts, logger.ts
Tests:             user.service.test.ts, auth.spec.ts
Config:            site.ts, navigation.ts, plans.ts, features.ts
```

## Booleans — ALWAYS prefix

```typescript
// ALWAYS use is/has/can/should/will/was prefix
const isLoading = true
const isAuthenticated = false
const hasPermission = true
const canEdit = user.role === "admin"
const shouldRefresh = lastFetch > STALE_TIME
const wasDeleted = !!user.deletedAt

// NEVER use ambiguous names
const loading = true    // ❌ Is it loading? Does it load?
const admin = false     // ❌ Is admin? Has admin?
```

## Functions — ALWAYS start with verb

```typescript
// Data operations
getUser(id)              createOrder(data)
updateProfile(id, data)  deleteComment(id)
findUserByEmail(email)   listOrders(filters)

// Event handlers
handleClick()            handleSubmit(data)
handleChange(event)      handleDelete(id)

// Utilities
formatCurrency(amount)   parseDate(string)
validateEmail(email)     calculateTotal(items)

// Async operations
fetchUsers()             sendEmail(to, template)
processPayment(order)    uploadFile(file)

// Boolean checks
isValidEmail(email)      hasPermission(user, action)
```

## Component Props

```typescript
// ALWAYS: ComponentName + "Props"
interface UserCardProps {
  user: User
  onEdit: (id: string) => void
  isCompact?: boolean  // Optional props use ?
}

export function UserCard({ user, onEdit, isCompact = false }: UserCardProps) {}
```

## Type Patterns

```typescript
// Database row — match table name, singular
interface User { id: string; email: string; name: string }

// API request — action + entity + "Request"
interface CreateUserRequest { email: string; name: string }
interface UpdateOrderRequest { status: OrderStatus }

// API response — entity + "Response"
interface UserResponse { user: User; token: string }
interface PaginatedResponse<T> { data: T[]; meta: { page: number; total: number } }

// Status types — string unions (not enums)
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"
type UserRole = "admin" | "manager" | "member" | "viewer"
```

## Environment Variables

```bash
# Prefixed by service, UPPER_SNAKE_CASE
NEXT_PUBLIC_APP_URL=           # NEXT_PUBLIC_ = exposed to browser (safe only)
NEXT_PUBLIC_SUPABASE_URL=      # No prefix = server-only (secrets here)
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
```

## Git Branches

```
feature/SE-123-user-authentication
bugfix/SE-456-fix-login-redirect
hotfix/SE-789-patch-payment-crash
chore/SE-101-update-dependencies
refactor/SE-202-clean-user-service
docs/SE-303-update-api-docs
test/SE-404-add-auth-tests
```

## Commit Messages (Conventional Commits)

```
type(scope): description [SE-ticket]

feat(auth): add Google OAuth login [SE-123]
fix(billing): correct tax calculation for EU [SE-456]
refactor(users): extract email validation to shared util
perf(dashboard): add index on orders.created_at [SE-789]
test(auth): add edge cases for expired tokens
docs(api): document billing endpoints
chore(deps): update next to 15.2.1
```

Rules: present tense, imperative mood, max 72 chars, never "fix stuff" or "wip"

## API Endpoints

```
GET    /api/v1/users              List (paginated)
POST   /api/v1/users              Create
GET    /api/v1/users/:id          Get one
PUT    /api/v1/users/:id          Full update
PATCH  /api/v1/users/:id          Partial update
DELETE /api/v1/users/:id          Soft delete
GET    /api/v1/users/:id/orders   Nested (max 2 levels deep)
```

Always: kebab-case, plural nouns, versioned, no verbs in URLs.
