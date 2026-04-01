# Code Review System — 12 Lenses

## Review Format

```
════════════════════════════════════════════════════════
  SOLARIS EMPIRE INC. — CODE REVIEW REPORT
  Project: [name]  |  Files: [count]  |  Date: [date]
════════════════════════════════════════════════════════

[Findings from each lens]

════════════════════════════════════════════════════════
  VERDICT: APPROVED / APPROVED WITH CONDITIONS / REJECTED
  Critical: [n]  High: [n]  Medium: [n]  Low: [n]  Info: [n]
════════════════════════════════════════════════════════
```

## Finding Format

```
[SEVERITY] — Title
  File: path/to/file.ext
  Line(s): 42-58
  Problem: Simple English explanation
  Impact: What goes wrong if not fixed
  Fix: Exact code to fix it
```

## Severity Levels

| Level | Definition | Action |
|-------|-----------|--------|
| CRITICAL | Security vuln, data loss, crash, money impact | Block merge |
| HIGH | Major bug, perf issue, broken feature | Fix before merge |
| MEDIUM | Code smell, missing validation, maintainability | Fix or ticket |
| LOW | Style, minor improvement | Fix if time allows |
| INFO | Praise, suggestion, learning opportunity | Optional |

## The 12 Lenses

### Lens 1: Security Chief
- SQL/NoSQL/XSS/Command injection
- Auth on every endpoint, authz checks
- Secrets in env vars, no hardcoded creds
- CORS, CSP, rate limiting
- Dependencies audited
- Crypto: no MD5/SHA1, crypto-secure random

### Lens 2: Performance Architect
- N+1 queries, missing indexes, SELECT *
- Pagination on lists, proper caching
- Big O complexity of algorithms
- Memory leaks (listeners, intervals, closures)
- Frontend: image optimization, code splitting, memoization

### Lens 3: Reliability Engineer
- try/catch on every async operation
- Errors not swallowed silently
- Global error handlers and boundaries
- Graceful degradation when deps fail
- Health check endpoints
- Structured logging with context

### Lens 4: Code Quality Lead
- Functions under 30 lines, do ONE thing
- Descriptive names (no x, temp, data)
- No dead code, no duplicated code
- SOLID principles followed
- Nesting under 3 levels
- No magic numbers

### Lens 5: Type Safety Engineer
- No `any` types
- Explicit return types on exports
- Zod validation at API boundaries
- Type guards for runtime checks
- strict: true in tsconfig

### Lens 6: Testing Commander
- Tests for every public function
- Edge cases covered (empty, null, max)
- Error paths tested
- Tests are independent and deterministic
- Coverage above 80%

### Lens 7: Database Architect
- Proper normalization
- Foreign keys with ON DELETE
- Indexes on query columns
- Migrations reversible
- RLS policies on all tables
- created_at/updated_at on every table

### Lens 8: API Design Reviewer
- Correct HTTP methods and status codes
- Request validation with schemas
- Consistent response format
- Pagination on all list endpoints
- Rate limiting, proper error format

### Lens 9: Frontend Architect
- Small focused components
- Proper prop types
- Correct hook usage (rules of hooks, deps arrays)
- Accessible (alt text, labels, keyboard nav, contrast)
- Loading/error/empty states handled
- No console errors

### Lens 10: DevOps Engineer
- All config in env vars
- .env.example exists
- CI pipeline configured (lint + type-check + test + build)
- Docker optimized (if applicable)
- Proper deployment stages

### Lens 11: Documentation Reviewer
- JSDoc on complex/public functions
- WHY comments (not WHAT)
- README up to date
- TODOs have ticket numbers
- No commented-out code

### Lens 12: Business Logic Auditor
- Code implements requirements correctly
- Edge cases in business logic handled
- Money uses integer cents (no floats)
- Payment flows are idempotent
- Will it work at 10x/100x scale?

## Special Rules

1. **Beginner-Friendly**: Explain every finding in simple English with a real-world analogy
2. **Praise Good Code**: For every 3 issues, include 1 INFO praising something done well
3. **Real World Impact**: Every HIGH/CRITICAL includes a scenario of what goes wrong
4. **Fix It For Me**: Every finding includes exact copy-paste code to fix it
