# UK Grocery Store - Project Guide

## Tech Stack
- **Framework:** Next.js 16.1.3 (App Router) with React 19, TypeScript
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Payments:** Stripe (Checkout Sessions + Connect for marketplace)
- **State:** Zustand
- **Styling:** TailwindCSS 4
- **Email:** Resend
- **Testing:** Vitest (unit), Playwright (e2e)
- **Monitoring:** Sentry (via `src/instrumentation.ts`)

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm test` — run vitest
- `npm run test:e2e` — run playwright
- `npm run lint` — eslint

## Architecture
- `src/app/` — Next.js App Router pages and API routes
- `src/app/api/` — API routes (REST endpoints)
- `src/app/(shop)/` — Customer-facing storefront pages
- `src/app/(account)/` — Authenticated customer account pages
- `src/app/admin/` — Admin dashboard (requires admin role)
- `src/app/vendor/` — Vendor dashboard (requires vendor role)
- `src/actions/` — Server actions (checkout)
- `src/components/` — React components
- `src/hooks/` — Custom React hooks
- `src/lib/` — Shared libraries (supabase, stripe, auth, cache, validation)
- `src/stores/` — Zustand stores (cart, ui)
- `supabase/migrations/` — Database migrations (SQL)
- `e2e/` — Playwright end-to-end tests

## Auth Pattern
- `requireAuth()` — returns authenticated user or throws 401
- `requireAdmin()` — returns admin user or throws 403
- `requireVendor()` — returns vendor user + vendor record or throws 403
- All from `@/lib/auth/verify`

## API Conventions
- Prices stored as `price_pence` (integer, pennies)
- Use `supabaseAdmin` (service role) for webhook/server-side operations
- Use `createClient()` (user session) for RLS-protected operations
- Field whitelisting via `ALLOWED_FIELDS` Set on mutation endpoints
- Error responses: `{ error: string }` — never leak internal error messages

## Database
- Products use soft-delete (`is_active: false`), not hard delete
- Stock decrements use atomic RPC `decrement_stock()` to prevent race conditions
- Coupon validation uses `validate_coupon()` RPC
- Coupon usage increment uses `increment_coupon_usage()` RPC with row-level locking

## Deployment
- Hosted on Vercel
- Git remote: `git@github.com:baptistkevin-ctrl/uk-website.git`
- Branch: `main`
- Deploy: `npx vercel --prod --yes` or push to main

## Key Patterns
- Error boundaries (`error.tsx`) exist for all route groups: shop, account, admin, vendor
- Webhook idempotency: DB-level via `stripe_checkout_session_id` uniqueness
- Vendor marketplace: Stripe Connect transfers with commission calculation
- Cache invalidation via `src/lib/cache/index.ts`
