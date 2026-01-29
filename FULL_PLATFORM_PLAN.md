# UK Grocery Marketplace - Full Platform Plan
## 100K+ Lines of Code - Enterprise E-Commerce Platform

---

# TABLE OF CONTENTS

1. [Platform Overview](#platform-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Phase 1: Core Foundation](#phase-1-core-foundation)
5. [Phase 2: Enhanced Shopping](#phase-2-enhanced-shopping)
6. [Phase 3: Vendor Ecosystem](#phase-3-vendor-ecosystem)
7. [Phase 4: Admin & Operations](#phase-4-admin--operations)
8. [Phase 5: Marketing & Growth](#phase-5-marketing--growth)
9. [Phase 6: Customer Experience](#phase-6-customer-experience)
10. [Phase 7: Advanced Features](#phase-7-advanced-features)
11. [Phase 8: Mobile & PWA](#phase-8-mobile--pwa)
12. [Phase 9: Analytics & AI](#phase-9-analytics--ai)
13. [Phase 10: Enterprise & Scale](#phase-10-enterprise--scale)
14. [File Structure](#file-structure)
15. [API Reference](#api-reference)
16. [Testing Strategy](#testing-strategy)
17. [Deployment](#deployment)

---

# PLATFORM OVERVIEW

## Vision
Build a world-class UK grocery marketplace rivaling Amazon Fresh, Ocado, and Deliveroo, supporting:
- **50,000+ Products**
- **1,000+ Vendors**
- **100,000+ Users**
- **10,000+ Daily Orders**

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, Radix UI, Framer Motion |
| State | Zustand, React Query, React Hook Form |
| Backend | Next.js API Routes, Server Actions |
| Database | Supabase (PostgreSQL), Redis |
| Auth | Supabase Auth, NextAuth.js |
| Payments | Stripe, PayPal, Apple Pay, Google Pay |
| Search | Algolia / Meilisearch |
| Storage | Supabase Storage, Cloudinary |
| Email | Resend, SendGrid |
| SMS | Twilio |
| Push | Firebase Cloud Messaging |
| Maps | Google Maps, Mapbox |
| Analytics | PostHog, Mixpanel, Google Analytics |
| Monitoring | Sentry, LogRocket |
| CI/CD | GitHub Actions, Vercel |
| Testing | Vitest, Playwright, Cypress |

---

# ARCHITECTURE

## System Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN (Vercel Edge)                        │
├─────────────────────────────────────────────────────────────────┤
│                         Load Balancer                            │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│   Web App   │  Admin App  │ Vendor App  │  Mobile API │   Docs  │
│  (Next.js)  │  (Next.js)  │  (Next.js)  │  (Next.js)  │ (Nextra)│
├─────────────┴─────────────┴─────────────┴─────────────┴─────────┤
│                      API Gateway / BFF                           │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│    Auth     │   Products  │   Orders    │   Payments  │  Search │
│   Service   │   Service   │   Service   │   Service   │ Service │
├─────────────┴─────────────┴─────────────┴─────────────┴─────────┤
│                    Message Queue (Redis/BullMQ)                  │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│  PostgreSQL │    Redis    │   Algolia   │  Supabase   │   S3    │
│  (Supabase) │   (Cache)   │  (Search)   │  (Storage)  │ (Media) │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘
```

## Domain-Driven Design
```
src/
├── domains/
│   ├── auth/           # Authentication & Authorization
│   ├── catalog/        # Products, Categories, Brands
│   ├── cart/           # Shopping Cart
│   ├── checkout/       # Checkout Process
│   ├── orders/         # Order Management
│   ├── payments/       # Payment Processing
│   ├── shipping/       # Delivery & Logistics
│   ├── vendors/        # Vendor Management
│   ├── customers/      # Customer Profiles
│   ├── reviews/        # Reviews & Ratings
│   ├── promotions/     # Coupons, Deals, Campaigns
│   ├── notifications/  # Email, SMS, Push
│   ├── search/         # Search & Discovery
│   ├── analytics/      # Tracking & Reports
│   └── support/        # Help & Tickets
```

---

# DATABASE SCHEMA

## Complete Database (40+ Tables)

### Core Tables
```sql
-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  locale TEXT DEFAULT 'en-GB',
  currency TEXT DEFAULT 'GBP',
  timezone TEXT DEFAULT 'Europe/London',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  last_login_at TIMESTAMPTZ,
  login_count INT DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  loyalty_points INT DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  county TEXT,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'GB',
  phone TEXT,
  delivery_instructions TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default_shipping BOOLEAN DEFAULT FALSE,
  is_default_billing BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions tracking
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  device_type TEXT,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  location_city TEXT,
  location_country TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email_orders BOOLEAN DEFAULT TRUE,
  email_promotions BOOLEAN DEFAULT TRUE,
  email_newsletter BOOLEAN DEFAULT TRUE,
  email_price_drops BOOLEAN DEFAULT TRUE,
  email_back_in_stock BOOLEAN DEFAULT TRUE,
  sms_orders BOOLEAN DEFAULT TRUE,
  sms_promotions BOOLEAN DEFAULT FALSE,
  push_orders BOOLEAN DEFAULT TRUE,
  push_promotions BOOLEAN DEFAULT TRUE,
  push_chat BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- VENDORS & STORES
-- =====================================================

-- Vendor applications
CREATE TABLE vendor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  registration_number TEXT,
  vat_number TEXT,
  business_address TEXT NOT NULL,
  business_postcode TEXT NOT NULL,
  business_phone TEXT NOT NULL,
  business_email TEXT NOT NULL,
  website_url TEXT,
  product_categories TEXT[],
  estimated_products INT,
  annual_revenue TEXT,
  years_in_business INT,
  description TEXT,
  documents JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'more_info_needed')),
  reviewer_id UUID REFERENCES profiles(id),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors (approved sellers)
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  application_id UUID REFERENCES vendor_applications(id),
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  legal_name TEXT,
  registration_number TEXT,
  vat_number TEXT,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  short_description TEXT,
  business_address TEXT,
  business_postcode TEXT,
  business_phone TEXT,
  business_email TEXT,
  support_email TEXT,
  website_url TEXT,
  social_links JSONB DEFAULT '{}',

  -- Banking
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_sort_code TEXT,
  stripe_account_id TEXT,

  -- Settings
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  min_order_amount_pence INT DEFAULT 0,
  free_delivery_threshold_pence INT,
  delivery_radius_miles INT,
  preparation_time_minutes INT DEFAULT 30,

  -- Ratings
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  total_products INT DEFAULT 0,
  total_orders INT DEFAULT 0,
  total_sales_pence BIGINT DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor staff members
CREATE TABLE vendor_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'manager', 'staff')),
  permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, user_id)
);

-- Vendor operating hours
CREATE TABLE vendor_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
  is_open BOOLEAN DEFAULT TRUE,
  open_time TIME,
  close_time TIME,
  break_start TIME,
  break_end TIME,
  UNIQUE(vendor_id, day_of_week)
);

-- Vendor holidays/closures
CREATE TABLE vendor_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor payouts
CREATE TABLE vendor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  amount_pence BIGINT NOT NULL,
  commission_pence BIGINT NOT NULL,
  net_amount_pence BIGINT NOT NULL,
  currency TEXT DEFAULT 'GBP',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method TEXT DEFAULT 'bank_transfer',
  stripe_transfer_id TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  orders_count INT DEFAULT 0,
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS & CATALOG
-- =====================================================

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  icon TEXT,
  color TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  products_count INT DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  products_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id),

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  short_description TEXT,
  description TEXT,

  -- Pricing
  price_pence INT NOT NULL,
  compare_at_price_pence INT,
  cost_price_pence INT,
  tax_rate DECIMAL(5,2) DEFAULT 20.00,
  tax_included BOOLEAN DEFAULT TRUE,

  -- Units
  unit TEXT DEFAULT 'each',
  unit_value DECIMAL(10,2),
  min_quantity INT DEFAULT 1,
  max_quantity INT DEFAULT 99,
  quantity_step INT DEFAULT 1,

  -- Inventory
  track_inventory BOOLEAN DEFAULT TRUE,
  stock_quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  allow_backorder BOOLEAN DEFAULT FALSE,

  -- Media
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  video_url TEXT,

  -- Attributes
  weight_grams INT,
  dimensions JSONB,
  ingredients TEXT,
  nutritional_info JSONB,
  allergens TEXT[],
  storage_instructions TEXT,

  -- Dietary
  is_organic BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_gluten_free BOOLEAN DEFAULT FALSE,
  is_dairy_free BOOLEAN DEFAULT FALSE,
  is_halal BOOLEAN DEFAULT FALSE,
  is_kosher BOOLEAN DEFAULT FALSE,

  -- Flags
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  has_offer BOOLEAN DEFAULT FALSE,
  offer_badge TEXT,

  -- Ratings
  avg_rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,

  -- Stats
  view_count INT DEFAULT 0,
  wishlist_count INT DEFAULT 0,
  purchase_count INT DEFAULT 0,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],

  -- Status
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),

  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, slug)
);

-- Product categories (many-to-many)
CREATE TABLE product_categories (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (product_id, category_id)
);

-- Product variants (size, color, etc.)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  price_pence INT,
  compare_at_price_pence INT,
  cost_price_pence INT,
  stock_quantity INT DEFAULT 0,
  image_url TEXT,
  options JSONB NOT NULL DEFAULT '{}',
  weight_grams INT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product options (e.g., Size, Color)
CREATE TABLE product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  values TEXT[] NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product bundles
CREATE TABLE product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  bundle_price_pence INT NOT NULL,
  compare_at_price_pence INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bundle_items (
  bundle_id UUID REFERENCES product_bundles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1,
  PRIMARY KEY (bundle_id, product_id)
);

-- Product tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_tags (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- Related products
CREATE TABLE related_products (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  related_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  relation_type TEXT DEFAULT 'related' CHECK (relation_type IN ('related', 'upsell', 'cross_sell', 'frequently_bought')),
  sort_order INT DEFAULT 0,
  PRIMARY KEY (product_id, related_product_id)
);

-- =====================================================
-- SHOPPING CART
-- =====================================================

-- Shopping carts
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  coupon_code TEXT,
  discount_pence INT DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  price_pence INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cart_id, product_id, variant_id)
);

-- Saved for later
CREATE TABLE saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, variant_id)
);

-- =====================================================
-- ORDERS
-- =====================================================

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  vendor_id UUID REFERENCES vendors(id),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'processing', 'ready_for_pickup',
    'out_for_delivery', 'delivered', 'cancelled', 'refunded'
  )),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'authorized', 'paid', 'partially_refunded', 'refunded', 'failed'
  )),
  fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
    'unfulfilled', 'partially_fulfilled', 'fulfilled', 'returned'
  )),

  -- Totals
  subtotal_pence INT NOT NULL,
  discount_pence INT DEFAULT 0,
  shipping_pence INT DEFAULT 0,
  tax_pence INT DEFAULT 0,
  tip_pence INT DEFAULT 0,
  total_pence INT NOT NULL,

  -- Currency
  currency TEXT DEFAULT 'GBP',
  exchange_rate DECIMAL(10,6) DEFAULT 1,

  -- Shipping
  shipping_method TEXT,
  shipping_carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Addresses
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,

  -- Customer info (for guest checkout)
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_name TEXT,

  -- Payment
  payment_method TEXT,
  payment_intent_id TEXT,

  -- Coupon
  coupon_id UUID,
  coupon_code TEXT,

  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  gift_message TEXT,
  is_gift BOOLEAN DEFAULT FALSE,

  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Source
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'pos', 'api')),
  ip_address INET,
  user_agent TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  vendor_id UUID REFERENCES vendors(id),

  -- Product snapshot
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image TEXT,
  variant_name TEXT,
  options JSONB,

  -- Pricing
  quantity INT NOT NULL,
  unit_price_pence INT NOT NULL,
  discount_pence INT DEFAULT 0,
  tax_pence INT DEFAULT 0,
  total_pence INT NOT NULL,

  -- Fulfillment
  fulfilled_quantity INT DEFAULT 0,
  refunded_quantity INT DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order status history
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order refunds
CREATE TABLE order_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount_pence INT NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'rejected')),
  stripe_refund_id TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DELIVERY & SHIPPING
-- =====================================================

-- Delivery zones
CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  postcodes TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping rates
CREATE TABLE shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES delivery_zones(id),
  name TEXT NOT NULL,
  description TEXT,
  rate_type TEXT DEFAULT 'flat' CHECK (rate_type IN ('flat', 'weight', 'price', 'free')),
  rate_pence INT DEFAULT 0,
  min_order_pence INT,
  max_weight_grams INT,
  min_delivery_days INT DEFAULT 1,
  max_delivery_days INT DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery slots
CREATE TABLE delivery_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_orders INT DEFAULT 10,
  booked_orders INT DEFAULT 0,
  premium_fee_pence INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(vendor_id, date, start_time)
);

-- =====================================================
-- PAYMENTS
-- =====================================================

-- Payment methods (saved cards, etc.)
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE,
  type TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INT,
  card_exp_year INT,
  billing_address JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('charge', 'refund', 'payout')),
  amount_pence INT NOT NULL,
  currency TEXT DEFAULT 'GBP',
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_refund_id TEXT,
  payment_method TEXT,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROMOTIONS & MARKETING
-- =====================================================

-- Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_pence INT,
  max_discount_pence INT,
  usage_limit INT,
  usage_count INT DEFAULT 0,
  per_user_limit INT DEFAULT 1,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'products', 'categories', 'vendors')),
  applicable_ids UUID[],
  exclude_sale_items BOOLEAN DEFAULT FALSE,
  first_order_only BOOLEAN DEFAULT FALSE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupon usage tracking
CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  discount_pence INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flash deals
CREATE TABLE flash_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  deal_price_pence INT NOT NULL,
  original_price_pence INT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_quantity INT,
  claimed_quantity INT DEFAULT 0,
  per_user_limit INT DEFAULT 1,
  banner_image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('banner', 'email', 'push', 'sms')),
  content JSONB NOT NULL,
  target_audience JSONB,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  position TEXT DEFAULT 'homepage' CHECK (position IN ('homepage', 'category', 'product', 'cart', 'checkout')),
  sort_order INT DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REVIEWS & RATINGS
-- =====================================================

-- Product reviews
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  content TEXT,
  pros TEXT[],
  cons TEXT[],
  images TEXT[],
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_recommended BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  vendor_response TEXT,
  vendor_responded_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES profiles(id),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Review votes
CREATE TABLE review_votes (
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (review_id, user_id)
);

-- Vendor reviews
CREATE TABLE vendor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  delivery_rating INT CHECK (delivery_rating BETWEEN 1 AND 5),
  service_rating INT CHECK (service_rating BETWEEN 1 AND 5),
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, user_id, order_id)
);

-- =====================================================
-- WISHLISTS
-- =====================================================

-- Wishlists
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'My Wishlist',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist items
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  added_price_pence INT,
  notes TEXT,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wishlist_id, product_id, variant_id)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  action_url TEXT,
  data JSONB DEFAULT '{}',
  channel TEXT DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'sms', 'push')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- =====================================================
-- CUSTOMER SUPPORT
-- =====================================================

-- Support tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  order_id UUID REFERENCES orders(id),
  vendor_id UUID REFERENCES vendors(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'order_issue', 'payment', 'delivery', 'product_quality',
    'refund', 'account', 'vendor', 'other'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'waiting_vendor', 'resolved', 'closed')),
  assigned_to UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket messages
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  sender_type TEXT DEFAULT 'customer' CHECK (sender_type IN ('customer', 'support', 'vendor', 'system')),
  message TEXT NOT NULL,
  attachments TEXT[],
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ
CREATE TABLE faq_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS & TRACKING
-- =====================================================

-- Page views
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  session_id TEXT,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product views
CREATE TABLE product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  session_id TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search queries
CREATE TABLE search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  session_id TEXT,
  query TEXT NOT NULL,
  results_count INT,
  clicked_product_id UUID REFERENCES products(id),
  filters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abandoned carts
CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id),
  user_id UUID REFERENCES profiles(id),
  email TEXT,
  cart_value_pence INT,
  items_count INT,
  recovery_email_sent BOOLEAN DEFAULT FALSE,
  recovery_email_sent_at TIMESTAMPTZ,
  recovered BOOLEAN DEFAULT FALSE,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LOYALTY & REWARDS
-- =====================================================

-- Loyalty tiers
CREATE TABLE loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  min_points INT NOT NULL,
  points_multiplier DECIMAL(3,2) DEFAULT 1.0,
  benefits JSONB DEFAULT '[]',
  badge_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points transactions
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'bonus', 'adjustment')),
  points INT NOT NULL,
  balance_after INT NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_type TEXT DEFAULT 'points',
  reward_value INT,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- =====================================================
-- CONTENT MANAGEMENT
-- =====================================================

-- Pages
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  template TEXT DEFAULT 'default',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT & LOGGING
-- =====================================================

-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email logs
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  email_to TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  provider_id TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# PHASE 1: CORE FOUNDATION

## 1.1 Project Setup & Configuration

### Files to Create/Modify

```
src/
├── config/
│   ├── site.ts              # Site configuration
│   ├── navigation.ts        # Navigation menus
│   ├── seo.ts               # Default SEO settings
│   └── constants.ts         # App constants
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   ├── admin.ts         # Admin client
│   │   └── middleware.ts    # Auth middleware
│   ├── stripe/
│   │   ├── client.ts        # Stripe client
│   │   └── webhooks.ts      # Webhook handlers
│   ├── redis/
│   │   └── client.ts        # Redis client
│   ├── email/
│   │   ├── client.ts        # Email client (Resend)
│   │   └── templates/       # Email templates
│   ├── sms/
│   │   └── client.ts        # SMS client (Twilio)
│   └── utils/
│       ├── format.ts        # Formatting utilities
│       ├── validation.ts    # Validation schemas
│       ├── dates.ts         # Date utilities
│       └── crypto.ts        # Encryption utilities
├── types/
│   ├── database.ts          # Database types
│   ├── api.ts               # API types
│   └── common.ts            # Common types
└── middleware.ts            # Next.js middleware
```

### Site Configuration
```typescript
// src/config/site.ts
export const siteConfig = {
  name: 'FreshMart UK',
  description: 'Fresh groceries delivered to your door',
  url: 'https://freshmart.uk',
  ogImage: 'https://freshmart.uk/og.jpg',
  links: {
    twitter: 'https://twitter.com/freshmart',
    github: 'https://github.com/freshmart',
  },
  creator: 'FreshMart Ltd',

  // Business settings
  currency: 'GBP',
  locale: 'en-GB',
  timezone: 'Europe/London',

  // Delivery settings
  minOrderAmount: 1500, // £15.00
  freeDeliveryThreshold: 5000, // £50.00
  standardDeliveryFee: 399, // £3.99
  expressDeliveryFee: 699, // £6.99

  // Contact
  supportEmail: 'support@freshmart.uk',
  supportPhone: '+44 800 123 4567',

  // Social
  social: {
    facebook: 'https://facebook.com/freshmart',
    instagram: 'https://instagram.com/freshmart',
    twitter: 'https://twitter.com/freshmart',
  },
}
```

## 1.2 Authentication System

### Features
- Email/password login
- Social login (Google, Facebook, Apple)
- Phone number verification
- Two-factor authentication (TOTP)
- Magic link login
- Session management
- Password reset
- Email verification

### Files
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   └── api/
│       └── auth/
│           ├── callback/
│           │   └── route.ts
│           ├── verify-phone/
│           │   └── route.ts
│           ├── 2fa/
│           │   ├── setup/
│           │   │   └── route.ts
│           │   └── verify/
│           │       └── route.ts
│           └── sessions/
│               └── route.ts
├── components/
│   └── auth/
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       ├── SocialLogin.tsx
│       ├── TwoFactorSetup.tsx
│       ├── PhoneVerification.tsx
│       └── SessionManager.tsx
└── hooks/
    └── use-auth.ts
```

## 1.3 User Profile System

### Features
- Profile management
- Avatar upload
- Address book (multiple addresses)
- Payment methods
- Notification preferences
- Order history
- Account settings
- Account deletion

### Files
```
src/
├── app/
│   └── (account)/
│       ├── account/
│       │   ├── page.tsx           # Dashboard
│       │   ├── profile/
│       │   │   └── page.tsx
│       │   ├── addresses/
│       │   │   └── page.tsx
│       │   ├── payments/
│       │   │   └── page.tsx
│       │   ├── orders/
│       │   │   ├── page.tsx
│       │   │   └── [id]/
│       │   │       └── page.tsx
│       │   ├── notifications/
│       │   │   └── page.tsx
│       │   ├── security/
│       │   │   └── page.tsx
│       │   └── settings/
│       │       └── page.tsx
│       └── layout.tsx
├── components/
│   └── account/
│       ├── ProfileForm.tsx
│       ├── AvatarUpload.tsx
│       ├── AddressForm.tsx
│       ├── AddressCard.tsx
│       ├── PaymentMethodCard.tsx
│       ├── OrderCard.tsx
│       ├── OrderTimeline.tsx
│       └── AccountSidebar.tsx
└── api/
    └── account/
        ├── profile/
        │   └── route.ts
        ├── addresses/
        │   └── route.ts
        ├── payments/
        │   └── route.ts
        └── delete/
            └── route.ts
```

## 1.4 Core UI Components

### Component Library
```
src/components/
├── ui/                          # Base components (shadcn/ui)
│   ├── accordion.tsx
│   ├── alert.tsx
│   ├── alert-dialog.tsx
│   ├── aspect-ratio.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── breadcrumb.tsx
│   ├── button.tsx
│   ├── calendar.tsx
│   ├── card.tsx
│   ├── carousel.tsx
│   ├── checkbox.tsx
│   ├── collapsible.tsx
│   ├── command.tsx
│   ├── context-menu.tsx
│   ├── data-table.tsx
│   ├── date-picker.tsx
│   ├── dialog.tsx
│   ├── drawer.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── hover-card.tsx
│   ├── input.tsx
│   ├── input-otp.tsx
│   ├── label.tsx
│   ├── menubar.tsx
│   ├── navigation-menu.tsx
│   ├── pagination.tsx
│   ├── popover.tsx
│   ├── progress.tsx
│   ├── radio-group.tsx
│   ├── resizable.tsx
│   ├── scroll-area.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── skeleton.tsx
│   ├── slider.tsx
│   ├── sonner.tsx
│   ├── switch.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── textarea.tsx
│   ├── toast.tsx
│   ├── toggle.tsx
│   ├── toggle-group.tsx
│   └── tooltip.tsx
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Sidebar.tsx
│   ├── MobileNav.tsx
│   ├── SearchDialog.tsx
│   ├── CartSheet.tsx
│   └── UserMenu.tsx
└── common/
    ├── Logo.tsx
    ├── ThemeToggle.tsx
    ├── LoadingSpinner.tsx
    ├── EmptyState.tsx
    ├── ErrorBoundary.tsx
    ├── InfiniteScroll.tsx
    ├── ImageUpload.tsx
    ├── RichTextEditor.tsx
    ├── PriceDisplay.tsx
    ├── QuantitySelector.tsx
    ├── StarRating.tsx
    └── CountdownTimer.tsx
```

---

# PHASE 2: ENHANCED SHOPPING

## 2.1 Product Catalog

### Features
- Product listing with filters
- Category navigation
- Brand pages
- Product search
- Product comparison
- Recently viewed
- Product variants
- Product bundles

### Files
```
src/
├── app/
│   └── (shop)/
│       ├── products/
│       │   ├── page.tsx           # Product listing
│       │   └── [slug]/
│       │       └── page.tsx       # Product detail
│       ├── categories/
│       │   ├── page.tsx           # All categories
│       │   └── [slug]/
│       │       └── page.tsx       # Category products
│       ├── brands/
│       │   ├── page.tsx           # All brands
│       │   └── [slug]/
│       │       └── page.tsx       # Brand products
│       ├── search/
│       │   └── page.tsx           # Search results
│       └── compare/
│           └── page.tsx           # Product comparison
├── components/
│   └── products/
│       ├── ProductGrid.tsx
│       ├── ProductCard.tsx
│       ├── ProductDetail.tsx
│       ├── ProductGallery.tsx
│       ├── ProductInfo.tsx
│       ├── ProductVariants.tsx
│       ├── ProductTabs.tsx
│       ├── RelatedProducts.tsx
│       ├── ProductFilters.tsx
│       ├── ProductSort.tsx
│       ├── CategoryNav.tsx
│       ├── BrandList.tsx
│       ├── CompareTable.tsx
│       ├── RecentlyViewed.tsx
│       └── AddToCartButton.tsx
└── api/
    └── products/
        ├── route.ts               # List products
        ├── [id]/
        │   └── route.ts           # Single product
        ├── search/
        │   └── route.ts           # Search
        └── compare/
            └── route.ts           # Comparison data
```

## 2.2 Shopping Cart

### Features
- Add/remove items
- Update quantities
- Save for later
- Apply coupons
- Cart persistence (local + server)
- Cart merge on login
- Stock validation
- Price updates

### Files
```
src/
├── app/
│   └── (shop)/
│       └── cart/
│           └── page.tsx
├── components/
│   └── cart/
│       ├── CartSheet.tsx          # Slide-out cart
│       ├── CartPage.tsx           # Full cart page
│       ├── CartItem.tsx
│       ├── CartSummary.tsx
│       ├── CouponInput.tsx
│       ├── SavedItems.tsx
│       ├── CartEmpty.tsx
│       └── CartRecommendations.tsx
├── hooks/
│   └── use-cart.ts
├── stores/
│   └── cart-store.ts
└── api/
    └── cart/
        ├── route.ts               # Get/update cart
        ├── add/
        │   └── route.ts
        ├── remove/
        │   └── route.ts
        ├── coupon/
        │   └── route.ts
        └── merge/
            └── route.ts
```

## 2.3 Checkout System

### Features
- Guest checkout
- Multi-step checkout
- Address selection/entry
- Delivery slot selection
- Multiple payment methods
- Order summary
- Order confirmation
- Email receipts

### Files
```
src/
├── app/
│   └── (checkout)/
│       ├── checkout/
│       │   ├── page.tsx           # Checkout flow
│       │   ├── success/
│       │   │   └── page.tsx
│       │   └── layout.tsx
│       └── api/
│           └── checkout/
│               ├── route.ts       # Create order
│               ├── validate/
│               │   └── route.ts
│               └── payment-intent/
│                   └── route.ts
├── components/
│   └── checkout/
│       ├── CheckoutForm.tsx
│       ├── CheckoutSteps.tsx
│       ├── AddressStep.tsx
│       ├── DeliveryStep.tsx
│       ├── PaymentStep.tsx
│       ├── ReviewStep.tsx
│       ├── DeliverySlotPicker.tsx
│       ├── PaymentForm.tsx
│       ├── OrderSummary.tsx
│       ├── OrderConfirmation.tsx
│       └── GiftOptions.tsx
└── hooks/
    └── use-checkout.ts
```

## 2.4 Search & Discovery

### Features
- Full-text search
- Autocomplete
- Search suggestions
- Filters & facets
- Sort options
- Search history
- Popular searches
- "Did you mean?"

### Files
```
src/
├── components/
│   └── search/
│       ├── SearchDialog.tsx
│       ├── SearchInput.tsx
│       ├── SearchResults.tsx
│       ├── SearchSuggestions.tsx
│       ├── SearchFilters.tsx
│       ├── SearchHistory.tsx
│       ├── PopularSearches.tsx
│       └── NoResults.tsx
├── lib/
│   └── search/
│       ├── algolia.ts             # Algolia client
│       └── meilisearch.ts         # Meilisearch client
└── api/
    └── search/
        ├── route.ts               # Search
        ├── suggest/
        │   └── route.ts           # Autocomplete
        └── popular/
            └── route.ts           # Popular searches
```

---

# PHASE 3: VENDOR ECOSYSTEM

## 3.1 Vendor Registration

### Features
- Multi-step application
- Document upload
- Business verification
- Terms acceptance
- Application tracking
- Admin review workflow

### Files
```
src/
├── app/
│   └── become-a-seller/
│       ├── page.tsx               # Landing page
│       ├── apply/
│       │   └── page.tsx           # Application form
│       └── status/
│           └── page.tsx           # Application status
├── components/
│   └── vendor/
│       └── application/
│           ├── ApplicationForm.tsx
│           ├── BusinessInfoStep.tsx
│           ├── DocumentUpload.tsx
│           ├── BankDetailsStep.tsx
│           ├── TermsStep.tsx
│           └── ApplicationStatus.tsx
└── api/
    └── vendors/
        └── apply/
            └── route.ts
```

## 3.2 Vendor Dashboard

### Features
- Sales overview
- Order management
- Product management
- Inventory tracking
- Analytics & reports
- Payout history
- Store settings
- Staff management

### Files
```
src/
├── app/
│   └── vendor/
│       ├── page.tsx               # Dashboard
│       ├── orders/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── products/
│       │   ├── page.tsx
│       │   ├── new/
│       │   │   └── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── inventory/
│       │   └── page.tsx
│       ├── analytics/
│       │   └── page.tsx
│       ├── payouts/
│       │   └── page.tsx
│       ├── reviews/
│       │   └── page.tsx
│       ├── settings/
│       │   ├── page.tsx           # Store settings
│       │   ├── profile/
│       │   │   └── page.tsx
│       │   ├── delivery/
│       │   │   └── page.tsx
│       │   ├── hours/
│       │   │   └── page.tsx
│       │   └── staff/
│       │       └── page.tsx
│       └── layout.tsx
├── components/
│   └── vendor/
│       ├── dashboard/
│       │   ├── SalesChart.tsx
│       │   ├── OrdersWidget.tsx
│       │   ├── RevenueWidget.tsx
│       │   └── TopProducts.tsx
│       ├── orders/
│       │   ├── OrderTable.tsx
│       │   ├── OrderDetail.tsx
│       │   └── OrderActions.tsx
│       ├── products/
│       │   ├── ProductForm.tsx
│       │   ├── ProductTable.tsx
│       │   ├── VariantForm.tsx
│       │   ├── InventoryTable.tsx
│       │   └── BulkActions.tsx
│       └── settings/
│           ├── StoreForm.tsx
│           ├── DeliverySettings.tsx
│           ├── HoursForm.tsx
│           └── StaffList.tsx
└── api/
    └── vendor/
        ├── dashboard/
        │   └── route.ts
        ├── orders/
        │   └── route.ts
        ├── products/
        │   └── route.ts
        ├── inventory/
        │   └── route.ts
        └── payouts/
            └── route.ts
```

## 3.3 Public Storefronts

### Features
- Store page
- Store products
- Store reviews
- Store info
- Store search
- Follow store
- Store categories

### Files
```
src/
├── app/
│   └── (shop)/
│       └── store/
│           ├── page.tsx           # Store directory
│           └── [slug]/
│               ├── page.tsx       # Store home
│               ├── products/
│               │   └── page.tsx
│               ├── reviews/
│               │   └── page.tsx
│               └── about/
│                   └── page.tsx
├── components/
│   └── store/
│       ├── StoreBanner.tsx
│       ├── StoreInfo.tsx
│       ├── StoreProducts.tsx
│       ├── StoreReviews.tsx
│       ├── StoreCategories.tsx
│       ├── StoreFollow.tsx
│       ├── StoreCard.tsx
│       └── VendorBadge.tsx
└── api/
    └── stores/
        ├── route.ts               # List stores
        └── [slug]/
            ├── route.ts           # Store info
            ├── products/
            │   └── route.ts
            ├── reviews/
            │   └── route.ts
            └── follow/
                └── route.ts
```

---

# PHASE 4: ADMIN & OPERATIONS

## 4.1 Admin Dashboard

### Features
- Overview metrics
- Real-time orders
- User management
- Vendor management
- Product moderation
- Category management
- Brand management
- Content management
- Settings

### Files
```
src/
├── app/
│   └── admin/
│       ├── page.tsx               # Dashboard
│       ├── users/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── vendors/
│       │   ├── page.tsx
│       │   ├── applications/
│       │   │   └── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── orders/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── products/
│       │   ├── page.tsx
│       │   ├── pending/
│       │   │   └── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── categories/
│       │   └── page.tsx
│       ├── brands/
│       │   └── page.tsx
│       ├── reviews/
│       │   └── page.tsx
│       ├── coupons/
│       │   └── page.tsx
│       ├── deals/
│       │   └── page.tsx
│       ├── banners/
│       │   └── page.tsx
│       ├── content/
│       │   ├── pages/
│       │   │   └── page.tsx
│       │   ├── blog/
│       │   │   └── page.tsx
│       │   └── faq/
│       │       └── page.tsx
│       ├── support/
│       │   └── page.tsx
│       ├── reports/
│       │   └── page.tsx
│       ├── settings/
│       │   └── page.tsx
│       └── layout.tsx
├── components/
│   └── admin/
│       ├── dashboard/
│       │   ├── MetricsCards.tsx
│       │   ├── SalesChart.tsx
│       │   ├── OrdersChart.tsx
│       │   ├── TopProducts.tsx
│       │   └── RecentOrders.tsx
│       ├── users/
│       │   ├── UserTable.tsx
│       │   ├── UserDetail.tsx
│       │   └── UserActions.tsx
│       ├── vendors/
│       │   ├── VendorTable.tsx
│       │   ├── VendorDetail.tsx
│       │   ├── ApplicationReview.tsx
│       │   └── VendorActions.tsx
│       ├── orders/
│       │   ├── OrderTable.tsx
│       │   ├── OrderDetail.tsx
│       │   └── RefundForm.tsx
│       ├── products/
│       │   ├── ProductTable.tsx
│       │   ├── ProductModeration.tsx
│       │   └── CategoryTree.tsx
│       └── common/
│           ├── AdminSidebar.tsx
│           ├── AdminHeader.tsx
│           ├── DataTable.tsx
│           ├── StatCard.tsx
│           └── ChartCard.tsx
└── api/
    └── admin/
        ├── dashboard/
        │   └── route.ts
        ├── users/
        │   └── route.ts
        ├── vendors/
        │   └── route.ts
        ├── orders/
        │   └── route.ts
        ├── products/
        │   └── route.ts
        └── settings/
            └── route.ts
```

## 4.2 Order Management

### Features
- Order listing & search
- Order status updates
- Order fulfillment
- Refund processing
- Order timeline
- Order notes
- Print orders
- Export orders

### Files
```
src/
├── components/
│   └── orders/
│       ├── OrderTable.tsx
│       ├── OrderDetail.tsx
│       ├── OrderTimeline.tsx
│       ├── OrderItems.tsx
│       ├── OrderActions.tsx
│       ├── RefundDialog.tsx
│       ├── StatusBadge.tsx
│       ├── OrderFilters.tsx
│       └── OrderPrint.tsx
└── api/
    └── orders/
        ├── route.ts
        ├── [id]/
        │   ├── route.ts
        │   ├── status/
        │   │   └── route.ts
        │   ├── refund/
        │   │   └── route.ts
        │   └── notes/
        │       └── route.ts
        └── export/
            └── route.ts
```

## 4.3 Reports & Analytics

### Features
- Sales reports
- Product reports
- Customer reports
- Vendor reports
- Traffic analytics
- Conversion tracking
- Export to CSV/Excel
- Scheduled reports

### Files
```
src/
├── app/
│   └── admin/
│       └── reports/
│           ├── page.tsx
│           ├── sales/
│           │   └── page.tsx
│           ├── products/
│           │   └── page.tsx
│           ├── customers/
│           │   └── page.tsx
│           ├── vendors/
│           │   └── page.tsx
│           └── traffic/
│               └── page.tsx
├── components/
│   └── reports/
│       ├── SalesReport.tsx
│       ├── ProductReport.tsx
│       ├── CustomerReport.tsx
│       ├── VendorReport.tsx
│       ├── TrafficReport.tsx
│       ├── DateRangePicker.tsx
│       ├── ReportChart.tsx
│       └── ExportButton.tsx
└── api/
    └── reports/
        ├── sales/
        │   └── route.ts
        ├── products/
        │   └── route.ts
        ├── customers/
        │   └── route.ts
        └── export/
            └── route.ts
```

---

# PHASE 5: MARKETING & GROWTH

## 5.1 Promotions System

### Features
- Coupon codes
- Automatic discounts
- Buy X Get Y
- Bundle deals
- First order discount
- Referral rewards
- Loyalty points

### Files
```
src/
├── app/
│   └── admin/
│       └── promotions/
│           ├── coupons/
│           │   └── page.tsx
│           ├── discounts/
│           │   └── page.tsx
│           └── bundles/
│               └── page.tsx
├── components/
│   └── promotions/
│       ├── CouponForm.tsx
│       ├── CouponTable.tsx
│       ├── DiscountForm.tsx
│       ├── BundleForm.tsx
│       └── PromotionRules.tsx
└── api/
    └── promotions/
        ├── coupons/
        │   └── route.ts
        ├── discounts/
        │   └── route.ts
        └── validate/
            └── route.ts
```

## 5.2 Flash Deals

### Features
- Deal creation
- Countdown timers
- Quantity limits
- Deal pages
- Featured deals
- Deal categories
- Deal notifications

### Files
```
src/
├── app/
│   └── (shop)/
│       └── deals/
│           ├── page.tsx           # All deals
│           └── [slug]/
│               └── page.tsx       # Deal detail
├── components/
│   └── deals/
│       ├── DealCard.tsx
│       ├── DealBanner.tsx
│       ├── DealCountdown.tsx
│       ├── DealProgress.tsx
│       ├── DealGrid.tsx
│       └── FeaturedDeals.tsx
└── api/
    └── deals/
        ├── route.ts
        └── [slug]/
            └── route.ts
```

## 5.3 Email Marketing

### Features
- Campaign builder
- Email templates
- Subscriber lists
- A/B testing
- Analytics
- Automation
- Transactional emails

### Files
```
src/
├── lib/
│   └── email/
│       ├── client.ts
│       ├── templates/
│       │   ├── welcome.tsx
│       │   ├── order-confirmation.tsx
│       │   ├── shipping-update.tsx
│       │   ├── password-reset.tsx
│       │   ├── review-request.tsx
│       │   ├── abandoned-cart.tsx
│       │   ├── price-drop.tsx
│       │   ├── back-in-stock.tsx
│       │   └── newsletter.tsx
│       └── send.ts
├── app/
│   └── admin/
│       └── marketing/
│           ├── campaigns/
│           │   └── page.tsx
│           ├── templates/
│           │   └── page.tsx
│           └── subscribers/
│               └── page.tsx
└── api/
    └── email/
        ├── send/
        │   └── route.ts
        ├── campaigns/
        │   └── route.ts
        └── unsubscribe/
            └── route.ts
```

## 5.4 Referral Program

### Features
- Unique referral codes
- Referral tracking
- Reward distribution
- Referral dashboard
- Share links
- Leaderboard

### Files
```
src/
├── app/
│   └── (account)/
│       └── account/
│           └── referrals/
│               └── page.tsx
├── components/
│   └── referral/
│       ├── ReferralDashboard.tsx
│       ├── ReferralCode.tsx
│       ├── ReferralStats.tsx
│       ├── ShareButtons.tsx
│       └── ReferralLeaderboard.tsx
└── api/
    └── referral/
        ├── route.ts
        ├── claim/
        │   └── route.ts
        └── rewards/
            └── route.ts
```

## 5.5 Loyalty Program

### Features
- Points earning
- Points redemption
- Tier system
- Points history
- Exclusive rewards
- Birthday rewards

### Files
```
src/
├── app/
│   └── (account)/
│       └── account/
│           └── rewards/
│               └── page.tsx
├── components/
│   └── loyalty/
│       ├── PointsBalance.tsx
│       ├── TierProgress.tsx
│       ├── PointsHistory.tsx
│       ├── RewardsGrid.tsx
│       └── TierBenefits.tsx
└── api/
    └── loyalty/
        ├── route.ts
        ├── redeem/
        │   └── route.ts
        └── history/
            └── route.ts
```

---

# PHASE 6: CUSTOMER EXPERIENCE

## 6.1 Reviews & Ratings (Enhanced)

### Features
- Star ratings (1-5)
- Written reviews
- Review images/videos
- Verified purchase badge
- Helpful voting
- Review replies (vendor)
- Review moderation
- Review analytics

### Files (Already partially done, enhance)
```
src/
├── components/
│   └── reviews/
│       ├── StarRating.tsx
│       ├── StarRatingInput.tsx
│       ├── ReviewCard.tsx
│       ├── ReviewList.tsx
│       ├── ReviewForm.tsx
│       ├── ReviewSummary.tsx
│       ├── ReviewImages.tsx
│       ├── ReviewReply.tsx
│       ├── ReviewFilters.tsx
│       └── ReviewStats.tsx
└── api/
    └── reviews/
        ├── route.ts
        ├── [id]/
        │   ├── route.ts
        │   ├── vote/
        │   │   └── route.ts
        │   └── reply/
        │       └── route.ts
        └── images/
            └── route.ts
```

## 6.2 Wishlists (Enhanced)

### Features
- Multiple wishlists
- Wishlist sharing
- Price drop alerts
- Back in stock alerts
- Move to cart
- Wishlist analytics

### Files (Already partially done, enhance)
```
src/
├── components/
│   └── wishlist/
│       ├── WishlistButton.tsx
│       ├── WishlistCard.tsx
│       ├── WishlistGrid.tsx
│       ├── WishlistManager.tsx
│       ├── ShareWishlist.tsx
│       └── PriceAlert.tsx
└── api/
    └── wishlist/
        ├── route.ts
        ├── [id]/
        │   └── route.ts
        ├── share/
        │   └── route.ts
        └── alerts/
            └── route.ts
```

## 6.3 Customer Support

### Features
- Help center
- FAQ
- Contact form
- Live chat
- Ticket system
- Order issues
- Returns portal

### Files
```
src/
├── app/
│   └── (support)/
│       ├── help/
│       │   ├── page.tsx           # Help center
│       │   └── [slug]/
│       │       └── page.tsx       # FAQ category
│       ├── contact/
│       │   └── page.tsx
│       ├── tickets/
│       │   ├── page.tsx           # My tickets
│       │   ├── new/
│       │   │   └── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       └── returns/
│           ├── page.tsx
│           └── [orderId]/
│               └── page.tsx
├── components/
│   └── support/
│       ├── HelpCenter.tsx
│       ├── FAQAccordion.tsx
│       ├── ContactForm.tsx
│       ├── LiveChat.tsx
│       ├── TicketForm.tsx
│       ├── TicketList.tsx
│       ├── TicketDetail.tsx
│       ├── TicketMessage.tsx
│       ├── ReturnForm.tsx
│       └── ReturnStatus.tsx
└── api/
    └── support/
        ├── tickets/
        │   └── route.ts
        ├── faq/
        │   └── route.ts
        └── returns/
            └── route.ts
```

## 6.4 Notifications

### Features
- In-app notifications
- Push notifications
- Email notifications
- SMS notifications
- Notification preferences
- Read/unread status

### Files
```
src/
├── components/
│   └── notifications/
│       ├── NotificationBell.tsx
│       ├── NotificationList.tsx
│       ├── NotificationCard.tsx
│       ├── NotificationPreferences.tsx
│       └── PushPermission.tsx
├── hooks/
│   └── use-notifications.ts
└── api/
    └── notifications/
        ├── route.ts
        ├── read/
        │   └── route.ts
        └── subscribe/
            └── route.ts
```

---

# PHASE 7: ADVANCED FEATURES

## 7.1 Multi-Language (i18n)

### Features
- English (default)
- Welsh
- Polish
- Hindi
- Urdu
- Language switcher
- RTL support

### Setup
```
src/
├── i18n/
│   ├── config.ts
│   ├── dictionaries/
│   │   ├── en.json
│   │   ├── cy.json
│   │   ├── pl.json
│   │   ├── hi.json
│   │   └── ur.json
│   └── client.ts
├── app/
│   └── [lang]/
│       └── ...                    # All routes
└── components/
    └── LanguageSwitcher.tsx
```

## 7.2 Multi-Currency

### Features
- GBP (default)
- EUR
- USD
- Currency switcher
- Automatic conversion
- Price display

### Files
```
src/
├── lib/
│   └── currency/
│       ├── config.ts
│       ├── rates.ts
│       └── convert.ts
├── components/
│   └── CurrencySwitcher.tsx
└── hooks/
    └── use-currency.ts
```

## 7.3 Real-time Features

### Features
- Live order tracking
- Real-time inventory
- Live chat
- Real-time notifications
- Activity presence

### Files
```
src/
├── lib/
│   └── realtime/
│       ├── supabase-realtime.ts
│       ├── pusher.ts
│       └── socket.ts
├── hooks/
│   ├── use-realtime-order.ts
│   ├── use-realtime-chat.ts
│   └── use-presence.ts
└── components/
    └── realtime/
        ├── LiveOrderTracker.tsx
        ├── LiveChat.tsx
        └── OnlineIndicator.tsx
```

## 7.4 Advanced Search

### Features
- Algolia/Meilisearch
- Faceted search
- Autocomplete
- Search analytics
- Personalization
- Synonym handling
- Typo tolerance

### Files
```
src/
├── lib/
│   └── search/
│       ├── algolia/
│       │   ├── client.ts
│       │   ├── index.ts
│       │   └── sync.ts
│       └── meilisearch/
│           ├── client.ts
│           ├── index.ts
│           └── sync.ts
└── api/
    └── search/
        ├── index/
        │   └── route.ts           # Sync products
        └── analytics/
            └── route.ts
```

## 7.5 AI & Recommendations

### Features
- Product recommendations
- "Customers also bought"
- Personalized homepage
- Smart search
- Chatbot assistant
- Review summarization

### Files
```
src/
├── lib/
│   └── ai/
│       ├── openai.ts
│       ├── recommendations.ts
│       └── embeddings.ts
├── components/
│   └── ai/
│       ├── Recommendations.tsx
│       ├── PersonalizedSection.tsx
│       ├── AIAssistant.tsx
│       └── SmartSearch.tsx
└── api/
    └── ai/
        ├── recommendations/
        │   └── route.ts
        ├── chat/
        │   └── route.ts
        └── summarize/
            └── route.ts
```

---

# PHASE 8: MOBILE & PWA

## 8.1 Progressive Web App

### Features
- Install prompt
- Offline support
- Push notifications
- App-like experience
- Home screen icon
- Splash screen

### Files
```
public/
├── manifest.json
├── sw.js
├── icons/
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
└── splash/
    └── ...

src/
├── lib/
│   └── pwa/
│       ├── register-sw.ts
│       └── push.ts
└── components/
    └── pwa/
        ├── InstallPrompt.tsx
        └── OfflineIndicator.tsx
```

## 8.2 Mobile Optimization

### Features
- Touch-friendly UI
- Swipe gestures
- Bottom navigation
- Pull to refresh
- Infinite scroll
- Mobile filters
- Mobile cart

### Files
```
src/
├── components/
│   └── mobile/
│       ├── BottomNav.tsx
│       ├── MobileFilters.tsx
│       ├── MobileSearch.tsx
│       ├── MobileCart.tsx
│       ├── SwipeCard.tsx
│       └── PullToRefresh.tsx
└── hooks/
    ├── use-swipe.ts
    └── use-pull-refresh.ts
```

## 8.3 React Native App (Future)

### Structure
```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   ├── categories.tsx
│   │   ├── cart.tsx
│   │   ├── orders.tsx
│   │   └── account.tsx
│   ├── product/[id].tsx
│   ├── search.tsx
│   └── checkout.tsx
├── components/
│   └── ...
├── hooks/
│   └── ...
├── services/
│   └── api.ts
└── stores/
    └── ...
```

---

# PHASE 9: ANALYTICS & AI

## 9.1 Analytics Dashboard

### Features
- Real-time visitors
- Sales analytics
- Product performance
- Customer insights
- Funnel analysis
- Cohort analysis
- Custom reports

### Files
```
src/
├── lib/
│   └── analytics/
│       ├── posthog.ts
│       ├── mixpanel.ts
│       ├── google-analytics.ts
│       └── tracking.ts
├── app/
│   └── admin/
│       └── analytics/
│           ├── page.tsx
│           ├── sales/
│           │   └── page.tsx
│           ├── products/
│           │   └── page.tsx
│           ├── customers/
│           │   └── page.tsx
│           └── funnels/
│               └── page.tsx
└── components/
    └── analytics/
        ├── RealtimeVisitors.tsx
        ├── SalesChart.tsx
        ├── ProductPerformance.tsx
        ├── CustomerInsights.tsx
        ├── FunnelChart.tsx
        └── CohortTable.tsx
```

## 9.2 Machine Learning

### Features
- Demand forecasting
- Price optimization
- Fraud detection
- Churn prediction
- Product clustering

### Files
```
src/
├── lib/
│   └── ml/
│       ├── forecasting.ts
│       ├── pricing.ts
│       ├── fraud.ts
│       └── clustering.ts
└── api/
    └── ml/
        ├── forecast/
        │   └── route.ts
        ├── pricing/
        │   └── route.ts
        └── fraud/
            └── route.ts
```

---

# PHASE 10: ENTERPRISE & SCALE

## 10.1 Performance Optimization

### Features
- Redis caching
- CDN integration
- Image optimization
- Code splitting
- Bundle optimization
- Database indexing
- Query optimization

### Files
```
src/
├── lib/
│   └── cache/
│       ├── redis.ts
│       ├── strategies.ts
│       └── invalidation.ts
└── middleware/
    └── cache.ts
```

## 10.2 Security

### Features
- Rate limiting
- CSRF protection
- XSS prevention
- SQL injection prevention
- Input validation
- Audit logging
- Encryption

### Files
```
src/
├── lib/
│   └── security/
│       ├── rate-limit.ts
│       ├── csrf.ts
│       ├── sanitize.ts
│       ├── encrypt.ts
│       └── audit.ts
└── middleware/
    ├── rate-limit.ts
    └── security-headers.ts
```

## 10.3 Monitoring & Logging

### Features
- Error tracking (Sentry)
- Performance monitoring
- Log aggregation
- Alerting
- Health checks
- Uptime monitoring

### Files
```
src/
├── lib/
│   └── monitoring/
│       ├── sentry.ts
│       ├── logrocket.ts
│       └── logger.ts
├── app/
│   └── api/
│       └── health/
│           └── route.ts
└── instrumentation.ts
```

## 10.4 Testing

### Features
- Unit tests (Vitest)
- Integration tests
- E2E tests (Playwright)
- Component tests
- API tests
- Visual regression
- Load testing

### Files
```
tests/
├── unit/
│   ├── utils/
│   ├── hooks/
│   └── components/
├── integration/
│   ├── api/
│   └── flows/
├── e2e/
│   ├── auth.spec.ts
│   ├── checkout.spec.ts
│   ├── search.spec.ts
│   └── admin.spec.ts
└── fixtures/
    └── ...

vitest.config.ts
playwright.config.ts
```

## 10.5 CI/CD Pipeline

### Features
- Automated testing
- Lint & format
- Type checking
- Build verification
- Preview deployments
- Production deploys
- Database migrations

### Files
```
.github/
└── workflows/
    ├── ci.yml
    ├── preview.yml
    ├── production.yml
    └── migrations.yml
```

## 10.6 Documentation

### Features
- API documentation
- Component storybook
- Developer guides
- Architecture docs
- Runbooks

### Files
```
docs/
├── api/
│   └── openapi.yaml
├── guides/
│   ├── getting-started.md
│   ├── architecture.md
│   ├── deployment.md
│   └── contributing.md
└── runbooks/
    ├── incidents.md
    └── migrations.md

.storybook/
├── main.ts
└── preview.ts

src/
└── stories/
    └── ...
```

---

# FILE STRUCTURE (Complete)

```
uk-grocery-store/
├── .github/
│   └── workflows/
├── .storybook/
├── docs/
├── mobile/                        # React Native app (future)
├── public/
│   ├── icons/
│   ├── images/
│   ├── fonts/
│   ├── manifest.json
│   └── sw.js
├── prisma/                        # If using Prisma
│   └── schema.prisma
├── scripts/
│   ├── seed.ts
│   ├── migrate.ts
│   └── sync-search.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── verify-email/
│   │   ├── (shop)/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── brands/
│   │   │   ├── search/
│   │   │   ├── deals/
│   │   │   ├── store/
│   │   │   ├── cart/
│   │   │   └── compare/
│   │   ├── (checkout)/
│   │   │   └── checkout/
│   │   ├── (account)/
│   │   │   └── account/
│   │   │       ├── profile/
│   │   │       ├── addresses/
│   │   │       ├── payments/
│   │   │       ├── orders/
│   │   │       ├── wishlist/
│   │   │       ├── notifications/
│   │   │       ├── rewards/
│   │   │       ├── referrals/
│   │   │       ├── security/
│   │   │       └── settings/
│   │   ├── (support)/
│   │   │   ├── help/
│   │   │   ├── contact/
│   │   │   ├── tickets/
│   │   │   └── returns/
│   │   ├── vendor/
│   │   │   ├── dashboard/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   ├── inventory/
│   │   │   ├── analytics/
│   │   │   ├── payouts/
│   │   │   ├── reviews/
│   │   │   └── settings/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── vendors/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── brands/
│   │   │   ├── reviews/
│   │   │   ├── promotions/
│   │   │   ├── deals/
│   │   │   ├── marketing/
│   │   │   ├── support/
│   │   │   ├── reports/
│   │   │   ├── analytics/
│   │   │   ├── content/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── reviews/
│   │   │   ├── wishlist/
│   │   │   ├── vendors/
│   │   │   ├── stores/
│   │   │   ├── deals/
│   │   │   ├── coupons/
│   │   │   ├── notifications/
│   │   │   ├── support/
│   │   │   ├── search/
│   │   │   ├── loyalty/
│   │   │   ├── referral/
│   │   │   ├── reports/
│   │   │   ├── webhooks/
│   │   │   ├── ai/
│   │   │   └── admin/
│   │   ├── become-a-seller/
│   │   ├── blog/
│   │   ├── [lang]/                # i18n routes
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/
│   │   ├── common/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── reviews/
│   │   ├── wishlist/
│   │   ├── deals/
│   │   ├── store/
│   │   ├── account/
│   │   ├── vendor/
│   │   ├── admin/
│   │   ├── support/
│   │   ├── notifications/
│   │   ├── search/
│   │   ├── loyalty/
│   │   ├── referral/
│   │   ├── analytics/
│   │   ├── reports/
│   │   ├── mobile/
│   │   ├── pwa/
│   │   └── ai/
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-cart.ts
│   │   ├── use-wishlist.ts
│   │   ├── use-checkout.ts
│   │   ├── use-notifications.ts
│   │   ├── use-currency.ts
│   │   ├── use-locale.ts
│   │   ├── use-realtime.ts
│   │   └── ...
│   ├── stores/
│   │   ├── cart-store.ts
│   │   ├── wishlist-store.ts
│   │   ├── user-store.ts
│   │   ├── notification-store.ts
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/
│   │   ├── stripe/
│   │   ├── redis/
│   │   ├── email/
│   │   ├── sms/
│   │   ├── search/
│   │   ├── currency/
│   │   ├── cache/
│   │   ├── security/
│   │   ├── monitoring/
│   │   ├── ai/
│   │   ├── ml/
│   │   ├── pwa/
│   │   ├── realtime/
│   │   └── utils/
│   ├── types/
│   │   ├── database.ts
│   │   ├── api.ts
│   │   └── common.ts
│   ├── config/
│   │   ├── site.ts
│   │   ├── navigation.ts
│   │   ├── seo.ts
│   │   └── constants.ts
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── client.ts
│   │   └── dictionaries/
│   ├── middleware.ts
│   └── instrumentation.ts
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── .env.local
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── playwright.config.ts
```

---

# API REFERENCE

## Public API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List products |
| GET | /api/products/:id | Get product |
| GET | /api/products/:id/reviews | Get product reviews |
| GET | /api/categories | List categories |
| GET | /api/categories/:slug | Get category products |
| GET | /api/brands | List brands |
| GET | /api/brands/:slug | Get brand products |
| GET | /api/search | Search products |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/cart | Get cart |
| POST | /api/cart/add | Add to cart |
| PUT | /api/cart/update | Update quantity |
| DELETE | /api/cart/remove | Remove item |
| POST | /api/cart/coupon | Apply coupon |

### Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/checkout | Create order |
| POST | /api/checkout/validate | Validate cart |
| POST | /api/checkout/payment-intent | Create payment intent |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | List user orders |
| GET | /api/orders/:id | Get order |
| POST | /api/orders/:id/cancel | Cancel order |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reviews | Get reviews |
| POST | /api/reviews | Submit review |
| POST | /api/reviews/:id/vote | Vote on review |

### Wishlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/wishlist | Get wishlists |
| POST | /api/wishlist | Create wishlist |
| POST | /api/wishlist/toggle | Add/remove item |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/forgot-password | Request reset |
| POST | /api/auth/reset-password | Reset password |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/account/profile | Get profile |
| PUT | /api/account/profile | Update profile |
| GET | /api/account/addresses | Get addresses |
| POST | /api/account/addresses | Add address |

---

# TESTING STRATEGY

## Test Pyramid

```
        ╱╲
       ╱  ╲      E2E Tests (10%)
      ╱────╲     - Critical user flows
     ╱      ╲    - Checkout, Auth, Orders
    ╱────────╲
   ╱          ╲  Integration Tests (30%)
  ╱────────────╲ - API endpoints
 ╱              ╲- Database operations
╱────────────────╲
        ↓         Unit Tests (60%)
                  - Components
                  - Hooks
                  - Utilities
```

## Test Files Structure
```
tests/
├── unit/
│   ├── components/
│   │   ├── ProductCard.test.tsx
│   │   ├── CartItem.test.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useCart.test.ts
│   │   └── ...
│   └── utils/
│       ├── format.test.ts
│       └── ...
├── integration/
│   ├── api/
│   │   ├── products.test.ts
│   │   ├── cart.test.ts
│   │   ├── checkout.test.ts
│   │   └── ...
│   └── flows/
│       ├── add-to-cart.test.ts
│       └── ...
└── e2e/
    ├── auth.spec.ts
    ├── checkout.spec.ts
    ├── search.spec.ts
    ├── vendor.spec.ts
    └── admin.spec.ts
```

---

# DEPLOYMENT

## Infrastructure

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Edge)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Preview   │  │  Staging    │  │ Production  │ │
│  │   (PR)      │  │  (develop)  │  │   (main)    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│                    Supabase                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Dev DB    │  │  Staging DB │  │  Prod DB    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│                  External Services                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ Stripe │ │ Resend │ │ Twilio │ │Algolia │      │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
└─────────────────────────────────────────────────────┘
```

## Environment Variables
```bash
# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Redis
REDIS_URL=

# Email (Resend)
RESEND_API_KEY=

# SMS (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Search (Algolia)
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
ALGOLIA_ADMIN_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_GA_ID=

# Monitoring
SENTRY_DSN=
LOGROCKET_APP_ID=
```

---

# ESTIMATED LINE COUNT

| Area | Files | Lines |
|------|-------|-------|
| Components | 200+ | 30,000 |
| Pages/Routes | 100+ | 15,000 |
| API Routes | 80+ | 12,000 |
| Hooks | 30+ | 3,000 |
| Stores | 10+ | 1,500 |
| Lib/Utils | 50+ | 8,000 |
| Types | 20+ | 3,000 |
| Config | 15+ | 1,000 |
| Tests | 150+ | 20,000 |
| Database | 10+ | 5,000 |
| Documentation | 30+ | 5,000 |
| **TOTAL** | **700+** | **100,000+** |

---

# IMPLEMENTATION TIMELINE

## Recommended Order

1. **Phase 1**: Core Foundation (Auth, Profiles, UI) - Foundation
2. **Phase 2**: Enhanced Shopping (Products, Cart, Checkout) - Revenue
3. **Phase 3**: Vendor Ecosystem (Registration, Dashboard, Stores) - Growth
4. **Phase 4**: Admin & Operations (Dashboard, Orders, Reports) - Management
5. **Phase 5**: Marketing & Growth (Promotions, Deals, Email) - Engagement
6. **Phase 6**: Customer Experience (Reviews, Support, Notifications) - Retention
7. **Phase 7**: Advanced Features (i18n, Real-time, AI) - Differentiation
8. **Phase 8**: Mobile & PWA (Offline, Push, App-like) - Reach
9. **Phase 9**: Analytics & AI (Insights, ML) - Intelligence
10. **Phase 10**: Enterprise & Scale (Performance, Security, Testing) - Reliability

---

# NEXT STEPS

Ready to begin implementation? Start with:

1. **Run database migration** - Apply all new tables
2. **Begin Phase 1** - Core authentication & profiles
3. **Iterate through phases** - Build feature by feature

Shall I begin implementing any specific phase?
