# Contributing to UK Grocery Store

> Solaris Enterprise Documentation Standard v2.1

This document defines the contribution workflow, coding standards, and review process for the UK Grocery Store e-commerce platform.

---

## Table of Contents

1. [Development Workflow](#development-workflow)
2. [Branch Naming Convention](#branch-naming-convention)
3. [Coding Standards](#coding-standards)
4. [Commit Message Format](#commit-message-format)
5. [Pull Request Guidelines](#pull-request-guidelines)
6. [Code Review Checklist](#code-review-checklist)

---

## Development Workflow

All contributions follow a seven-step lifecycle from task selection through to merge.

| Step | Action | Details |
|------|--------|---------|
| 1 | **Pick a task** | Select an open issue or ticket from the project board. Assign it to yourself and move it to "In Progress". |
| 2 | **Create a branch** | Branch off `main` using the naming convention defined below. Ensure `main` is up to date before branching. |
| 3 | **Write code** | Implement the change following the coding standards in this document and in `CLAUDE.md`. Keep changes focused on a single concern. |
| 4 | **Test locally** | Run the full test suite before pushing. Unit tests: `npm test`. End-to-end tests: `npm run test:e2e`. Linting: `npm run lint`. Build verification: `npm run build`. |
| 5 | **Push to remote** | Push your branch to the remote repository. Ensure all CI checks pass. |
| 6 | **Open a pull request** | Create a PR against `main` following the PR guidelines below. Request at least one reviewer. |
| 7 | **Review and merge** | Address all review feedback. Once approved and all checks pass, squash-merge into `main`. Delete the branch after merge. |

---

## Branch Naming Convention

All branches must follow the format: `<type>/SE-<ticket>-<short-description>`

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New functionality or user-facing capability | `feature/SE-142-product-search-filters` |
| `bugfix/` | Non-urgent defect resolution | `bugfix/SE-203-cart-total-rounding-error` |
| `hotfix/` | Critical production fix requiring immediate deployment | `hotfix/SE-310-checkout-payment-failure` |
| `chore/` | Maintenance, dependency updates, configuration changes | `chore/SE-088-upgrade-next-16` |
| `docs/` | Documentation-only changes | `docs/SE-055-api-endpoint-reference` |

Rules:

- Use lowercase letters, numbers, and hyphens only.
- Keep the description concise (three to five words).
- Always include the Solaris Enterprise ticket number (`SE-XXX`).

---

## Coding Standards

The full coding standards, architecture conventions, and API patterns for this project are maintained in [`CLAUDE.md`](./CLAUDE.md). All contributors must read and follow that document.

Key points summarised here for reference:

- **Language:** TypeScript (strict mode). No `any` types without justification.
- **Framework:** Next.js 16.1.3 with App Router. React 19.
- **Styling:** TailwindCSS 4. No inline styles or external CSS unless absolutely necessary.
- **State management:** Zustand stores located in `src/stores/`.
- **Database:** Supabase with PostgreSQL. All mutations must respect Row Level Security (RLS). Use `supabaseAdmin` only for server-side/webhook operations.
- **Payments:** Stripe Checkout Sessions. Vendor payouts via Stripe Connect.
- **Prices:** Always stored as `price_pence` (integer, pennies). Never use floating-point for currency.
- **Auth:** Use `requireAuth()`, `requireAdmin()`, or `requireVendor()` from `@/lib/auth/verify`.
- **Error handling:** Return `{ error: string }` responses. Never expose internal error details to the client.
- **Soft deletes:** Products use `is_active: false`, not hard deletion.

---

## Commit Message Format

All commits must follow the Conventional Commits specification with a Solaris Enterprise ticket reference.

```
<type>(<scope>): <description> [SE-<ticket>]
```

### Types

| Type | Purpose |
|------|---------|
| `feat` | A new feature or user-facing functionality |
| `fix` | A bug fix |
| `refactor` | Code restructuring with no change in external behaviour |
| `perf` | A performance improvement |
| `test` | Adding or updating tests |
| `docs` | Documentation changes only |
| `style` | Code style changes (formatting, whitespace, semicolons) |
| `chore` | Build process, tooling, or dependency updates |
| `ci` | CI/CD pipeline configuration changes |

### Scope

The scope should identify the area of the codebase affected. Common scopes for this project:

- `cart`, `checkout`, `products`, `orders`, `auth`, `admin`, `vendor`, `api`, `db`, `ui`, `stripe`, `email`

### Examples

```
feat(checkout): add coupon validation to checkout flow [SE-142]
fix(cart): correct rounding error in cart total calculation [SE-203]
refactor(api): extract shared validation into middleware [SE-088]
perf(products): add database index for category filtering [SE-175]
test(orders): add e2e tests for order status transitions [SE-199]
docs(api): document webhook retry behaviour [SE-055]
style(ui): align product card spacing with design system [SE-221]
chore(deps): upgrade Next.js to 16.1.3 [SE-310]
ci(deploy): add staging environment to Vercel pipeline [SE-267]
```

### Rules

- Use the imperative mood in the description ("add", not "added" or "adds").
- Do not capitalise the first letter of the description.
- Do not end the description with a full stop.
- Keep the subject line under 72 characters.
- Add a blank line and body text for complex changes that require additional context.

---

## Pull Request Guidelines

### Title Format

PR titles must match the commit message format:

```
<type>(<scope>): <description> [SE-<ticket>]
```

Example: `feat(checkout): add coupon validation to checkout flow [SE-142]`

### Description

Every PR must include:

1. **Summary** -- A brief explanation of what changed and why (two to three sentences).
2. **Changes** -- A bulleted list of specific modifications made.
3. **Testing** -- Description of how the changes were tested (unit tests, e2e tests, manual verification).
4. **Screenshots** -- Required for any UI changes. Include before and after where applicable.
5. **Related tickets** -- Link to the Solaris Enterprise ticket(s) addressed.

### Size Limits

- **Maximum 400 lines changed** per pull request. This includes additions and deletions but excludes auto-generated files (lock files, migration snapshots).
- If a feature exceeds this limit, break it into smaller, independently reviewable PRs with a clear sequencing plan.
- Each PR must be deployable on its own without breaking existing functionality.

### Additional Requirements

- All CI checks must pass before requesting review.
- At least one approval is required before merging.
- Resolve all review comments before merging. Do not dismiss reviews without discussion.
- Squash-merge into `main`. Use the PR title as the squash commit message.
- Delete the feature branch after merge.

---

## Code Review Checklist

Reviewers must evaluate every PR against the following criteria. All items must be satisfied before approval.

### Security

- [ ] No secrets, API keys, or credentials committed to the repository.
- [ ] User input is validated and sanitised on the server side.
- [ ] API routes use appropriate auth guards (`requireAuth`, `requireAdmin`, `requireVendor`).
- [ ] RLS policies are not bypassed without explicit justification.
- [ ] Field whitelisting is enforced on mutation endpoints via `ALLOWED_FIELDS`.
- [ ] Error responses do not leak internal implementation details.
- [ ] Stripe webhook handlers verify event signatures.

### Types

- [ ] No use of `any` without a documented reason.
- [ ] Function parameters and return types are explicitly typed.
- [ ] Database query results are typed against the schema.
- [ ] Shared types are defined in appropriate locations and reused, not duplicated.

### Tests

- [ ] New functionality includes corresponding unit tests (`npm test`).
- [ ] User-facing flows include end-to-end test coverage (`npm run test:e2e`).
- [ ] Edge cases and error paths are tested.
- [ ] Existing tests have not been removed or weakened without justification.
- [ ] All tests pass locally and in CI.

### Performance

- [ ] Database queries are efficient and use appropriate indexes.
- [ ] No N+1 query patterns introduced.
- [ ] Large lists use pagination.
- [ ] Images are optimised and use Next.js `<Image>` component.
- [ ] Stock decrements use the atomic `decrement_stock()` RPC to prevent race conditions.
- [ ] Cache invalidation is handled correctly via `src/lib/cache/index.ts`.

### Accessibility

- [ ] Interactive elements are keyboard-navigable.
- [ ] Images have meaningful `alt` text.
- [ ] Form inputs have associated `<label>` elements.
- [ ] Colour contrast meets WCAG 2.1 AA standards.
- [ ] ARIA attributes are used correctly where native HTML semantics are insufficient.
- [ ] Page structure uses semantic HTML elements (`<main>`, `<nav>`, `<section>`, `<article>`).

---

*This document follows the Solaris Enterprise Documentation Standard. Last updated: 2026-04-02.*
