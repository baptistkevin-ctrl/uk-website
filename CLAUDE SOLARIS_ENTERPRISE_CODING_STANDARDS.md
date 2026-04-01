# SOLARIS EMPIRE INC. — ENTERPRISE CODING STANDARDS & PROJECT STRUCTURE

## For Claude Code | Version 1.0 | April 2026

> **Usage:** This is the LAW for all Solaris Empire codebases. Copy into every project as `CLAUDE.md` or `CODING_STANDARDS.md`. Claude Code MUST follow these standards for every line of code it writes. No exceptions.

---

## TABLE OF CONTENTS

1. Project Structure (Folder Architecture)
2. Naming Conventions (The Naming Bible)
3. File Rules (One File, One Job)
4. Code Architecture Patterns
5. Git Workflow & Branching
6. Commit Message Standards
7. Environment & Configuration
8. API Design Standards
9. Database Standards
10. Error Handling Architecture
11. Logging Standards
12. Authentication & Authorization Patterns
13. Testing Standards
14. Frontend Standards (React/Next.js)
15. Backend Standards (Node.js/Express/Next.js API)
16. TypeScript Standards
17. Import Ordering
18. Comment & Documentation Standards
19. Security Standards
20. Performance Standards
21. CI/CD Standards
22. Code Formatting & Linting
23. Dependency Management
24. Monorepo Standards (if applicable)

---

## 1. PROJECT STRUCTURE (FOLDER ARCHITECTURE)

Every Solaris Empire project MUST follow this exact folder structure. This is non-negotiable.

### 1.1 Full-Stack Next.js Project (Primary Standard)

```
project-root/
│
├── .github/                          # GitHub specific
│   ├── workflows/                    # CI/CD pipelines
│   │   ├── ci.yml                    # Test + lint on PR
│   │   ├── deploy-staging.yml        # Deploy to staging
│   │   └── deploy-production.yml     # Deploy to production
│   ├── PULL_REQUEST_TEMPLATE.md      # PR template
│   └── ISSUE_TEMPLATE/               # Issue templates
│       ├── bug_report.md
│       └── feature_request.md
│
├── public/                           # Static assets (Next.js serves these)
│   ├── fonts/                        # Self-hosted fonts
│   ├── images/                       # Static images
│   │   ├── icons/                    # App icons, favicons
│   │   └── og/                       # Open Graph images
│   └── locales/                      # i18n translation files (if needed)
│
├── src/                              # ALL source code lives here
│   │
│   ├── app/                          # Next.js App Router pages
│   │   ├── (auth)/                   # Route group: auth pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Auth layout (no sidebar)
│   │   │
│   │   ├── (dashboard)/              # Route group: protected pages
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── billing/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx            # Dashboard layout (with sidebar)
│   │   │
│   │   ├── (marketing)/              # Route group: public pages
│   │   │   ├── page.tsx              # Homepage
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Marketing layout
│   │   │
│   │   ├── api/                      # API routes
│   │   │   ├── v1/                   # API versioning
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── logout/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── users/
│   │   │   │   │   ├── route.ts      # GET /api/v1/users, POST /api/v1/users
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts  # GET/PUT/DELETE /api/v1/users/:id
│   │   │   │   └── webhooks/
│   │   │   │       └── stripe/
│   │   │   │           └── route.ts
│   │   │   └── health/
│   │   │       └── route.ts          # Health check endpoint
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── loading.tsx               # Root loading
│   │   ├── error.tsx                 # Root error boundary
│   │   ├── not-found.tsx             # 404 page
│   │   └── global-error.tsx          # Global error boundary
│   │
│   ├── components/                   # All React components
│   │   ├── ui/                       # Generic reusable UI (buttons, inputs, modals)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── data-table.tsx
│   │   │   └── index.ts              # Barrel export
│   │   │
│   │   ├── forms/                    # Form components
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   ├── profile-form.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── navigation.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── dashboard/
│   │   │   │   ├── stats-card.tsx
│   │   │   │   ├── activity-feed.tsx
│   │   │   │   ├── revenue-chart.tsx
│   │   │   │   └── index.ts
│   │   │   ├── users/
│   │   │   │   ├── user-list.tsx
│   │   │   │   ├── user-card.tsx
│   │   │   │   ├── user-avatar.tsx
│   │   │   │   └── index.ts
│   │   │   └── billing/
│   │   │       ├── plan-selector.tsx
│   │   │       ├── invoice-table.tsx
│   │   │       └── index.ts
│   │   │
│   │   └── providers/                # Context providers
│   │       ├── auth-provider.tsx
│   │       ├── theme-provider.tsx
│   │       ├── toast-provider.tsx
│   │       └── index.ts
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-debounce.ts
│   │   ├── use-local-storage.ts
│   │   ├── use-media-query.ts
│   │   ├── use-pagination.ts
│   │   ├── use-toast.ts
│   │   └── index.ts
│   │
│   ├── lib/                          # Core utilities and configurations
│   │   ├── supabase/                 # Supabase client setup
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   ├── admin.ts              # Admin/service role client
│   │   │   └── middleware.ts          # Auth middleware helper
│   │   │
│   │   ├── stripe/                   # Stripe setup
│   │   │   ├── client.ts             # Stripe instance
│   │   │   ├── webhooks.ts           # Webhook handler helpers
│   │   │   └── products.ts           # Product/price helpers
│   │   │
│   │   ├── email/                    # Email service
│   │   │   ├── client.ts             # Email provider setup
│   │   │   └── templates/            # Email templates
│   │   │       ├── welcome.tsx
│   │   │       ├── reset-password.tsx
│   │   │       └── invoice.tsx
│   │   │
│   │   ├── api/                      # API client for frontend
│   │   │   ├── client.ts             # Axios/fetch wrapper with interceptors
│   │   │   ├── endpoints.ts          # All API endpoint URLs
│   │   │   └── types.ts              # API request/response types
│   │   │
│   │   └── utils/                    # Pure utility functions
│   │       ├── formatting.ts         # Date, currency, number formatting
│   │       ├── validation.ts         # Zod schemas or validation helpers
│   │       ├── constants.ts          # App-wide constants
│   │       ├── errors.ts             # Custom error classes
│   │       ├── logger.ts             # Logging utility
│   │       ├── cn.ts                 # Tailwind class merger (clsx + twMerge)
│   │       └── index.ts
│   │
│   ├── services/                     # Business logic layer (THE BRAIN)
│   │   ├── auth.service.ts           # Authentication logic
│   │   ├── user.service.ts           # User CRUD + business rules
│   │   ├── billing.service.ts        # Subscription + payment logic
│   │   ├── email.service.ts          # Email sending logic
│   │   ├── storage.service.ts        # File upload/storage logic
│   │   └── index.ts
│   │
│   ├── repositories/                 # Database access layer (DATA ONLY)
│   │   ├── user.repository.ts        # User DB queries
│   │   ├── subscription.repository.ts
│   │   ├── invoice.repository.ts
│   │   └── index.ts
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── database.ts               # Supabase generated types
│   │   ├── api.ts                    # API request/response types
│   │   ├── auth.ts                   # Auth-related types
│   │   ├── billing.ts                # Billing-related types
│   │   ├── common.ts                 # Shared/common types
│   │   └── index.ts
│   │
│   ├── config/                       # Application configuration
│   │   ├── site.ts                   # Site metadata, URLs
│   │   ├── navigation.ts             # Nav menu items
│   │   ├── plans.ts                  # Pricing plans
│   │   └── features.ts               # Feature flags
│   │
│   ├── styles/                       # Global styles
│   │   └── globals.css               # Tailwind imports + custom CSS
│   │
│   └── middleware.ts                  # Next.js middleware (auth, redirects)
│
├── supabase/                         # Supabase project files
│   ├── migrations/                   # Database migrations (numbered)
│   │   ├── 20260401000000_create_users.sql
│   │   ├── 20260401000001_create_subscriptions.sql
│   │   └── 20260401000002_add_rls_policies.sql
│   ├── seed.sql                      # Development seed data
│   └── config.toml                   # Supabase local config
│
├── scripts/                          # Utility scripts
│   ├── seed-database.ts              # Seed script
│   ├── generate-types.ts             # Generate Supabase types
│   └── migrate.ts                    # Migration runner
│
├── tests/                            # Test files (mirrors src/ structure)
│   ├── unit/
│   │   ├── services/
│   │   │   ├── auth.service.test.ts
│   │   │   └── user.service.test.ts
│   │   └── utils/
│   │       └── formatting.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── auth.test.ts
│   │   │   └── users.test.ts
│   │   └── services/
│   │       └── billing.test.ts
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── dashboard.spec.ts
│   │   └── billing.spec.ts
│   ├── fixtures/                     # Test data
│   │   ├── users.ts
│   │   └── subscriptions.ts
│   └── helpers/                      # Test utilities
│       ├── setup.ts
│       └── factories.ts
│
├── docs/                             # Project documentation
│   ├── ARCHITECTURE.md               # System architecture overview
│   ├── API.md                        # API documentation
│   ├── DEPLOYMENT.md                 # Deployment guide
│   ├── DATABASE.md                   # Database schema docs
│   └── DECISIONS.md                  # Architecture Decision Records
│
├── .env.example                      # Template for environment variables
├── .env.local                        # Local dev env (NEVER commit this)
├── .eslintrc.js                      # ESLint configuration
├── .prettierrc                       # Prettier configuration
├── .gitignore                        # Git ignore rules
├── CLAUDE.md                         # Instructions for Claude Code
├── CODING_STANDARDS.md               # This document
├── README.md                         # Project readme
├── package.json                      # Dependencies
├── package-lock.json                 # Lockfile (ALWAYS commit)
├── tsconfig.json                     # TypeScript configuration
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── postcss.config.js                 # PostCSS configuration
├── playwright.config.ts              # E2E test configuration
└── vitest.config.ts                  # Unit test configuration
```

### 1.2 CRITICAL RULES — WHY THIS STRUCTURE

```
THE LAYERED ARCHITECTURE (how data flows through the app):

  [Browser/Client]
        │
        ▼
  [app/pages] ──────────── Handles routes and UI rendering
        │
        ▼
  [components/] ─────────── Displays data, handles user interaction
        │
        ▼
  [hooks/] ──────────────── Custom logic for components
        │
        ▼
  [services/] ───────────── Business logic (THE BRAIN — rules live here)
        │
        ▼
  [repositories/] ────────── Database queries (DATA ONLY — no logic here)
        │
        ▼
  [Database/Supabase]

NEVER skip a layer. A component should NEVER talk to the database directly.
A page should NEVER contain business logic.
```

**The Golden Rules:**
- `components/` = How things LOOK (UI only)
- `hooks/` = Reusable React logic
- `services/` = How things WORK (business rules)
- `repositories/` = How things are STORED (database queries)
- `lib/` = Configuration and setup of external tools
- `types/` = What things ARE (TypeScript types)
- `config/` = What things are SET TO (app settings)

---

## 2. NAMING CONVENTIONS (THE NAMING BIBLE)

This is where most junior code looks amateur. Follow these EXACTLY.

### 2.1 Files & Folders

```
RULE: All files and folders use kebab-case (lowercase with hyphens)

✅ CORRECT                          ❌ WRONG
user-profile.tsx                    UserProfile.tsx
auth.service.ts                     authService.ts
use-pagination.ts                   usePagination.ts
billing-settings/                   billingSettings/
create-user.test.ts                 createUser.test.ts
forgot-password/                    ForgotPassword/
data-table.tsx                      DataTable.tsx
```

**File naming patterns:**

```
Components:        user-card.tsx, stats-chart.tsx, login-form.tsx
Pages:             page.tsx (Next.js convention)
API Routes:        route.ts (Next.js convention)
Services:          user.service.ts, auth.service.ts
Repositories:      user.repository.ts, order.repository.ts
Hooks:             use-auth.ts, use-debounce.ts
Types:             auth.ts, billing.ts, common.ts
Utils:             formatting.ts, validation.ts
Tests:             user.service.test.ts, auth.spec.ts
Config:            site.ts, navigation.ts, plans.ts
Constants:         constants.ts (or specific: error-codes.ts)
Middleware:         middleware.ts
```

### 2.2 Variables & Functions

```
RULE: camelCase for variables and functions

✅ CORRECT                          ❌ WRONG
const userName = "Kevin"            const user_name = "Kevin"
const isLoading = true              const is_loading = true
const handleSubmit = () => {}       const handle_submit = () => {}
const fetchUserData = async () => {}  const fetch_user_data = ()
const totalRevenue = 50000          const TotalRevenue = 50000
```

**Specific naming patterns:**

```
Booleans:    ALWAYS prefix with is/has/can/should/will
             isLoading, isAuthenticated, hasPermission, canEdit, shouldRefresh

Functions:   ALWAYS start with a verb
             getUser, createOrder, updateProfile, deleteComment
             handleClick, handleSubmit, handleChange (event handlers)
             validateEmail, formatCurrency, parseDate (utilities)
             fetchUsers, sendEmail, processPayment (async operations)

Arrays:      ALWAYS use plural names
             const users = []
             const orderItems = []
             const selectedIds = []

Constants:   UPPER_SNAKE_CASE
             const MAX_RETRY_COUNT = 3
             const API_BASE_URL = "https://api.example.com"
             const DEFAULT_PAGE_SIZE = 20
             const RATE_LIMIT_WINDOW_MS = 60000
```

### 2.3 React Components

```
RULE: PascalCase for components (in code), kebab-case for filenames

File: user-profile-card.tsx
Inside the file:
  export function UserProfileCard({ user }: UserProfileCardProps) { ... }

File: dashboard-stats.tsx
Inside the file:
  export function DashboardStats({ stats }: DashboardStatsProps) { ... }
```

**Component prop types:**

```typescript
// ALWAYS define props as an interface with the component name + "Props"
interface UserCardProps {
  user: User
  onEdit: (id: string) => void
  isCompact?: boolean  // Optional props use ?
}

export function UserCard({ user, onEdit, isCompact = false }: UserCardProps) {
  // ...
}
```

### 2.4 TypeScript Types & Interfaces

```
RULE: PascalCase, no prefix (no I for interfaces, no T for types)

✅ CORRECT                          ❌ WRONG
interface User { }                  interface IUser { }
type OrderStatus = ...              type TOrderStatus = ...
type ApiResponse<T> = ...           type TApiResponse<T> = ...
interface CreateUserRequest { }     interface ICreateUserReq { }
```

**Naming patterns for types:**

```typescript
// Database row types — match table name, singular
interface User { id: string; email: string; name: string }
interface Order { id: string; userId: string; total: number }

// API request types — action + entity + "Request"
interface CreateUserRequest { email: string; name: string }
interface UpdateOrderRequest { status: OrderStatus }

// API response types — entity + "Response"  
interface UserResponse { user: User; token: string }
interface PaginatedResponse<T> { data: T[]; total: number; page: number }

// Enum-like types — use string unions (not TypeScript enums)
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"
type UserRole = "admin" | "manager" | "member" | "viewer"
type PlanTier = "free" | "starter" | "pro" | "enterprise"
```

### 2.5 Database (Tables & Columns)

```
RULE: snake_case for everything in the database

✅ CORRECT                          ❌ WRONG
users                               Users, User
order_items                         orderItems, OrderItems
created_at                          createdAt
first_name                          firstName
is_active                           isActive
stripe_customer_id                  stripeCustomerId
```

**Table naming rules:**

```sql
-- Tables: plural snake_case
CREATE TABLE users ( ... );
CREATE TABLE order_items ( ... );
CREATE TABLE subscription_plans ( ... );

-- Columns: singular snake_case
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES users(id),
first_name TEXT NOT NULL,
email TEXT UNIQUE NOT NULL,
is_active BOOLEAN DEFAULT true,
stripe_customer_id TEXT,
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now(),
deleted_at TIMESTAMPTZ  -- soft delete

-- Junction/join tables: both table names combined
CREATE TABLE user_roles ( ... );       -- users + roles
CREATE TABLE order_products ( ... );   -- orders + products

-- Indexes: idx_tablename_columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id_status ON orders(user_id, status);

-- Foreign keys: fk_thistable_othertable
ALTER TABLE orders ADD CONSTRAINT fk_orders_users 
  FOREIGN KEY (user_id) REFERENCES users(id);
```

### 2.6 API Endpoints

```
RULE: kebab-case, plural nouns, versioned

✅ CORRECT                          ❌ WRONG
GET    /api/v1/users                /api/getUsers
POST   /api/v1/users                /api/createUser
GET    /api/v1/users/:id            /api/user/:id
PUT    /api/v1/users/:id            /api/updateUser
DELETE /api/v1/users/:id            /api/deleteUser
GET    /api/v1/order-items          /api/v1/orderItems
POST   /api/v1/password-reset       /api/v1/passwordReset
```

### 2.7 Environment Variables

```
RULE: UPPER_SNAKE_CASE, prefixed by category

# App
NEXT_PUBLIC_APP_URL=https://app.solaris-empire.com
NEXT_PUBLIC_APP_NAME="Solaris Empire"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email
RESEND_API_KEY=re_...

# External APIs
OPENAI_API_KEY=sk-...
CEREBRTRON_API_URL=https://api.cerebrtron.ai

RULE: NEXT_PUBLIC_ prefix = exposed to browser (safe values ONLY)
      No prefix = server-only (secrets go here)
```

### 2.8 Git Branch Names

```
RULE: type/ticket-short-description

feature/SE-123-user-authentication
bugfix/SE-456-fix-login-redirect
hotfix/SE-789-patch-payment-crash
chore/SE-101-update-dependencies
refactor/SE-202-clean-user-service
docs/SE-303-update-api-docs

Types: feature, bugfix, hotfix, chore, refactor, docs, test
```

---

## 3. FILE RULES (ONE FILE, ONE JOB)

### 3.1 Maximum File Length
- Components: **MAX 200 lines** — if longer, split into smaller components
- Services: **MAX 300 lines** — if longer, split by sub-domain
- Utilities: **MAX 150 lines** per file
- Types: **MAX 200 lines** per file
- Test files: No hard limit but keep focused

### 3.2 One Export Per File (for components)
```typescript
// ✅ CORRECT — one component per file
// file: user-card.tsx
export function UserCard() { ... }

// ❌ WRONG — multiple components in one file
// file: user-stuff.tsx
export function UserCard() { ... }
export function UserList() { ... }
export function UserAvatar() { ... }
```

Exception: Small helper components used only by the main component can live in the same file.

### 3.3 Barrel Exports (index.ts)
Every folder with multiple exports MUST have an `index.ts`:
```typescript
// components/ui/index.ts
export { Button } from "./button"
export { Input } from "./input"
export { Modal } from "./modal"

// Usage in other files:
import { Button, Input, Modal } from "@/components/ui"
```

---

## 4. CODE ARCHITECTURE PATTERNS

### 4.1 Service Pattern (Business Logic)

```typescript
// ✅ CORRECT — services contain business logic
// src/services/user.service.ts

import { userRepository } from "@/repositories/user.repository"
import { emailService } from "@/services/email.service"
import { AppError } from "@/lib/utils/errors"
import type { CreateUserRequest, User } from "@/types"

export const userService = {
  async createUser(data: CreateUserRequest): Promise<User> {
    // Business rule: check if email already exists
    const existing = await userRepository.findByEmail(data.email)
    if (existing) {
      throw new AppError("Email already in use", 409)
    }

    // Business rule: validate company email for enterprise plan
    if (data.plan === "enterprise" && !data.email.endsWith("@company.com")) {
      throw new AppError("Enterprise plan requires company email", 422)
    }

    // Create the user
    const user = await userRepository.create(data)

    // Business rule: send welcome email after creation
    await emailService.sendWelcomeEmail(user.email, user.name)

    return user
  },
}
```

### 4.2 Repository Pattern (Database Access)

```typescript
// ✅ CORRECT — repositories contain ONLY database queries
// src/repositories/user.repository.ts

import { createClient } from "@/lib/supabase/server"
import type { User, CreateUserRequest } from "@/types"

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data
  },

  async create(data: CreateUserRequest): Promise<User> {
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from("users")
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return user
  },

  async findById(id: string): Promise<User | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data
  },
}
```

### 4.3 API Route Pattern

```typescript
// ✅ CORRECT — API routes are thin, delegate to services
// src/app/api/v1/users/route.ts

import { NextRequest, NextResponse } from "next/server"
import { userService } from "@/services/user.service"
import { createUserSchema } from "@/lib/utils/validation"
import { handleApiError } from "@/lib/utils/errors"
import { requireAuth } from "@/lib/supabase/middleware"

// GET /api/v1/users
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const result = await userService.listUsers({ page, limit })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/v1/users
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()

    // Validate input with Zod
    const validated = createUserSchema.parse(body)

    const user = await userService.createUser(validated)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### 4.4 Custom Error Classes

```typescript
// src/lib/utils/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "AppError"
  }
}

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
  constructor(message = "Insufficient permissions") {
    super(message, 403, "FORBIDDEN")
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 422, "VALIDATION_ERROR", details)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT")
  }
}

// API error handler for route handlers
export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code || "ERROR",
          message: error.message,
          details: error.details,
        },
      },
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
          details: error.errors,
        },
      },
      { status: 422 }
    )
  }

  // Unknown error — log and return generic message
  console.error("Unhandled error:", error)
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  )
}
```

---

## 5. GIT WORKFLOW & BRANCHING

### 5.1 Branch Strategy

```
main (production)
  │
  ├── develop (staging/integration)
  │     │
  │     ├── feature/SE-123-user-auth
  │     ├── feature/SE-124-billing-page
  │     └── bugfix/SE-125-fix-login
  │
  └── hotfix/SE-999-critical-fix (branches from main for emergencies)
```

**Rules:**
- `main` = production. Always deployable. NEVER push directly.
- `develop` = staging. Features merge here first.
- Feature branches = one branch per task/ticket.
- Hotfix branches = emergency fixes, branch from `main`, merge to both `main` and `develop`.
- Delete branches after merge.

### 5.2 Pull Request Rules
- Every PR must have a description explaining WHAT and WHY
- Every PR must be reviewed (or reviewed by Claude Code using the review system)
- Every PR must pass CI (tests + lint + type check)
- Squash merge to keep history clean
- PR title follows commit message format

---

## 6. COMMIT MESSAGE STANDARDS

### 6.1 Format (Conventional Commits)

```
type(scope): short description

[optional longer description]

[optional footer: BREAKING CHANGE, ticket reference]
```

### 6.2 Types

```
feat:     New feature                    feat(auth): add Google OAuth login
fix:      Bug fix                        fix(billing): correct tax calculation
docs:     Documentation only             docs(api): update endpoint docs
style:    Formatting (no logic change)   style(ui): fix button alignment
refactor: Code change (no new feature)   refactor(users): extract validation
perf:     Performance improvement        perf(queries): add index on user_email
test:     Adding/fixing tests            test(auth): add login edge cases
chore:    Build, deps, config            chore(deps): update next to 15.x
ci:       CI/CD changes                  ci(deploy): add staging workflow
```

### 6.3 Rules
- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor" not "moves cursor")
- First line MAX 72 characters
- Reference ticket numbers: `feat(auth): add OAuth login [SE-123]`
- NEVER use vague messages like "fix stuff", "update", "wip", "misc"

---

## 7. ENVIRONMENT & CONFIGURATION

### 7.1 .env.example (MUST exist in every project)

```bash
# ==============================================
# APPLICATION
# ==============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Project Name"
NODE_ENV=development

# ==============================================
# SUPABASE
# ==============================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ==============================================
# STRIPE
# ==============================================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ==============================================
# EMAIL
# ==============================================
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
```

### 7.2 Config Validation (runs at app startup)

```typescript
// src/lib/utils/env.ts
import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  RESEND_API_KEY: z.string().min(1),
})

export const env = envSchema.parse(process.env)
```

---

## 8. API DESIGN STANDARDS

### 8.1 Response Format (ALL APIs follow this)

```typescript
// Success response
{
  "data": { ... },              // The actual data
  "meta": {                     // Pagination info (for lists)
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",  // Machine-readable error code
    "message": "Email is invalid", // Human-readable message
    "details": { ... }           // Optional extra info
  }
}
```

### 8.2 Status Code Usage

```
200 OK           — Successful GET, PUT, PATCH, DELETE
201 Created      — Successful POST that creates a resource
204 No Content   — Successful DELETE with no body

400 Bad Request  — Malformed request syntax
401 Unauthorized — No valid authentication
403 Forbidden    — Authenticated but not authorized
404 Not Found    — Resource does not exist
409 Conflict     — Resource already exists (duplicate)
422 Unprocessable— Valid syntax but invalid data (validation error)
429 Too Many     — Rate limit exceeded

500 Internal     — Unexpected server error (NEVER expose details)
503 Unavailable  — Service temporarily down
```

---

## 9. DATABASE STANDARDS

### 9.1 Every Table MUST Have

```sql
CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... your columns ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ  -- Soft delete (nullable = not deleted)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON example
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 9.2 Migration File Naming

```
Format: YYYYMMDDHHMMSS_description.sql

20260401000000_create_users_table.sql
20260401000001_create_orders_table.sql
20260401000002_add_user_email_index.sql
20260401000003_add_rls_policies.sql
20260402000000_create_subscriptions_table.sql
```

### 9.3 RLS Policy Standard (Supabase)

```sql
-- ALWAYS enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy naming: action_tablename_role
CREATE POLICY select_users_authenticated ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY insert_users_authenticated ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY update_users_own ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin can see everything
CREATE POLICY select_users_admin ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
```

---

## 10. ERROR HANDLING ARCHITECTURE

### 10.1 The Error Handling Pyramid

```
LAYER 1 — GLOBAL (catches everything that slips through)
  ├── Next.js error.tsx / global-error.tsx
  ├── Unhandled promise rejection handler
  └── Global API error middleware

LAYER 2 — ROUTE/PAGE LEVEL
  ├── try/catch in every API route handler
  └── Error boundaries around page sections

LAYER 3 — SERVICE LEVEL
  ├── Throw specific AppError subclasses
  └── Catch and transform external service errors

LAYER 4 — FUNCTION LEVEL
  ├── Validate inputs at entry point
  └── Handle expected failure cases
```

### 10.2 Rules

```
1. NEVER use empty catch blocks: catch (e) { }
2. NEVER catch and just console.log: catch (e) { console.log(e) }
3. ALWAYS include context in errors: what operation, what data
4. ALWAYS use typed errors (AppError subclasses), never throw strings
5. ALWAYS handle errors at the appropriate layer
6. NEVER expose internal error details to the client
7. ALWAYS log the full error server-side
8. ALWAYS return a user-friendly message client-side
```

---

## 11. LOGGING STANDARDS

### 11.1 Log Levels

```
ERROR  — Something broke. Needs immediate attention.
         "Failed to process payment for order ORD-123"

WARN   — Something unexpected but recovered from.
         "Retry 2/3 for Stripe API call"

INFO   — Important business events.
         "User USR-456 upgraded to Pro plan"
         "Order ORD-123 shipped"

DEBUG  — Detailed info for troubleshooting (dev only).
         "Cache miss for user profile USR-456"
```

### 11.2 Structured Logging Format

```typescript
// ✅ CORRECT — structured, searchable
logger.info("User created", {
  userId: user.id,
  email: user.email,
  plan: user.plan,
  duration: "45ms",
})

// ❌ WRONG — unstructured, unsearchable
console.log("User " + user.email + " was created on plan " + user.plan)
```

---

## 12. AUTHENTICATION & AUTHORIZATION PATTERNS

### 12.1 Middleware Pattern

```typescript
// src/middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/", "/login", "/register", "/pricing", "/about"]
const AUTH_ROUTES = ["/login", "/register"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create Supabase client
  const supabase = createServerClient(/* config */)
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect authenticated users away from auth pages
  if (session && AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect unauthenticated users to login
  if (!session && !PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}
```

---

## 13. TESTING STANDARDS

### 13.1 Test File Location

```
Source file:  src/services/user.service.ts
Test file:    tests/unit/services/user.service.test.ts

Source file:  src/app/api/v1/users/route.ts
Test file:    tests/integration/api/users.test.ts

Source file:  User registration flow
Test file:    tests/e2e/auth.spec.ts
```

### 13.2 Test Naming Convention

```typescript
describe("UserService", () => {
  describe("createUser", () => {
    it("should create a user with valid data", async () => { ... })
    it("should throw ConflictError if email already exists", async () => { ... })
    it("should send welcome email after creation", async () => { ... })
    it("should reject enterprise plan without company email", async () => { ... })
  })
})
```

**Pattern:** `it("should [expected behavior] when [condition]")`

---

## 14. FRONTEND STANDARDS (React/Next.js)

### 14.1 Component Structure (consistent order inside every component)

```typescript
// 1. Imports (see import ordering section)
import { useState, useEffect } from "react"
import { Button } from "@/components/ui"
import type { User } from "@/types"

// 2. Type definition
interface UserCardProps {
  user: User
  onEdit: (id: string) => void
}

// 3. Component function
export function UserCard({ user, onEdit }: UserCardProps) {
  // 3a. Hooks (all hooks at the top, in consistent order)
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  // 3b. Derived values / computed state
  const fullName = `${user.firstName} ${user.lastName}`
  const isAdmin = user.role === "admin"

  // 3c. Effects
  useEffect(() => {
    // ...
  }, [])

  // 3d. Event handlers
  function handleEdit() {
    onEdit(user.id)
  }

  function handleToggle() {
    setIsExpanded((prev) => !prev)
  }

  // 3e. Early returns (loading, error, empty states)
  if (!user) return null

  // 3f. Render
  return (
    <div>
      <h3>{fullName}</h3>
      <Button onClick={handleEdit}>Edit</Button>
    </div>
  )
}
```

### 14.2 State Management Rules

```
LOCAL state (useState):       UI-only state (modals, tooltips, form inputs)
SERVER state (React Query):   Data from the API (users, orders, etc.)
URL state (searchParams):     Filters, pagination, search queries
GLOBAL state (Context/Zustand): Auth session, theme, toast notifications

NEVER put server data in useState. Use React Query / SWR / Server Components.
```

---

## 15. TYPESCRIPT STANDARDS

### 15.1 Strict Mode (non-negotiable)

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 15.2 Type Rules

```typescript
// ✅ NEVER use 'any'
function processData(data: any) { }          // ❌ FORBIDDEN

// ✅ Use 'unknown' when type is truly unknown, then narrow
function processData(data: unknown) {        // ✅ CORRECT
  if (typeof data === "string") {
    // TypeScript now knows it's a string
  }
}

// ✅ Use explicit return types on public functions
export function calculateTotal(items: CartItem[]): number { ... }

// ✅ Use string unions instead of enums
type Status = "active" | "inactive" | "suspended"   // ✅ PREFERRED
enum Status { Active, Inactive, Suspended }          // ❌ AVOID
```

---

## 16. IMPORT ORDERING

Every file MUST follow this exact import order, with blank lines between groups:

```typescript
// GROUP 1: External/node packages
import { useState, useEffect } from "react"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// GROUP 2: Internal aliases (@/ paths) — libraries and config
import { createClient } from "@/lib/supabase/server"
import { env } from "@/lib/utils/env"

// GROUP 3: Internal aliases — services and repositories
import { userService } from "@/services/user.service"
import { userRepository } from "@/repositories/user.repository"

// GROUP 4: Internal aliases — components
import { Button, Input } from "@/components/ui"
import { UserCard } from "@/components/features/users"

// GROUP 5: Internal aliases — hooks, utils, config
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/utils/formatting"
import { MAX_PAGE_SIZE } from "@/lib/utils/constants"

// GROUP 6: Types (always last, always with 'type' keyword)
import type { User, CreateUserRequest } from "@/types"
import type { UserCardProps } from "./types"

// GROUP 7: Styles (if any)
import "./styles.css"
```

---

## 17. COMMENT & DOCUMENTATION STANDARDS

### 17.1 When to Comment

```typescript
// ✅ COMMENT: Explain WHY, not WHAT
// We retry 3 times because Stripe's API has intermittent 503s
// during their maintenance windows (usually 2-4 AM UTC)
const MAX_RETRIES = 3

// ✅ COMMENT: Business rules that aren't obvious from code
// Enterprise customers get NET-30 payment terms per their contract
if (customer.plan === "enterprise") {
  invoice.dueDate = addDays(invoice.createdAt, 30)
}

// ❌ DON'T COMMENT: What the code obviously does
// Increment the counter  <-- useless comment
counter++

// ❌ DON'T COMMENT: Leave commented-out code
// const oldFunction = () => { ... }  <-- DELETE this
```

### 17.2 JSDoc for Public Functions

```typescript
/**
 * Creates a new subscription for a user.
 *
 * Validates the selected plan, creates a Stripe checkout session,
 * and records the pending subscription in the database.
 *
 * @param userId - The ID of the user subscribing
 * @param planId - The ID of the pricing plan
 * @returns The Stripe checkout session URL
 * @throws {NotFoundError} If user or plan doesn't exist
 * @throws {ConflictError} If user already has an active subscription
 */
async function createSubscription(
  userId: string,
  planId: string
): Promise<string> {
  // ...
}
```

### 17.3 TODO Format

```typescript
// TODO(SE-456): Implement rate limiting on this endpoint
// FIXME(SE-789): Race condition when two users checkout simultaneously  
// HACK: Stripe doesn't support XYZ, so we work around it by...
// NOTE: This runs in a cron job every 5 minutes, keep it fast

// ❌ NEVER: TODO without ticket number or context
// TODO: fix this later
```

---

## 18. SECURITY STANDARDS

### 18.1 Input Validation (EVERY endpoint)

```typescript
// Use Zod for ALL input validation
import { z } from "zod"

export const createUserSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  name: z.string().min(1).max(100).trim(),
  password: z.string().min(8).max(128),
  role: z.enum(["member", "admin"]).default("member"),
})

// Validate at the API boundary
const validated = createUserSchema.parse(body)
```

### 18.2 Never Trust Client Data

```
1. Validate on the server, NEVER only on the client
2. Sanitize all text inputs (trim, escape HTML)
3. Verify permissions on EVERY request (not just UI hiding)
4. Validate file types by content, not just extension
5. Set maximum request body size limits
6. Rate limit all endpoints (especially auth)
```

---

## 19. PERFORMANCE STANDARDS

### 19.1 Database Query Rules

```
1. ALWAYS use pagination (default 20, max 100)
2. NEVER use SELECT * — select only needed columns
3. ALWAYS add indexes for columns used in WHERE/JOIN/ORDER BY
4. NEVER query inside a loop (N+1 problem)
5. Use .single() when expecting one result
6. Set query timeouts (30 seconds max)
```

### 19.2 Frontend Performance Rules

```
1. Images: Use next/image (auto WebP, lazy loading, sizing)
2. Fonts: Use next/font (no layout shift, self-hosted)
3. Imports: Dynamic import for heavy components
4. Lists: Virtualize anything over 100 items
5. Memoization: useMemo for expensive calculations
6. Debounce: Search inputs, resize handlers
7. Bundle: Keep initial JS under 200KB
```

---

## 20. CODE FORMATTING & LINTING

### 20.1 Prettier Config

```json
// .prettierrc
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

### 20.2 ESLint Config (essential rules)

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    "next/core-web-vitals",
    "next/typescript",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": "error",
    "no-nested-ternary": "error",
  },
}
```

---

## 21. DEPENDENCY MANAGEMENT

### 21.1 Rules

```
1. ALWAYS commit package-lock.json / yarn.lock
2. Pin exact versions for critical deps: "next": "15.2.0" not "^15.2.0"
3. Run npm audit weekly
4. Review EVERY new dependency before adding:
   - Is it actively maintained?
   - How many weekly downloads?
   - How many open issues?
   - What is the bundle size?
   - Can we write this ourselves in < 50 lines?
5. NEVER install packages globally in the project
6. Keep devDependencies separate from dependencies
```

---

## 22. CI/CD STANDARDS

### 22.1 Every PR Must Pass

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [develop, main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint          # ESLint
      - run: npm run type-check    # TypeScript compiler
      - run: npm run test          # Unit + integration tests
      - run: npm run build         # Verify it builds
```

---

## 23. PROJECT SETUP CHECKLIST

When starting ANY new Solaris Empire project, complete this checklist:

```
[ ] Initialize git repo
[ ] Create folder structure per Section 1
[ ] Configure TypeScript (strict mode)
[ ] Configure ESLint + Prettier
[ ] Create .env.example
[ ] Set up Supabase project
[ ] Enable RLS on all tables
[ ] Create initial migration
[ ] Set up error handling (AppError classes)
[ ] Set up logging utility
[ ] Create API response helpers
[ ] Set up authentication middleware
[ ] Create README.md with setup instructions
[ ] Create CLAUDE.md with project-specific instructions
[ ] Copy this CODING_STANDARDS.md into project
[ ] Set up CI pipeline (.github/workflows/ci.yml)
[ ] Create PR template
[ ] Configure deployment pipeline
[ ] Add health check endpoint
[ ] Validate env vars at startup
```

---

## SUMMARY: THE COMMANDMENTS

```
I.    Every file has ONE job.
II.   Every function has ONE purpose.
III.  Every variable has a CLEAR name.
IV.   Every input is VALIDATED.
V.    Every error is HANDLED.
VI.   Every query is INDEXED.
VII.  Every secret is in ENV VARS.
VIII. Every change goes through a PR.
IX.   Every commit tells a STORY.
X.    Every feature has TESTS.
```

---

**"Structure is not the enemy of creativity. Structure is the foundation that makes creative solutions possible."**

— Solaris Empire Inc. Engineering Standards, v1.0

---

*Document Version: 1.0*
*Created: April 2026*
*Classification: Internal — Solaris Empire Inc.*
*Applies To: ALL projects (CEREBRTRON, Webcrafts, UK Taxi, Client Work)*
