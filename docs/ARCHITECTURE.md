# Architecture

## System Overview

UK Grocery Store is a multi-vendor grocery marketplace built with Next.js (App Router). Customers browse products from multiple vendors, place orders with Stripe Checkout, and receive scheduled deliveries. Vendors manage their own products, orders, and payouts through a dedicated dashboard. Admins oversee the entire platform including user management, order fulfillment, content, and vendor approvals.

Live: https://uk-grocery-store.vercel.app

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│   React 19 Components  |  Zustand Stores (cart, ui)             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APP ROUTER                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ (shop) Pages │  │ (account)    │  │ admin/ | vendor/      │  │
│  │ Storefront   │  │ User Pages   │  │ Dashboard Pages       │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  API Routes (src/app/api/)                │   │
│  │  products | search | reviews | orders | coupons | admin   │   │
│  │  vendor | webhooks | newsletter | delivery | chat | ...   │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────┼───────────────────────────────┐   │
│  │                   Service / Auth Layer                     │   │
│  │  requireAuth() | requireAdmin() | requireVendor()         │   │
│  │  Validation (Zod) | Sanitization | Rate Limiting          │   │
│  │  Cache (tag-based) | Error Tracking (Sentry)              │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                           │
│                                                                 │
│  ┌────────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │   Supabase     │  │    Stripe     │  │     Resend       │   │
│  │  PostgreSQL    │  │  Checkout     │  │  Transactional   │   │
│  │  Auth (JWT)    │  │  Connect      │  │  Email           │   │
│  │  RLS Policies  │  │  Webhooks     │  │                  │   │
│  │  RPC Functions │  │  Transfers    │  │                  │   │
│  └────────────────┘  └───────────────┘  └──────────────────┘   │
│                                                                 │
│  ┌────────────────┐  ┌───────────────┐                         │
│  │   Sentry       │  │   Vercel      │                         │
│  │  Monitoring    │  │  Hosting/CDN  │                         │
│  └────────────────┘  └───────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Flow

```
Route (page/api) --> Component --> Hook --> Service --> Repository --> Database
```

| Layer       | Location               | Responsibility                              |
|-------------|------------------------|---------------------------------------------|
| Route       | `src/app/`             | URL mapping, request/response handling       |
| Component   | `src/components/`      | UI rendering, user interaction               |
| Hook        | `src/hooks/`           | Client-side state and side effects           |
| Service     | `src/lib/`, `src/actions/` | Business logic, validation, auth          |
| Repository  | Supabase client calls  | Data access, query building                  |
| Database    | Supabase PostgreSQL    | Storage, RLS, RPC functions, triggers        |

## Tech Decisions

| Decision              | Choice                  | Rationale                                                              |
|-----------------------|-------------------------|------------------------------------------------------------------------|
| Framework             | Next.js 16.1.3          | App Router with RSC for performance; API routes for backend            |
| UI Library            | React 19                | Latest concurrent features, server components                          |
| Language              | TypeScript              | Type safety across full stack                                          |
| Database              | Supabase (PostgreSQL)   | Managed Postgres with built-in auth, RLS, realtime, and RPC functions  |
| Authentication        | Supabase Auth           | JWT-based, integrates with RLS; supports email/password and OAuth      |
| Payments              | Stripe                  | Checkout Sessions for customers; Connect for vendor marketplace        |
| State Management      | Zustand                 | Lightweight, no boilerplate, works well with RSC                       |
| Styling               | TailwindCSS 4           | Utility-first, fast iteration, consistent design                       |
| Email                 | Resend                  | Developer-friendly transactional email API                             |
| Unit Testing          | Vitest                  | Fast, ESM-native, compatible with Next.js                              |
| E2E Testing           | Playwright              | Cross-browser, reliable, built-in assertions                           |
| Error Monitoring      | Sentry                  | Real-time error tracking with source maps via instrumentation.ts       |
| Hosting               | Vercel                  | Native Next.js support, edge network, preview deployments              |
| Caching               | Custom (tag-based)      | In-memory with TTL and tag-based invalidation for fine-grained control |

## Data Flow

### Read Path

```
Browser --> Next.js Route/RSC --> Cache Check
                                    |
                          Cache Hit? --> Return cached data
                                    |
                          Cache Miss --> Supabase query (RLS applied)
                                    |
                                 Store in cache with TTL + tags
                                    |
                                 Return JSON response
```

### Write Path

```
Browser --> API Route --> Auth Check (requireAuth/requireAdmin/requireVendor)
                            |
                      Zod Validation --> 400 if invalid
                            |
                      Input Sanitization (XSS prevention)
                            |
                      Supabase Mutation (via supabaseAdmin for webhooks, createClient for user ops)
                            |
                      Cache Invalidation (by tag)
                            |
                      Audit Log (admin actions)
                            |
                      Return JSON response
```

## Auth Flow

```
1. User signs in via Supabase Auth (email/password or OAuth)
2. Supabase returns JWT stored in HTTP-only cookie
3. API routes extract session via createServerClient (SSR cookie adapter)
4. Auth helpers verify role:
   - requireAuth()   --> Returns user or 401
   - requireAdmin()  --> Returns admin user or 403
   - requireVendor() --> Returns vendor user + vendor record or 403
5. RLS policies enforce data access at the database level
6. New signups trigger handle_new_user() to create a profiles row
```

### Role Model

| Role     | Access                                    |
|----------|-------------------------------------------|
| customer | Storefront, own profile/orders/addresses  |
| admin    | Full admin dashboard, all data            |
| vendor   | Vendor dashboard, own products/orders     |

## Payment Flow

```
1. Customer adds items to cart (Zustand store, client-side)
2. Customer proceeds to checkout
3. Server action creates Stripe Checkout Session
   - Line items with price_pence converted to Stripe format
   - Delivery fee included
   - Coupon discount applied if valid
4. Customer redirected to Stripe Checkout
5. Stripe sends checkout.session.completed webhook
6. Webhook handler (idempotent via stripe_checkout_session_id uniqueness):
   a. Creates order + order_items in database
   b. Decrements stock via decrement_stock() RPC (atomic)
   c. Increments coupon usage via increment_coupon_usage() RPC (row-level locking)
   d. For vendor products: creates vendor_orders and Stripe Connect transfers
      - Transfer amount = total - commission (commission_rate on vendor record)
   e. Sends order confirmation email via Resend
7. Customer redirected to order confirmation page
```

## Infrastructure

| Environment | Platform | Branch | URL                                    |
|-------------|----------|--------|----------------------------------------|
| Production  | Vercel   | main   | https://uk-grocery-store.vercel.app    |

Git repository: https://github.com/baptistkevin-ctrl/uk-website

### Deploy

- **Automatic:** Push to `main` triggers Vercel deployment.
- **Manual:** `npx vercel --prod --yes`

## Security Layers

| Layer                | Implementation                                                    |
|----------------------|-------------------------------------------------------------------|
| Authentication       | Supabase Auth (JWT in HTTP-only cookies)                          |
| Authorization        | `requireAuth()`, `requireAdmin()`, `requireVendor()` guards       |
| Row-Level Security   | RLS policies on all tables; users see only their own data         |
| Input Validation     | Zod schemas on all mutation endpoints                             |
| Input Sanitization   | XSS prevention via `sanitizeText()`, `sanitizeRichHtml()`, `sanitizeUrl()` |
| Rate Limiting        | Per-IP rate limits on search (30/min), reviews, tracking (5/min), coupons (20/min) |
| Field Whitelisting   | `ALLOWED_FIELDS` Set on mutation endpoints prevents mass assignment |
| SQL Injection        | Parameterized queries via Supabase client (no raw SQL in app code) |
| Webhook Security     | Stripe signature verification; idempotency via DB uniqueness       |
| Error Handling       | Generic error messages to clients; internal details logged to Sentry |
| CORS / Headers       | Cache-Control headers; Vercel edge security headers                |
| Audit Logging        | Admin product/order actions logged with user, IP, and timestamp    |
