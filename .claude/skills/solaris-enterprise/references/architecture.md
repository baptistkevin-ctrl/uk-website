# Project Architecture

## Folder Structure (Next.js + Supabase)

```
src/
├── app/                          # ROUTES — URL mapping only
│   ├── (auth)/                   # Auth pages (login, register, forgot-password)
│   │   └── layout.tsx            # Auth layout (no sidebar)
│   ├── (dashboard)/              # Protected pages
│   │   └── layout.tsx            # Dashboard layout (with sidebar)
│   ├── (marketing)/              # Public pages (home, pricing, about)
│   │   └── layout.tsx            # Marketing layout
│   ├── api/v1/                   # API routes (versioned)
│   │   ├── auth/                 # login/, register/, logout/
│   │   ├── users/                # route.ts + [id]/route.ts
│   │   ├── webhooks/stripe/      # Stripe webhook handler
│   │   └── health/               # Health check endpoint
│   ├── layout.tsx                # Root layout
│   ├── error.tsx                 # Error boundary
│   ├── not-found.tsx             # 404 page
│   └── global-error.tsx          # Global error boundary
│
├── components/                   # UI LAYER — how things LOOK
│   ├── ui/                       # Atomic: button, input, modal, card, badge
│   ├── layout/                   # Structural: header, sidebar, footer, nav
│   ├── forms/                    # Form components with validation
│   ├── features/                 # Feature-grouped (dashboard/, users/, billing/)
│   └── providers/                # Context providers (auth, theme, toast)
│
├── hooks/                        # Custom React hooks (use-auth, use-debounce)
│
├── services/                     # BUSINESS LAYER — how things WORK
│                                 # ALL business rules live here
│
├── repositories/                 # DATA LAYER — how things are STORED
│                                 # ONLY database queries, no logic
│
├── lib/                          # INFRASTRUCTURE — external tool config
│   ├── supabase/                 # client.ts, server.ts, admin.ts, middleware.ts
│   ├── stripe/                   # client.ts, webhooks.ts, products.ts
│   ├── email/                    # client.ts + templates/
│   ├── api/                      # fetch wrapper, endpoints, types
│   └── utils/                    # errors.ts, logger.ts, validation.ts, formatting.ts, constants.ts, cn.ts
│
├── types/                        # TypeScript definitions (database.ts, api.ts, common.ts)
├── config/                       # App config (site.ts, navigation.ts, plans.ts, features.ts)
├── styles/globals.css            # Tailwind imports + custom CSS
└── middleware.ts                 # Next.js middleware (auth, redirects)
```

## Supporting Folders (Project Root)

```
.github/workflows/                # CI/CD (ci.yml, deploy-staging.yml, deploy-production.yml)
.github/PULL_REQUEST_TEMPLATE.md
.github/ISSUE_TEMPLATE/           # bug_report.md, feature_request.md
supabase/migrations/              # Numbered SQL migrations
supabase/seed.sql                 # Dev seed data
tests/unit/                       # Mirrors src/services and src/utils
tests/integration/                # API endpoint tests
tests/e2e/                        # Playwright browser tests
tests/fixtures/                   # Test data factories
docs/                             # ARCHITECTURE.md, API.md, DATABASE.md, DEPLOYMENT.md, RUNBOOK.md, ONBOARDING.md
scripts/                          # Utility scripts
public/                           # Static assets (fonts/, images/, icons/)
```

## Required Root Files

```
.env.example          .eslintrc.js        .prettierrc
.gitignore            tsconfig.json       next.config.js
tailwind.config.ts    vitest.config.ts    playwright.config.ts
package.json          package-lock.json   CLAUDE.md
README.md             CONTRIBUTING.md     CHANGELOG.md
```

## Layer Rules

```
LAYER           RESPONSIBILITY              NEVER DOES
─────────────────────────────────────────────────────────────
app/ (routes)   URL mapping, page rendering  Business logic
components/     Display UI, handle events    Database access
hooks/          Reusable React logic         API calls directly
services/       Business rules, validation   Render UI
repositories/   Database queries             Business logic
lib/            External tool configuration  Business logic
types/          Type definitions             Runtime code
config/         App settings                 Business logic
```

## Barrel Exports

Every folder with multiple exports MUST have an index.ts:

```typescript
// components/ui/index.ts
export { Button } from "./button"
export { Input } from "./input"
export { Modal } from "./modal"
```

## File Size Limits

- Components: MAX 200 lines (split if larger)
- Services: MAX 300 lines (split by sub-domain)
- Utilities: MAX 150 lines per file
- Types: MAX 200 lines per file
- One primary export per component file
