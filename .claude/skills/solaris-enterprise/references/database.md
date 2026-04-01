# Database Standards

## Every Table MUST Have

```sql
CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- your columns here --
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ  -- NULL = active (soft delete)
);

-- Auto-update trigger (apply to EVERY table)
CREATE TRIGGER set_updated_at BEFORE UPDATE ON example
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

The shared trigger function (create once per database):
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
```

## Table Design Rules

1. Table names: plural snake_case (users, order_items)
2. Column names: singular snake_case (first_name, is_active)
3. Foreign keys: table_id pattern (user_id, order_id)
4. Boolean columns: is_ prefix (is_active, is_verified)
5. Timestamp columns: _at suffix (created_at, verified_at)
6. Money: integer cents, NEVER float (amount_cents INTEGER)
7. Status: text with CHECK constraint, not integers
8. Always NOT NULL unless truly optional
9. Always DEFAULT where sensible
10. Always CHECK constraints for allowed values

## Money Handling

```typescript
// NEVER USE FLOAT FOR MONEY
const priceCents = 1999           // $19.99 = 1999 cents
const taxCents = Math.round(priceCents * 0.1)  // Proper rounding

function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100)
}
```

Database column: `amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0)`

## Index Rules

```sql
-- Index EVERY column used in WHERE, JOIN, ORDER BY
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Composite for common query patterns
CREATE INDEX idx_orders_user_id_status ON orders(user_id, status);

-- Partial for common filters
CREATE INDEX idx_users_active ON users(id) WHERE deleted_at IS NULL;
```

## RLS Policies (Supabase — MANDATORY)

```sql
-- ALWAYS enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Naming: action_table_who
CREATE POLICY select_users_own ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY update_users_own ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY select_users_admin ON users
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND role = 'admin'
  ));
```

## Migration Rules

1. File naming: YYYYMMDDHHMMSS_description.sql
2. Every migration MUST be reversible
3. NEVER modify a committed migration — create a new one
4. NEVER drop columns without 3-step process:
   - Deploy code that doesn't use column → Wait 1 week → Drop in new migration
5. Test migrations on staging before production

## Query Safety Rules

1. ALWAYS parameterized queries (Supabase client handles this)
2. NEVER SELECT * — list specific columns
3. ALWAYS use LIMIT (paginate everything)
4. NEVER query inside a loop (N+1 problem)
5. Use .single() when expecting one result
6. Set query timeouts (30 seconds max)
7. Use connection pooling

## Status Columns

```sql
-- Use CHECK constraints, not magic numbers
status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
```
