# UK Grocery Store (Fresh Groceries)

Full-stack e-commerce platform for UK grocery delivery with multi-vendor marketplace support.

## Tech Stack

- **Framework:** Next.js 16.1.3 (App Router), React 19, TypeScript
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Payments:** Stripe Checkout + Stripe Connect (marketplace payouts)
- **Styling:** TailwindCSS 4
- **State:** Zustand
- **Email:** Resend
- **Testing:** Vitest (unit), Playwright (e2e)
- **Monitoring:** Sentry

## Key Features

- Product catalog with category browsing and search
- Multi-vendor marketplace with Stripe Connect and commission splits
- Stripe-powered checkout and payment processing
- Order tracking and order history
- Loyalty points system
- Coupon and discount system
- Real-time notifications
- Admin dashboard (product, order, vendor, and user management)
- Vendor dashboard (inventory, orders, payouts)

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in Supabase, Stripe, and Resend keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Testing

```bash
npm test            # unit tests (Vitest)
npm run test:e2e    # end-to-end tests (Playwright)
```

## Project Structure

```
src/app/(shop)/      # customer-facing storefront
src/app/(account)/   # authenticated account pages
src/app/admin/       # admin dashboard
src/app/vendor/      # vendor dashboard
src/app/api/         # REST API routes
src/actions/         # server actions (checkout)
src/components/      # shared React components
src/lib/             # supabase, stripe, auth, cache, validation
src/stores/          # Zustand stores (cart, ui)
supabase/migrations/ # database migrations (SQL)
e2e/                 # Playwright tests
```

## Deployment

Hosted on Vercel. Push to `main` or run:

```bash
npx vercel --prod --yes
```
