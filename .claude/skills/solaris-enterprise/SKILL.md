---
name: solaris-enterprise
description: "Enterprise-grade coding standards, project structure, and documentation system for all Solaris Empire projects. ALWAYS use this skill before writing ANY code, creating ANY file, setting up ANY project, reviewing ANY code, or generating ANY documentation. This skill triggers for: starting new projects, writing components, creating API routes, database work, writing tests, code reviews, setting up CI/CD, creating documentation, naming files/variables/functions, structuring folders, error handling, security checks, performance optimization, TypeScript configuration, React patterns, Next.js development, Supabase setup, Stripe integration, git workflow, commit messages, PR creation, deployment, and literally any coding task. If you are about to write code for a Solaris Empire project, READ THIS SKILL FIRST. No exceptions."
---

# Solaris Empire Enterprise Engineering System

This skill contains the complete engineering standards for Solaris Empire Inc.
Read the relevant reference files BEFORE writing any code.

## Quick Reference — Which File to Read

| Task | Read This Reference File |
|------|--------------------------|
| Starting a new project | `references/architecture.md` then `references/documentation.md` |
| Writing any code | `references/naming.md` then `references/code-patterns.md` |
| Database work (tables, queries, migrations) | `references/database.md` |
| API endpoints | `references/code-patterns.md` (Section: API Route Pattern) |
| React components | `references/code-patterns.md` (Section: Component Pattern) |
| Security concerns | `references/security.md` |
| Writing tests | `references/testing.md` |
| Code review | `references/review.md` |
| Creating documentation | `references/documentation.md` |
| Setting up project structure | `references/architecture.md` |
| AI/LLM integration (CEREBRTRON) | `references/ai-integration.md` |
| Multi-vendor / multi-tenant | `references/multi-tenancy.md` |
| Payments, subscriptions, Stripe | `references/payments.md` |
| Live updates, real-time, presence | `references/realtime.md` |
| Background jobs, async processing | `references/background-jobs.md` |
| Advanced patterns & architecture | `references/world-class.md` |
| Error handling (Result pattern) | `references/world-class.md` (Section 1) |
| State machines for complex flows | `references/world-class.md` (Section 4) |
| Feature flags & config system | `references/world-class.md` (Section 7) |
| Self-healing & resilience | `references/world-class-v2.md` |
| Multi-step transactions (Sagas) | `references/world-class-v2.md` (Section 8) |
| Idempotency & safe retries | `references/world-class-v2.md` (Section 6) |
| Permission system | `references/world-class-v2.md` (Section 5) |

**RULE: Always read `references/naming.md` before writing ANY code. Naming is checked on every single file, variable, function, type, and database column.**

**RULE: For any NEW feature, read `references/world-class.md` FIRST. Apply the Result pattern, branded types, state machines, and graceful degradation. These are what separate Solaris from everyone else.**

## Core Principles (memorize these)

```
1. SECURE BY DEFAULT    — Every input is an attack. Every endpoint needs auth.
2. FAIL GRACEFULLY      — Every async call has error handling. Users see helpful messages.
3. OBSERVABLE ALWAYS    — Structured logging on all critical paths.
4. SCALE FROM DAY ONE   — Paginate everything. Cache wisely. Index properly.
5. SIMPLE BEATS CLEVER  — If a junior dev can't understand it in 60 seconds, refactor.
6. TEST OR IT DOESN'T EXIST — Untested code is broken code we haven't found yet.
7. DOCUMENT THE WHY     — Code shows WHAT. Comments explain WHY.
8. AUTOMATE EVERYTHING  — Linting, formatting, testing, deploying — all automated.
9. SMALL CHANGES ALWAYS — One feature per branch. Small PRs find bugs.
10. OWN YOUR CODE       — You wrote it, you monitor it, you fix it.
```

## Data Flow (NEVER break this chain)

```
[Route/Page] → [Component] → [Hook] → [Service] → [Repository] → [Database]

Components  = How things LOOK (UI only, no business logic)
Hooks       = Reusable React logic
Services    = How things WORK (business rules, THE BRAIN)
Repositories = How things are STORED (database queries only)
Lib         = External tool setup (Supabase, Stripe, email)
Types       = What things ARE (TypeScript definitions)
Config      = What things are SET TO (app settings)
```

**Golden Rules:**
- Components NEVER touch the database
- Services NEVER render UI
- Repositories NEVER contain business logic
- Each layer talks ONLY to the layer below it
- NEVER skip layers

## Naming Quick Reference (full details in references/naming.md)

```
Files/folders:       kebab-case          user-profile.tsx
Variables/functions:  camelCase           userName, handleSubmit
React components:    PascalCase (code)   UserCard, DashboardStats
Types/interfaces:    PascalCase          User, CreateUserRequest
Constants:           UPPER_SNAKE_CASE    MAX_RETRIES, API_BASE_URL
DB tables/columns:   snake_case          users, first_name
API endpoints:       kebab-case plural   /api/v1/order-items
Env variables:       UPPER_SNAKE_CASE    STRIPE_SECRET_KEY
Git branches:        type/ticket-desc    feature/SE-123-user-auth
Booleans:            is/has/can prefix   isLoading, hasPermission
Functions:           start with verb     getUser, handleClick
```

## TypeScript Rules (non-negotiable)

- `strict: true` in tsconfig — always
- NEVER use `any` — use `unknown` and narrow
- Explicit return types on all exported functions
- Use string union types, not TypeScript enums
- Use `import type` for type-only imports
- Zod validation at every API boundary
- Derive types from Zod schemas when possible

## Error Handling Rules

- Every async operation wrapped in try/catch
- Use custom error classes (AppError, NotFoundError, etc.)
- NEVER use empty catch blocks
- NEVER expose internal errors to clients
- Log full errors server-side, return safe messages client-side
- API routes use a single handleApiError() function

## API Response Format (every endpoint)

```typescript
// Success
{ "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 156 } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

## Status Codes

```
200 OK — GET/PUT/PATCH/DELETE success    400 Bad Request
201 Created — POST success               401 Unauthorized
204 No Content — DELETE no body          403 Forbidden
                                         404 Not Found
                                         409 Conflict (duplicate)
                                         422 Validation Error
                                         429 Rate Limited
                                         500 Internal Error
```

## Database Quick Rules (full details in references/database.md)

- Every table: id, created_at, updated_at, deleted_at
- Money: integer cents (NEVER float)
- RLS enabled on EVERY Supabase table
- Index every WHERE, JOIN, ORDER BY column
- Parameterized queries only (never string concat)
- Migrations named: YYYYMMDDHHMMSS_description.sql

## Security Quick Rules (full details in references/security.md)

- All secrets in environment variables (never in code)
- .env in .gitignore, .env.example committed
- Zod validation on every API input
- Auth check on every non-public endpoint
- CORS configured (not wildcard in production)
- Passwords hashed with bcrypt (cost 12+)
- No secrets in NEXT_PUBLIC_ variables
- Rate limiting on auth endpoints

## Git Commit Format

```
type(scope): description [SE-ticket]

Types: feat, fix, refactor, perf, test, docs, style, chore, ci
Example: feat(auth): add Google OAuth login [SE-123]
```

## New Project Setup

When starting ANY new project, read `references/architecture.md` for the full folder structure, then `references/documentation.md` to generate all required documentation files.

Required files for every project:
```
README.md, CONTRIBUTING.md, CHANGELOG.md, CLAUDE.md, .env.example
docs/ARCHITECTURE.md, docs/API.md, docs/DATABASE.md
docs/DEPLOYMENT.md, docs/RUNBOOK.md, docs/ONBOARDING.md
.github/PULL_REQUEST_TEMPLATE.md
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/workflows/ci.yml
```

## Code Review

When asked to review code, read `references/review.md` and apply all 12 review lenses:

1. Security Chief — injections, auth, secrets
2. Performance Architect — N+1, indexes, Big O
3. Reliability Engineer — error handling, resilience
4. Code Quality Lead — SOLID, clean code, DRY
5. Type Safety Engineer — no any, Zod, strict mode
6. Testing Commander — coverage, quality
7. Database Architect — schema, migrations, RLS
8. API Design Reviewer — REST, status codes
9. Frontend Architect — components, a11y, state
10. DevOps Engineer — config, CI/CD
11. Documentation Reviewer — README, JSDoc
12. Business Logic Auditor — requirements, scale

## The Solaris Way (What Makes Us Different)

Read `references/world-class.md` for full implementation details. These patterns
are MANDATORY on every Solaris project:

1. **Result Pattern** — functions return `{ ok: true, data }` or `{ ok: false, error }` instead of throwing. Makes error handling impossible to forget.
2. **Branded Types** — `UserId`, `OrderId`, `Cents` are different types. You can NEVER accidentally pass the wrong ID.
3. **Vertical Slices** — large features organized by domain, not by layer. Each feature is self-contained.
4. **State Machines** — complex flows (orders, payments, onboarding) use explicit state machines. Impossible states become impossible.
5. **Invariant Assertions** — guard conditions that catch "should never happen" bugs instantly.
6. **Pipeline Pattern** — compose operations cleanly instead of deeply nested calls.
7. **Smart Config** — centralized, validated, environment-aware config with Zod.
8. **Audit Trail** — track WHO did WHAT and WHEN on every important action.
9. **Graceful Degradation** — when external services fail, fall back instead of crash.
10. **Solaris ID System** — prefixed readable IDs (`usr_`, `ord_`, `inv_`) instead of raw UUIDs.
11. **Defensive Coding Checklist** — verify edge cases, error recovery, security, and performance before every ship.

Read `references/world-class-v2.md` for these INVENTED systems:

12. **Self-Healing Operations** — detect failures and auto-recover with retry, compensation, and fallback strategies.
13. **Time-Travel State System** — store every state change as an event. Replay to any point in time for debugging.
14. **Dependency Firewall** — isolate external services behind adapters. Stripe/PayPal/anything can be swapped in one line.
15. **Request Context Propagation** — every log automatically carries requestId, userId, traceId. One search finds everything.
16. **Composable Permissions** — build complex permission rules from simple blocks: `canEdit = all(isAuth, any(isOwner, isAdmin), isActive)`.
17. **Idempotency Shield** — every critical operation is safe to execute twice. Network failures and double-clicks cannot cause duplicates.
18. **Smart Health System** — check every component every 30 seconds. Know when Stripe is slow BEFORE users notice.
19. **Operation Saga** — multi-step transactions with automatic rollback. No more half-created entities.
20. **Code Complexity Guardian** — CI blocks code that exceeds complexity limits. Keep code simple by force.
21. **Durable Promise System** — critical operations survive server crashes. Written to DB before execution, finished by background jobs.

## Context: Who is Kevin

Kevin Baptist is the Founder & CEO of Solaris Empire Inc. He is a brilliant inventor and founder who is early in his coding journey. When writing code:
- Explain every decision in simple English
- Never skip steps or assume knowledge
- Write complete working code (never pseudocode)
- Include comments explaining WHY
- Be his technical co-founder — protect him from bad decisions
