# Developer Onboarding

Welcome to the UK Grocery Store project. This guide will get you set up and productive.

## Day 1 Setup

### 1. Clone the repository

```bash
git clone git@github.com:baptistkevin-ctrl/uk-website.git
cd uk-website
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and fill in the values:

```bash
cp .env.example .env.local
```

If there is no `.env.example`, create `.env.local` with these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe-test-publishable-key>
STRIPE_SECRET_KEY=<stripe-test-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-test-webhook-secret>
RESEND_API_KEY=<resend-api-key>
SENTRY_DSN=<sentry-dsn>
```

Ask the project owner for the Supabase and Stripe **test** credentials.

### 4. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You should see the storefront.

### 5. Run tests to verify everything works

```bash
npm test          # Unit tests (Vitest)
npm run lint      # ESLint
```

## Required Access

Request access to the following services before your first day if possible:

| Service | What you need | Who to ask |
|---------|--------------|------------|
| GitHub | Collaborator access to `baptistkevin-ctrl/uk-website` | Project owner |
| Vercel | Team member on the Vercel project | Project owner |
| Supabase | Access to the Supabase project dashboard | Project owner |
| Stripe | Test mode API keys (do NOT use live keys locally) | Project owner |

## Key Concepts

### Tech stack

- **Next.js 16.1.3** with the App Router and React 19
- **TypeScript** throughout
- **Supabase** for database (PostgreSQL), authentication, and row-level security
- **Stripe** for payments, including Stripe Connect for the vendor marketplace
- **TailwindCSS 4** for styling
- **Zustand** for client-side state (cart, UI)
- **Resend** for transactional email
- **Sentry** for error monitoring

### Architecture layers

The codebase follows a layered pattern:

```
Route (src/app/)
  --> Server Actions / API Routes (src/actions/, src/app/api/)
    --> Library functions (src/lib/)
      --> Supabase / Stripe SDKs
```

- **Routes** handle rendering and request/response.
- **Server actions and API routes** contain business logic.
- **Library functions** wrap external services (Supabase, Stripe, auth, cache).

### Authentication pattern

Three helper functions in `src/lib/auth/verify` gate access:

- `requireAuth()` -- returns the authenticated user or throws 401
- `requireAdmin()` -- returns an admin user or throws 403
- `requireVendor()` -- returns a vendor user and vendor record or throws 403

### Data conventions

- All prices are stored as **integers in pence** (`price_pence`), not floating-point pounds.
- Products use **soft-delete** (`is_active: false`), never hard delete.
- Stock updates use the `decrement_stock()` RPC for atomic, race-condition-safe decrements.

### Route groups

| Path | Purpose | Auth required |
|------|---------|---------------|
| `src/app/(shop)/` | Customer storefront | No |
| `src/app/(account)/` | Customer account pages | Yes (any user) |
| `src/app/admin/` | Admin dashboard | Yes (admin role) |
| `src/app/vendor/` | Vendor dashboard | Yes (vendor role) |

## First Tasks

Here are some good first tasks to get familiar with the codebase:

1. **Read the codebase docs** -- Follow the reading list below.
2. **Run the app and browse** -- Add items to cart, explore the admin and vendor dashboards.
3. **Fix a small bug or improve a UI component** -- Look for open GitHub issues tagged `good-first-issue`.
4. **Add a unit test** -- Pick a utility function in `src/lib/` and add a Vitest test for it.
5. **Trace a request** -- Follow a checkout flow from the cart button through the server action, Stripe session creation, webhook handler, and order creation in the database.

## Reading List

Read these files in order to understand the project:

1. `CLAUDE.md` -- Project overview, commands, conventions, and patterns
2. `docs/DEPLOYMENT.md` -- How the app is deployed and how to manage environments
3. `docs/RUNBOOK.md` -- How to respond to production incidents
4. `src/app/` -- Browse the route structure to understand the app layout
5. `src/lib/` -- Core library code (auth, Supabase client, Stripe, cache, validation)
6. `supabase/migrations/` -- Database schema history

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the local development server |
| `npm run build` | Production build (catches type errors) |
| `npm test` | Run unit tests with Vitest |
| `npm run test:e2e` | Run end-to-end tests with Playwright |
| `npm run lint` | Run ESLint |
| `npx vercel --prod --yes` | Manual deploy to production |
| `supabase db push` | Apply database migrations |
