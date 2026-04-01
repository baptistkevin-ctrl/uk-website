# Operations Runbook

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| SEV-1 | Site down or payments broken | 15 minutes | Checkout fails for all users, site returns 503 |
| SEV-2 | Major feature broken | 1 hour | Auth not working, search returns no results, admin panel inaccessible |
| SEV-3 | Minor feature broken | 4 hours | Single product page 404, email notifications delayed |
| SEV-4 | Cosmetic or low-impact | 1 business day | Styling glitch, typo, non-critical log noise |

## Incident Response Steps

1. **Acknowledge** -- Confirm you are investigating. Note the time.
2. **Assess severity** -- Determine the SEV level using the table above.
3. **Diagnose** -- Check logs, dashboards, and recent deployments.
4. **Mitigate** -- Apply a quick fix or rollback to restore service.
5. **Resolve** -- Deploy a proper fix once root cause is understood.
6. **Post-mortem** -- Document what happened, why, and what will prevent recurrence.

## Important URLs

| Service | URL |
|---------|-----|
| Live site | https://uk-grocery-store.vercel.app |
| Vercel dashboard | https://vercel.com (project: uk-website) |
| Supabase dashboard | https://supabase.com/dashboard |
| Stripe dashboard | https://dashboard.stripe.com |
| Sentry | https://sentry.io (check project settings for org/project name) |
| GitHub repo | https://github.com/baptistkevin-ctrl/uk-website |

## Common Issues

---

### Database Connection Failures

**Symptoms:**
- 500 errors across multiple pages
- API routes return `{ error: "Internal server error" }`
- Sentry shows `PostgrestError` or connection timeout errors

**Diagnosis:**
1. Check the Supabase dashboard for project status -- is the project paused or over quota?
2. Check Vercel logs (`vercel logs`) for connection error details.
3. Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly in Vercel environment variables.
4. Check Supabase connection pooler status.

**Fix:**
- If the Supabase project is paused (free tier), resume it from the dashboard.
- If environment variables are wrong, update them in Vercel and redeploy.
- If the pooler is saturated, check for connection leaks in recent code changes and consider increasing the pool size.

---

### Stripe Webhook Failures

**Symptoms:**
- Orders placed but not appearing in the database
- Customers charged but order status stuck on "pending"
- Stripe dashboard shows webhook delivery failures (4xx or 5xx)

**Diagnosis:**
1. Go to Stripe Dashboard > Developers > Webhooks. Check recent delivery attempts.
2. Look at the response code and body for failed deliveries.
3. Check Vercel function logs for the webhook API route (`/api/webhooks/stripe`).
4. Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret shown in the Stripe webhook settings.

**Fix:**
- If the signing secret is wrong, update `STRIPE_WEBHOOK_SECRET` in Vercel and redeploy.
- If the endpoint is timing out, check for slow database queries in the webhook handler.
- Use Stripe's "Resend" button to replay failed events once the fix is deployed.
- The webhook handler is idempotent (keyed on `stripe_checkout_session_id`), so replaying events is safe.

---

### Authentication Issues

**Symptoms:**
- Users cannot log in or sign up
- "Unauthorized" errors on pages that require auth
- `requireAuth()` throwing 401 unexpectedly

**Diagnosis:**
1. Check Supabase Auth settings in the dashboard -- is the auth service healthy?
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct.
3. Check browser console for CORS or cookie errors.
4. Test with a fresh incognito window to rule out stale session tokens.

**Fix:**
- If Supabase keys are wrong, update them in Vercel and redeploy.
- If sessions are expiring too quickly, check the JWT expiry settings in Supabase Auth config.
- If a specific user is affected, check their record in the Supabase `auth.users` table for bans or email confirmation issues.

---

### High Latency / Slow Pages

**Symptoms:**
- Pages take more than 3 seconds to load
- Vercel function duration metrics are elevated
- Users report the site feels slow

**Diagnosis:**
1. Check Vercel Analytics for function duration spikes.
2. Check Supabase dashboard for slow queries (Database > Query Performance).
3. Look at recent deployments -- did latency correlate with a specific deploy?
4. Check if Supabase is in a different region than Vercel (should both be in the same region).

**Fix:**
- If a specific query is slow, add an index or optimize the query.
- If the issue is cold starts, check if the function bundle size is too large.
- Use `src/lib/cache/index.ts` for caching frequently accessed data.
- Consider whether the affected page can use static generation instead of server-side rendering.

---

### 500 Errors on Specific Routes

**Symptoms:**
- A single page or API route returns 500
- Other parts of the site work fine
- Sentry shows the specific error and stack trace

**Diagnosis:**
1. Check Sentry for the error details and stack trace.
2. Check Vercel function logs for the specific route.
3. Try reproducing locally with `npm run dev`.
4. Check if the error is related to missing environment variables or database schema changes.

**Fix:**
- If it is a code bug, fix and deploy.
- If it is a missing database column or table, write and push a migration.
- If it is a missing environment variable, add it in Vercel.
- For an urgent fix, use `npx vercel --prod --yes` to deploy without waiting for CI.

## Contacts

| Role | Contact |
|------|---------|
| Project owner | Kevin Baptist (GitHub: baptistkevin-ctrl) |
| Vercel account | Check Vercel dashboard for team members |
| Supabase account | Check Supabase dashboard for team members |
| Stripe account | Check Stripe dashboard for team members |
