## What
<!-- 1-2 sentences describing the change -->

## Why
<!-- Link to ticket: SE-XXX or explain motivation -->

## How
<!-- Technical approach — what did you change and why this way? -->

## Changes
- [ ] Change 1
- [ ] Change 2

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manually tested locally
- [ ] Tested on staging (if applicable)

## Screenshots (if UI changes)
| Before | After |
|--------|-------|
|        |       |

## Checklist
- [ ] TypeScript strict passes (`npm run lint`)
- [ ] All tests pass (`npm test`)
- [ ] No `console.log` left in code
- [ ] No `any` types introduced
- [ ] Env vars added to `.env.example` (if new)
- [ ] Migration is reversible (if DB changes)
- [ ] API docs updated (if endpoint changes)
- [ ] Prices use integer pence (not floats)
- [ ] Auth check on every non-public endpoint
- [ ] Structured logger used (not console.log)
