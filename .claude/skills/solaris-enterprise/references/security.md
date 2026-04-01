# Security Standards

## Security Checklist (every feature must pass)

### Authentication
- [ ] Every non-public endpoint requires valid auth token
- [ ] Tokens expire and refresh properly
- [ ] Logout invalidates session
- [ ] Rate limiting on login (5 attempts per 15 minutes)
- [ ] Password minimum 8 characters

### Authorization
- [ ] Every endpoint checks user has permission for the action
- [ ] Users cannot access other users' data
- [ ] Admin endpoints verify admin role SERVER-SIDE
- [ ] RLS policies on every Supabase table

### Input Validation
- [ ] Zod schema validation on every API input
- [ ] Max length on all string inputs
- [ ] File upload validation (type, size, content)
- [ ] SQL parameterized queries only

### Secrets
- [ ] All secrets in environment variables
- [ ] .env in .gitignore
- [ ] .env.example committed with dummy values
- [ ] No secrets in frontend code (NEXT_PUBLIC_ = safe values only)
- [ ] No secrets in git history

### Headers
- [ ] CORS configured (not wildcard in production)
- [ ] Content Security Policy headers
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security (HSTS)

### Data Protection
- [ ] Passwords hashed with bcrypt (cost 12+)
- [ ] Error messages never expose internals
- [ ] Logs never contain passwords or tokens
- [ ] PII encrypted at rest where required

## NEVER DO THESE

```typescript
// ❌ String concatenation in SQL
const q = `SELECT * FROM users WHERE email = '${email}'` // SQL INJECTION

// ❌ Hardcoded secrets
const apiKey = "sk_live_abc123" // EXPOSED IN GIT

// ❌ Trust client for authorization
const isAdmin = request.body.isAdmin // USER CONTROLS THIS

// ❌ Math.random for security tokens
const token = Math.random().toString(36) // PREDICTABLE

// ❌ Expose stack traces
catch (e) { return res.json({ error: e.stack }) } // INFO LEAK

// ❌ localStorage for auth tokens
localStorage.setItem("token", jwt) // XSS CAN READ

// ❌ eval with user input
eval(userInput) // REMOTE CODE EXECUTION

// ❌ dangerouslySetInnerHTML with user content
<div dangerouslySetInnerHTML={{ __html: comment }} /> // XSS
```

## Input Validation Pattern

```typescript
import { z } from "zod"

export const createUserSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  name: z.string().min(1).max(100).trim(),
  password: z.string().min(8).max(128),
  role: z.enum(["member", "admin"]).default("member"),
})

// Always validate at API boundary
const validated = createUserSchema.parse(body)
```

## Auth Middleware Pattern

```typescript
export async function requireAuth(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (!session) throw new UnauthorizedError()
  return session
}

export async function requireAdmin(request: NextRequest) {
  const session = await requireAuth(request)
  const { data: profile } = await supabase
    .from("users").select("role").eq("id", session.user.id).single()
  if (profile?.role !== "admin") throw new ForbiddenError()
  return session
}
```

## Rate Limiting

```
Auth (login):     5 requests per 15 minutes
Auth (register):  3 requests per hour
API (general):    100 requests per minute
API (search):     30 requests per minute
File uploads:     10 per hour
```
