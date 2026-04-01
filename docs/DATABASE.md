# Database Schema

Database: Supabase (PostgreSQL)  
Migrations: `supabase/migrations/`  

## Conventions

- **Prices** are stored as integers in pence (e.g., `price_pence = 149` means GBP 1.49).
- **Soft delete** via `is_active = false` on products and categories. No hard deletes.
- **UUIDs** for all primary keys (`gen_random_uuid()`).
- **Timestamps** use `TIMESTAMPTZ` with `DEFAULT NOW()`.
- **`updated_at`** columns are auto-updated via `update_updated_at()` trigger.
- **Row-Level Security (RLS)** is enabled on all tables.
- **Atomic operations** via RPC: `decrement_stock()`, `validate_coupon()`, `increment_coupon_usage()`.

---

## Tables

### profiles

Extends Supabase `auth.users`. Created automatically on signup via `handle_new_user()` trigger.

| Column      | Type        | Notes                                      |
|-------------|-------------|--------------------------------------------|
| id          | UUID (PK)   | References `auth.users(id)` ON DELETE CASCADE |
| email       | TEXT UNIQUE  | Required                                   |
| full_name   | TEXT         |                                            |
| phone       | TEXT         |                                            |
| role        | TEXT         | `'customer'` (default) or `'admin'`        |
| created_at  | TIMESTAMPTZ  |                                            |
| updated_at  | TIMESTAMPTZ  |                                            |

**RLS:** Users see/edit own profile. Admins see all.

---

### products

Core product catalog.

| Column                   | Type           | Notes                                   |
|--------------------------|----------------|-----------------------------------------|
| id                       | UUID (PK)      |                                         |
| name                     | TEXT NOT NULL   |                                         |
| slug                     | TEXT UNIQUE     |                                         |
| description              | TEXT           | Full description (may contain HTML)      |
| short_description        | TEXT           | Plain text summary                       |
| sku                      | TEXT UNIQUE    |                                          |
| barcode                  | TEXT           |                                          |
| price_pence              | INT NOT NULL   | Price in pence (GBP)                     |
| compare_at_price_pence   | INT            | Original price for sale display          |
| cost_price_pence         | INT            | Cost to business                         |
| stock_quantity           | INT            | Default 0                                |
| low_stock_threshold      | INT            | Default 10                               |
| track_inventory          | BOOLEAN        | Default true                             |
| allow_backorder          | BOOLEAN        | Default false                            |
| unit                     | TEXT           | Default 'each'                           |
| unit_value               | DECIMAL(10,3)  |                                         |
| brand                    | TEXT           |                                          |
| is_vegan                 | BOOLEAN        | Dietary flag                             |
| is_vegetarian            | BOOLEAN        | Dietary flag                             |
| is_gluten_free           | BOOLEAN        | Dietary flag                             |
| is_organic               | BOOLEAN        | Dietary flag                             |
| allergens                | TEXT[]         | Array of allergen names                  |
| nutritional_info         | JSONB          | Structured nutrition data                |
| image_url                | TEXT           | Primary image                            |
| images                   | TEXT[]         | Additional images                        |
| is_active                | BOOLEAN        | Soft delete flag (default true)          |
| is_featured              | BOOLEAN        | Homepage featured flag                   |
| vendor_id                | UUID FK        | References `vendors(id)` (nullable)      |
| approval_status          | TEXT           | `'pending'`, `'approved'`, `'rejected'`  |
| meta_title               | TEXT           | SEO                                      |
| meta_description         | TEXT           | SEO                                      |

**Indexes:** `slug`, `is_active`, `is_featured`, full-text GIN on `name || description || brand`  
**RLS:** Public read. Admin/vendor write.

---

### categories

Hierarchical product categories with self-referencing parent.

| Column        | Type         | Notes                              |
|---------------|--------------|------------------------------------|
| id            | UUID (PK)    |                                    |
| name          | TEXT NOT NULL |                                    |
| slug          | TEXT UNIQUE  |                                    |
| description   | TEXT         |                                    |
| image_url     | TEXT         |                                    |
| parent_id     | UUID FK      | Self-reference for subcategories   |
| display_order | INT          | Default 0                          |
| is_active     | BOOLEAN      | Soft delete (default true)         |

**Indexes:** `slug`, `parent_id`  
**RLS:** Public read. Admin write.

---

### product_categories

Many-to-many join between products and categories.

| Column      | Type     | Notes                    |
|-------------|----------|--------------------------|
| product_id  | UUID FK  | References `products(id)` |
| category_id | UUID FK  | References `categories(id)` |

**PK:** Composite `(product_id, category_id)`  
**Indexes:** `category_id`  
**RLS:** Public read. Admin write.

---

### orders

Customer orders with full delivery and payment info.

| Column                      | Type          | Notes                                         |
|-----------------------------|---------------|-----------------------------------------------|
| id                          | UUID (PK)     |                                               |
| order_number                | TEXT UNIQUE   | Format: `ORD-XXXXXX`                         |
| user_id                     | UUID FK       | References `profiles(id)` (nullable for guest)|
| customer_email              | TEXT NOT NULL |                                                |
| customer_name               | TEXT NOT NULL |                                                |
| customer_phone              | TEXT          |                                                |
| delivery_address_line_1     | TEXT NOT NULL |                                                |
| delivery_address_line_2     | TEXT          |                                                |
| delivery_city               | TEXT NOT NULL |                                                |
| delivery_county             | TEXT          |                                                |
| delivery_postcode           | TEXT NOT NULL |                                                |
| delivery_instructions       | TEXT          |                                                |
| delivery_slot_id            | UUID FK       | References `delivery_slots(id)`               |
| delivery_date               | DATE          |                                                |
| delivery_time_start         | TIME          |                                                |
| delivery_time_end           | TIME          |                                                |
| subtotal_pence              | INT NOT NULL  |                                                |
| delivery_fee_pence          | INT           | Default 0                                     |
| discount_pence              | INT           | Default 0                                     |
| total_pence                 | INT NOT NULL  |                                                |
| coupon_id                   | UUID FK       | References `coupons(id)`                      |
| coupon_code                 | TEXT          |                                                |
| stripe_payment_intent_id    | TEXT          |                                                |
| stripe_checkout_session_id  | TEXT          | Uniqueness enforces webhook idempotency       |
| payment_status              | TEXT          | `pending`, `paid`, `failed`, `refunded`, `partially_refunded` |
| status                      | TEXT          | `pending`, `confirmed`, `processing`, `ready_for_delivery`, `out_for_delivery`, `delivered`, `cancelled` |
| paid_at                     | TIMESTAMPTZ   |                                               |
| confirmed_at                | TIMESTAMPTZ   |                                               |
| dispatched_at               | TIMESTAMPTZ   |                                               |
| delivered_at                | TIMESTAMPTZ   |                                               |
| cancelled_at                | TIMESTAMPTZ   |                                               |
| cancellation_reason         | TEXT          |                                                |
| notes                       | TEXT          |                                                |

**Indexes:** `user_id`, `status`, `order_number`  
**RLS:** Users see own orders. Admins see/manage all.

---

### order_items

Line items within an order. Product info is denormalized for historical accuracy.

| Column            | Type          | Notes                               |
|-------------------|---------------|--------------------------------------|
| id                | UUID (PK)     |                                      |
| order_id          | UUID FK       | References `orders(id)` CASCADE      |
| product_id        | UUID FK       | References `products(id)` SET NULL   |
| product_name      | TEXT NOT NULL  | Denormalized                         |
| product_sku       | TEXT          | Denormalized                         |
| product_image_url | TEXT          | Denormalized                         |
| quantity          | INT NOT NULL  |                                      |
| unit_price_pence  | INT NOT NULL  |                                      |
| total_price_pence | INT NOT NULL  |                                      |

**RLS:** Users see own order items. Admins see all.

---

### vendors

Marketplace vendor accounts with Stripe Connect integration.

| Column                      | Type           | Notes                                 |
|-----------------------------|----------------|---------------------------------------|
| id                          | UUID (PK)      |                                       |
| user_id                     | UUID FK UNIQUE | References `profiles(id)`             |
| business_name               | TEXT NOT NULL  |                                        |
| slug                        | TEXT UNIQUE    |                                        |
| description                 | TEXT           |                                        |
| logo_url                    | TEXT           |                                        |
| banner_url                  | TEXT           |                                        |
| email                       | TEXT NOT NULL  |                                        |
| phone                       | TEXT           |                                        |
| address_line_1              | TEXT           |                                        |
| city                        | TEXT           |                                        |
| postcode                    | TEXT           |                                        |
| company_number              | TEXT           | UK Companies House number              |
| vat_number                  | TEXT           |                                        |
| stripe_account_id           | TEXT           | Stripe Connect account ID              |
| stripe_onboarding_complete  | BOOLEAN        | Default false                          |
| stripe_charges_enabled      | BOOLEAN        | Default false                          |
| stripe_payouts_enabled      | BOOLEAN        | Default false                          |
| status                      | TEXT           | `pending`, `approved`, `suspended`, `rejected` |
| is_verified                 | BOOLEAN        | Default false                          |
| commission_rate             | DECIMAL(5,2)   | Platform fee percentage (default 15%) |
| total_sales_pence           | BIGINT         | Aggregated via triggers                |
| total_orders                | INT            | Aggregated via triggers                |
| rating                      | DECIMAL(3,2)   | Average rating                        |
| review_count                | INT            |                                        |

---

### vendor_applications

Applications from users wanting to become vendors.

| Column               | Type       | Notes                                            |
|----------------------|------------|--------------------------------------------------|
| id                   | UUID (PK)  |                                                  |
| user_id              | UUID FK    | References `profiles(id)`                        |
| business_name        | TEXT       |                                                  |
| business_type        | TEXT       | `sole_trader`, `limited_company`, `partnership`, `other` |
| description          | TEXT       |                                                  |
| product_categories   | TEXT[]     | Intended product types                           |
| expected_monthly_sales | TEXT     |                                                  |
| website_url          | TEXT       |                                                  |
| status               | TEXT       | `pending`, `under_review`, `approved`, `rejected`|
| admin_notes          | TEXT       |                                                  |
| reviewed_by          | UUID FK    | Admin who reviewed                               |
| reviewed_at          | TIMESTAMPTZ|                                                  |

---

### coupons

Discount coupons with usage tracking.

| Column             | Type          | Notes                                          |
|--------------------|---------------|-------------------------------------------------|
| id                 | UUID (PK)     |                                                 |
| code               | TEXT UNIQUE   | Coupon code (uppercase)                         |
| description        | TEXT          |                                                 |
| discount_type      | TEXT NOT NULL | `percentage`, `fixed_amount`, `free_shipping`   |
| discount_value     | DECIMAL(10,2) | Percentage or pence amount                     |
| min_order_pence    | INT           | Minimum cart total (default 0)                  |
| max_discount_pence | INT           | Cap on discount amount                          |
| usage_limit        | INT           | Total uses allowed (null = unlimited)           |
| usage_count        | INT           | Current total uses (default 0)                  |
| per_user_limit     | INT           | Max uses per user (default 1)                   |
| applies_to         | TEXT          | `all`, `products`, `categories`, `vendors`      |
| applicable_ids     | UUID[]        | Specific product/category/vendor IDs            |
| exclude_sale_items | BOOLEAN       | Default false                                   |
| first_order_only   | BOOLEAN       | Default false                                   |
| vendor_id          | UUID FK       | Vendor-scoped coupon (nullable)                 |
| starts_at          | TIMESTAMPTZ   |                                                 |
| expires_at         | TIMESTAMPTZ   |                                                 |
| is_active          | BOOLEAN       | Default true                                    |

**Indexes:** `code`, composite `(is_active, starts_at, expires_at)`  
**RLS:** Public read (active only). Admin/vendor write.

---

### product_reviews

Customer reviews with moderation workflow.

| Column              | Type        | Notes                                     |
|---------------------|-------------|-------------------------------------------|
| id                  | UUID (PK)   |                                           |
| product_id          | UUID FK     | References `products(id)` CASCADE         |
| user_id             | UUID FK     | References `profiles(id)` CASCADE         |
| order_id            | UUID FK     | References `orders(id)` SET NULL          |
| rating              | INT         | 1-5 (CHECK constraint)                   |
| title               | TEXT        |                                           |
| content             | TEXT        |                                           |
| images              | TEXT[]      | Review images (default '{}')              |
| is_verified_purchase| BOOLEAN     | Auto-set based on order history           |
| status              | TEXT        | `pending`, `approved`, `rejected`         |
| helpful_count       | INT         | Default 0                                 |
| not_helpful_count   | INT         | Default 0                                 |
| admin_notes         | TEXT        |                                           |
| reviewed_by         | UUID FK     | Admin who moderated                       |
| reviewed_at         | TIMESTAMPTZ |                                           |

---

### flash_deals

Time-limited promotional pricing.

| Column               | Type        | Notes                                         |
|----------------------|-------------|------------------------------------------------|
| id                   | UUID (PK)   |                                                |
| title                | TEXT        |                                                |
| slug                 | TEXT UNIQUE |                                                |
| description          | TEXT        |                                                |
| product_id           | UUID FK     | References `products(id)` CASCADE              |
| deal_price_pence     | INT         |                                                |
| original_price_pence | INT         |                                                |
| discount_percentage  | INT         | GENERATED ALWAYS (computed from prices)        |
| starts_at            | TIMESTAMPTZ |                                                |
| ends_at              | TIMESTAMPTZ |                                                |
| max_quantity         | INT         | Stock limit for deal                           |
| claimed_quantity     | INT         | Default 0                                      |
| is_active            | BOOLEAN     |                                                |
| is_featured          | BOOLEAN     |                                                |
| banner_image_url     | TEXT        |                                                |

---

### hero_slides

Homepage banner/carousel slides.

| Column        | Type         | Notes                      |
|---------------|--------------|----------------------------|
| id            | UUID (PK)    |                            |
| title         | TEXT NOT NULL |                            |
| subtitle      | TEXT         |                            |
| image_url     | TEXT NOT NULL |                            |
| button_text   | TEXT         |                            |
| button_link   | TEXT         |                            |
| is_active     | BOOLEAN      | Default true               |
| display_order | INT          | Default 0                  |

**Indexes:** `display_order`, `is_active`  
**RLS:** Public read. Admin write.

---

### addresses

Customer delivery addresses.

| Column                | Type        | Notes                              |
|-----------------------|-------------|------------------------------------|
| id                    | UUID (PK)   |                                    |
| user_id               | UUID FK     | References `profiles(id)` CASCADE  |
| label                 | TEXT        | Default 'Home'                     |
| address_line_1        | TEXT NOT NULL|                                   |
| address_line_2        | TEXT        |                                    |
| city                  | TEXT NOT NULL|                                   |
| county                | TEXT        |                                    |
| postcode              | TEXT NOT NULL|                                   |
| is_default            | BOOLEAN     | Default false                      |
| delivery_instructions | TEXT        |                                    |

**Indexes:** `user_id`  
**RLS:** Users manage own addresses only.

---

### wishlists

Named wishlists with optional public sharing.

| Column      | Type         | Notes                                   |
|-------------|--------------|-----------------------------------------|
| id          | UUID (PK)    |                                         |
| user_id     | UUID FK      | References `profiles(id)` CASCADE       |
| name        | TEXT         | Default 'My Wishlist'                   |
| is_public   | BOOLEAN      | Default false                           |
| share_token | TEXT UNIQUE  | Auto-generated hex token for sharing    |

**Related:** `wishlist_items` (wishlist_id FK, product_id FK, added_price_pence, notes)

---

## Additional Tables

These tables are created in later migrations:

| Table                | Migration | Purpose                              |
|----------------------|-----------|--------------------------------------|
| store_settings       | 00003     | Site-wide configuration key-values   |
| multibuy_offers      | 00004     | Buy X get Y promotional offers       |
| vendor_orders        | 00007     | Vendor portion of orders + transfers |
| vendor_payouts       | 00007     | Stripe Connect payout records        |
| coupon_usage         | 00009     | Per-user coupon usage tracking       |
| review_votes         | 00008     | Helpful/not-helpful review votes     |
| wishlist_items       | 00008     | Products in wishlists                |
| referrals            | 00010     | Referral codes and rewards           |
| loyalty_points       | 00011     | Customer loyalty point balances      |
| support_tickets      | 00012     | Customer support tickets             |
| newsletter_subscribers | 00013  | Newsletter email list                |
| notifications        | 00014     | User notifications and preferences   |
| recently_viewed      | 00015     | Recently viewed product history      |
| delivery_slots       | 00001     | Delivery time windows                |
| delivery_zones       | 00016     | Geographic delivery areas            |
| chat_conversations   | 00017     | Live chat conversations              |
| chat_messages        | 00017     | Live chat messages                   |
| chatbot_intents      | 00018     | Chatbot intent definitions           |
| chatbot_faqs         | 00018     | Chatbot FAQ entries                  |
