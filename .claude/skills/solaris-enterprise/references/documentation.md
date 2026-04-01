# Documentation Templates

## Required Files for Every Project

```
ROOT:
  README.md              — Project overview, quick start, scripts
  CONTRIBUTING.md        — Development workflow, PR process
  CHANGELOG.md           — Version history (Keep a Changelog format)
  .env.example           — All env vars with dummy values

docs/:
  ARCHITECTURE.md        — System design, diagrams, data flow
  API.md                 — Every endpoint documented
  DATABASE.md            — Schema, tables, RLS, migrations
  DEPLOYMENT.md          — How to deploy each environment
  RUNBOOK.md             — Incident response procedures
  ONBOARDING.md          — New developer setup guide
  decisions/ADR-001.md   — Architecture Decision Records

.github/:
  PULL_REQUEST_TEMPLATE.md
  ISSUE_TEMPLATE/bug_report.md
  ISSUE_TEMPLATE/feature_request.md
  workflows/ci.yml
```

## README.md Template

Must include these sections (in order):
1. Project name + one-line description + CI badge
2. Overview (2-3 paragraphs) + Key Features list
3. Tech Stack table (Layer | Technology)
4. Quick Start (numbered steps: clone, install, env, db, run)
5. Project Structure (folder tree with descriptions)
6. Available Scripts table (Command | Description)
7. Environment Variables table (Variable | Required | Description)
8. Deployment summary (link to docs/DEPLOYMENT.md)
9. Documentation links table
10. Contributing (link to CONTRIBUTING.md)
11. License

## docs/ARCHITECTURE.md Template

Must include:
1. System Overview + Core Capabilities
2. Architecture Diagram (ASCII art showing all layers)
3. Technology Decisions table (Decision | Choice | Rationale)
4. Data Flow (Read flow + Write flow step by step)
5. Authentication Flow (Login, Register, OAuth, Logout)
6. Payment Flow (if applicable)
7. Infrastructure table (Environment | URL | Branch | Deploy method)
8. Security Architecture (5 defense layers)
9. Performance Strategy (targets table + strategies list)
10. Monitoring and Observability (signals, tools, alert thresholds)

## docs/API.md Template

For every endpoint document:
- Method + URL
- Description (one sentence)
- Auth requirement
- Request body (JSON example)
- Query parameters table (Param | Type | Default | Description)
- Success response (JSON example with status code)
- Error responses table (Code | Condition)

Also include: response format, status code reference, rate limits table, pagination docs, versioning policy.

## docs/DATABASE.md Template

For every table document:
- Table name + description
- Columns table (Column | Type | Nullable | Default | Description)
- Indexes list
- Constraints list
- RLS Policies list
- Relationships (foreign keys)

Also include: ER diagram (ASCII), migration history table, database conventions.

## docs/DEPLOYMENT.md Template

Must include:
1. Environments table (Env | Branch | URL | Auto Deploy)
2. Prerequisites
3. Deploy to Staging steps
4. Deploy to Production steps (with verification checklist)
5. Database migration commands
6. Rollback procedure (code + database)
7. Environment variable management

## CONTRIBUTING.md Template

Must include:
1. Development workflow (7 steps: pick task → branch → code → test → push → review → merge)
2. Branch naming convention
3. Coding standards reference (point to CLAUDE.md)
4. Commit message format with examples
5. PR guidelines (title, description, size limit)
6. Code review checklist

## PR Template

```markdown
## What
[1-2 sentences]

## Why
[Link to ticket: SE-XXX]

## How
[Technical approach]

## Changes
- [Change 1]
- [Change 2]

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manually tested

## Screenshots (if UI changes)
| Before | After |
|--------|-------|

## Checklist
- [ ] Coding standards followed
- [ ] TypeScript strict passes
- [ ] ESLint passes
- [ ] All tests pass
- [ ] No console.log left
- [ ] Env vars in .env.example
- [ ] Migration is reversible
- [ ] API docs updated
```

## Bug Report Template

```markdown
## Description
[Clear description]

## Steps to Reproduce
1. Go to...
2. Click...
3. See error

## Expected vs Actual Behavior
## Screenshots
## Environment (browser, OS, screen size, user role)
```

## Feature Request Template

```markdown
## Problem
[What problem does this solve?]

## Proposed Solution
[Describe the feature]

## Alternatives Considered
## Acceptance Criteria
- [ ] Criteria 1

## Priority
- [ ] Critical / High / Medium / Low
```

## ADR (Architecture Decision Record) Template

```markdown
# ADR-[NUMBER]: [Title]
Date: [YYYY-MM-DD]
Status: Proposed | Accepted | Deprecated

## Context
[What requires a decision?]

## Decision
[What was decided?]

## Options Considered
### Option A — Pros/Cons
### Option B — Pros/Cons
### Option C (Selected) — Pros/Cons

## Rationale
[Why this option?]

## Consequences
Positive / Negative / Risks with mitigations

## Follow-Up Actions
```

## docs/RUNBOOK.md Template

Must include:
1. Severity levels table (SEV-1 to SEV-4 with response times)
2. Incident response steps (Detect → Assess → Communicate → Mitigate → Resolve → Post-Mortem)
3. Common issues with exact fixes (DB errors, webhook failures, auth issues, latency)
4. Important URLs table (service dashboards)
5. Contacts table

## docs/ONBOARDING.md Template

Must include:
1. Day 1 Setup (access checklist + local dev setup + reading list in order)
2. Day 2-3 First Task (starter task + first PR guide)
3. Key Concepts (layered architecture, services vs repos, error handling, testing)

## CHANGELOG.md Format

```markdown
## [Unreleased]
### Added / Changed / Fixed / Removed

## [1.0.0] - 2026-04-XX
### Added
- Initial release with [feature list]
```

## Comment Standards

```typescript
// ✅ DO: Explain WHY
// Stripe returns 503 during maintenance (2-4 AM UTC), so we retry 3 times
const MAX_RETRIES = 3

// ✅ DO: JSDoc on public functions
/**
 * Creates a checkout session for the given plan.
 * @param userId - The user upgrading
 * @param planId - Target pricing plan
 * @returns Checkout URL
 * @throws {NotFoundError} If user/plan missing
 */

// ✅ DO: TODOs with tickets
// TODO(SE-456): Add rate limiting to this endpoint

// ❌ DON'T: State the obvious
// Increment counter <- useless
counter++

// ❌ DON'T: Leave dead code
// const old = () => {} <- DELETE THIS

// ❌ DON'T: TODO without context
// TODO: fix later <- fix WHAT?
```
