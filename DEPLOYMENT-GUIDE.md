# UK Grocery Store — Update Guide

**For: Solaris Empire Inc**
**Date: April 2026**
**Version: 2.0**

Your Supabase, Stripe, and Vercel are already connected. This guide covers **what's new** and what you need to update.

---

## What Changed

| Area | Changes |
|------|---------|
| Branding | Renamed from MegaMart/FreshMart to **UK Grocery Store** everywhere |
| PWA | Added install prompt, service worker, offline support |
| Mobile | Full mobile-first redesign — swipe gestures, bottom nav, pull-to-refresh |
| Features | Smart Reorder, Buy Again, Voice Search, Category Bubbles, Recently Viewed |
| Performance | Skeleton loaders, View Transitions, haptic feedback |
| Security | All admin routes protected, rate limiting, input validation |
| Email | Domain updated to **ukgrocerystore.com** in all templates |

---

## New Environment Variables to Add

Go to **Vercel** > Your Project > **Settings** > **Environment Variables**

### Add These New Variables

| Variable | Value | Why It's Needed |
|----------|-------|-----------------|
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` | SEO — sitemap.xml and robots.txt use this |
| `FROM_EMAIL` | `noreply@yourdomain.com` | Email sender address for order confirmations |
| `STRIPE_WEBHOOK_SECRET_ACCOUNT` | Get from Stripe (see below) | Vendor payout webhook verification |
| `CRON_SECRET` | Generate (see below) | Secures automated cron job endpoints |

**Generate CRON_SECRET (run in terminal):**
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste as the value.

### Optional — Add If You Want These Features

| Variable | Where to Get It | What It Enables |
|----------|-----------------|-----------------|
| `RESEND_API_KEY` | [resend.com](https://resend.com) — sign up free | Order confirmation emails, password reset, newsletter |
| `GEMINI_API_KEY` | [ai.google.dev](https://ai.google.dev) | AI chatbot assistant, smart product recommendations |
| `KV_REST_API_URL` | Vercel Dashboard > Storage > Create KV | Faster caching (Redis) for product pages |
| `SENTRY_DSN` | [sentry.io](https://sentry.io) | Error monitoring — get alerted when things break |
| `NEXT_PUBLIC_SENTRY_DSN` | Same as above | Client-side error tracking |

---

## Existing Variables — Verify These Are Set

These should already be in your Vercel env. Just double-check:

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Should already exist |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Should already exist |
| `SUPABASE_SERVICE_ROLE_KEY` | Should already exist |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Should already exist |
| `STRIPE_SECRET_KEY` | Should already exist |
| `STRIPE_WEBHOOK_SECRET` | Should already exist |
| `NEXT_PUBLIC_APP_URL` | Should already exist — verify it matches your domain |

---

## Stripe — Add Connect Webhook (If Not Done)

If you haven't set up Stripe Connect webhooks for vendor payouts:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) > **Developers** > **Webhooks**
2. Check if you have a webhook pointing to `https://yourdomain.com/api/webhooks/stripe`
3. If yes — click on it and make sure these events are selected:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `account.updated`
4. If you see a **separate** Connect webhook — copy its signing secret and add as `STRIPE_WEBHOOK_SECRET_ACCOUNT` in Vercel
5. If no Connect webhook exists — click **Add endpoint**:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Listen to: **Connected accounts** 
   - Events: `account.updated`
   - Copy the signing secret → add to Vercel as `STRIPE_WEBHOOK_SECRET_ACCOUNT`

---

## Supabase — Verify Auth URLs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) > Your project > **Authentication** > **URL Configuration**
2. Verify **Site URL** is: `https://yourdomain.com`
3. Verify **Redirect URLs** include:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/verify-email`
   - `https://yourdomain.com/reset-password`

---

## Resend — Email Setup (Recommended)

If you want order confirmation and password reset emails to work:

1. Go to [resend.com](https://resend.com) and create a free account
2. Add your domain and verify DNS records
3. Go to **API Keys** — create a new key
4. Add to Vercel:
   - `RESEND_API_KEY` = your key
   - `FROM_EMAIL` = `noreply@yourdomain.com`

**Free tier:** 100 emails/day, 3,000/month — enough for most stores.

---

## After Adding Variables — Redeploy

After adding/updating environment variables in Vercel:

1. Go to your project's **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Wait ~2 minutes for the build

---

## Post-Update Tasks (One-Time)

### Update Product Images
If any product images are missing, run:
```
POST https://yourdomain.com/api/admin/fix-images
```
(Login as admin first, then call from browser dev tools or Postman)

### Create Admin Account (If Not Done)
1. Register at `https://yourdomain.com/register`
2. Go to Supabase > **Table Editor** > `profiles`
3. Find your user row
4. Change `role` to `super_admin`

---

## Going Live Checklist

- [ ] New env variables added in Vercel (`NEXT_PUBLIC_SITE_URL`, `FROM_EMAIL`, `CRON_SECRET`)
- [ ] Redeployed after adding variables
- [ ] Stripe webhook URL matches your domain
- [ ] Supabase Auth redirect URLs match your domain
- [ ] Admin account works — can access `/admin`
- [ ] Test a purchase with Stripe test card (`4242 4242 4242 4242`)
- [ ] Check site on mobile — PWA install prompt shows after 10 seconds
- [ ] Email works — test password reset flow

---

## Support

If you run into any issues:
- Check Vercel **build logs** for deployment errors
- Check Supabase **logs** for database errors  
- Check Stripe **webhook logs** for payment errors
- Check browser **DevTools Console** for client-side errors

---

*Built by Solaris Empire Inc*
