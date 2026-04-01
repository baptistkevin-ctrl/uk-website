# Deployment Guide

## Environments

| Environment | Branch | Deploy Method | URL |
|-------------|--------|---------------|-----|
| Production  | `main` | Vercel auto-deploy on push | https://uk-grocery-store.vercel.app |

## Prerequisites

- **Node.js** 18+ (recommend latest LTS)
- **npm** (bundled with Node)
- **Vercel CLI** (`npm i -g vercel`)
- **Supabase CLI** (`npm i -g supabase`)
- Access to the Vercel project and Supabase project dashboards

## Deploy to Production

There are two ways to deploy:

### Option 1: Push to main (recommended)

```bash
git checkout main
git pull origin main
# make changes, commit
git push origin main
```

Vercel watches the `main` branch and triggers an automatic production deployment on every push.

### Option 2: Manual deploy via Vercel CLI

```bash
npx vercel --prod --yes
```

This deploys the current working directory directly to production, bypassing Git. Use this for hotfixes or when you need to deploy without pushing to the remote.

## Database Migrations

Migrations live in `supabase/migrations/`. To apply pending migrations to the production database:

```bash
supabase db push
```

Always review the migration SQL before pushing. Migrations run in order and are tracked by filename timestamp.

## Rollback

### Application rollback

**Option A -- Revert the commit and push:**

```bash
git revert <commit-sha>
git push origin main
```

This triggers a new deployment with the offending changes removed.

**Option B -- Vercel instant rollback:**

```bash
vercel rollback
```

This re-promotes the previous successful deployment. No new build is required, so it takes effect in seconds.

### Database rollback

There is no automatic database rollback. If a migration causes issues, write a new migration that reverses the changes and run `supabase db push`.

## Environment Variables

All environment variables are managed through the **Vercel Dashboard**:

1. Go to the Vercel project settings.
2. Navigate to **Settings > Environment Variables**.
3. Add or update variables for the appropriate scope (Production, Preview, Development).

Required variables include:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `RESEND_API_KEY` | Resend email API key |
| `SENTRY_DSN` | Sentry error tracking DSN |

Never commit `.env` or `.env.local` files to the repository.
