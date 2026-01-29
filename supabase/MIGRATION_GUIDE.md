# Database Migration Guide

## UK Grocery Store - Complete Database Setup

This guide will help you apply all database migrations to your Supabase project.

---

## Migration Files (In Order)

| # | File | Description |
|---|------|-------------|
| 1 | `00001_initial_schema.sql` | Core tables: profiles, products, categories, orders |
| 2 | `00002_hero_slides.sql` | Homepage hero carousel slides |
| 3 | `00003_store_settings.sql` | Store configuration settings |
| 4 | `00004_multibuy_offers.sql` | Multi-buy discount offers |
| 5 | `00005_add_weight_grams.sql` | Product weight tracking |
| 6 | `00006_add_category_emoji.sql` | Category emoji icons |
| 7 | `00007_vendors_multivendor.sql` | Vendor/seller accounts |
| 8 | `00008_marketplace_features.sql` | Marketplace functionality |
| 9 | `00009_coupons_system.sql` | Coupon codes system |
| 10 | `00010_referral_system.sql` | Customer referral program |
| 10a | `00010a_profile_enhancements.sql` | Profile field additions |
| 11 | `00011_loyalty_system.sql` | Basic loyalty points |
| 12 | `00012_ticket_support_system.sql` | Support ticket system |
| 13 | `00013_newsletter_system.sql` | Newsletter subscriptions |
| 14 | `00014_notifications_system.sql` | User notifications |
| 15 | `00015_recently_viewed.sql` | Recently viewed products |
| 16 | `00016_delivery_slots.sql` | Delivery time slots |
| 17 | `00017_live_chat.sql` | Live chat system |
| 18 | `00018_chatbot_system.sql` | AI chatbot integration |
| 19 | `00019_high_priority_features.sql` | Priority feature set |
| 20 | `00020_admin_features.sql` | Admin dashboard features |
| 21 | `20240125_returns_system.sql` | Returns & refunds workflow |
| 22 | `20240126_automation_system.sql` | Advanced automation system |

---

## Option 1: Apply via Supabase Dashboard (Recommended)

### Step-by-Step:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Migrations in Order**
   - Copy the contents of each migration file
   - Paste into the SQL editor
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - Wait for success message before proceeding to next file

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see all tables listed

### Quick Migration (All at Once):

Use the combined file: `FULL_DATABASE_SETUP.sql`

```sql
-- Copy and paste the entire contents of FULL_DATABASE_SETUP.sql
-- into the Supabase SQL Editor and run it
```

---

## Option 2: Apply via Supabase CLI

### Prerequisites:
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login
```

### Link Project:
```bash
cd uk-grocery-store

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

### Push Migrations:
```bash
# Apply all migrations
supabase db push

# Or apply specific migration
supabase db push --include-seed
```

---

## Option 3: Manual SQL Execution

### Using psql:
```bash
# Get connection string from Supabase Dashboard > Settings > Database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migration
\i supabase/migrations/00001_initial_schema.sql
\i supabase/migrations/00002_hero_slides.sql
# ... continue for all files
```

---

## Post-Migration Verification

Run these queries to verify tables were created:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables (partial list):
-- addresses, cart_items, carts, categories, coupons,
-- delivery_slots, fraud_checks, hero_slides, loyalty_points,
-- notification_preferences, notifications, order_items, orders,
-- payment_attempts, points_transactions, price_alerts, price_history,
-- product_discounts, products, profiles, returns, return_items,
-- reviews, stock_alerts, store_credits, store_settings,
-- support_tickets, vendors, vendor_metrics, wishlists

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

---

## Troubleshooting

### "relation already exists"
- The table was already created
- Use `CREATE TABLE IF NOT EXISTS` or skip that migration

### "function does not exist"
- Run migrations in order
- The function is defined in an earlier migration

### "permission denied"
- Make sure you're using the postgres user
- Or use the service_role key

### RLS blocking queries
- Use service_role key for admin operations
- Check RLS policies are correctly set up

---

## Environment Variables

After migration, ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For cron job authentication
CRON_SECRET=your-secure-random-string
```

---

## Tables Created by Automation Migration

The `20240126_automation_system.sql` creates:

| Table | Purpose |
|-------|---------|
| `price_history` | Track product price changes over time |
| `price_alerts` | User price drop subscriptions |
| `loyalty_points` | User loyalty point balances |
| `points_transactions` | Loyalty point transaction history |
| `fraud_checks` | Fraud detection results for orders |
| `payment_attempts` | Payment attempt tracking |
| `vendor_metrics` | Vendor performance scores |
| `product_discounts` | Active product discounts |
| `notification_preferences` | User notification settings |
| `wishlists` | User product wishlists |

Plus triggers for:
- Auto price tracking on product updates
- Auto loyalty initialization for new users
- Auto timestamp updates

---

## Next Steps

After migrations are complete:

1. **Seed Initial Data** (optional)
   - Run seed scripts for categories, sample products

2. **Create Admin User**
   - Sign up through the app
   - Update role to 'admin' in profiles table

3. **Configure Cron Jobs**
   - Set `CRON_SECRET` environment variable
   - Deploy to Vercel for cron job scheduling

4. **Test the System**
   - Create test orders
   - Verify automation triggers work
