-- Auto-update updated_at trigger function (Solaris standard)
-- Apply to every table so we never need to manually set updated_at in code
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to core tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'profiles', 'products', 'categories', 'orders', 'order_items',
      'vendors', 'coupons', 'addresses', 'wishlists', 'reviews',
      'hero_slides', 'vendor_orders', 'flash_deals', 'multibuy_offers'
    ])
  LOOP
    -- Drop if exists to make migration idempotent
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', tbl);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl
    );
  END LOOP;
END $$;
