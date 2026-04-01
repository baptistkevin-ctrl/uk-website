-- Solaris Standard: Add deleted_at soft-delete column to core tables
-- deleted_at IS NULL = active record
-- deleted_at IS NOT NULL = soft-deleted record
-- This supplements the existing is_active flag for products

-- Add deleted_at to tables that don't have it yet
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'profiles', 'products', 'categories', 'orders', 'order_items',
      'vendors', 'coupons', 'addresses', 'wishlists',
      'hero_slides', 'flash_deals', 'multibuy_offers'
    ])
  LOOP
    -- Only add if column doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'deleted_at'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN deleted_at TIMESTAMPTZ', tbl);
    END IF;
  END LOOP;
END $$;

-- Create partial indexes for active records (WHERE deleted_at IS NULL)
-- These speed up the most common queries significantly
CREATE INDEX IF NOT EXISTS idx_products_active ON products(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_active ON orders(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(id) WHERE deleted_at IS NULL;
