-- Add CHECK constraints for data integrity
-- These prevent invalid data at the database level

-- Products: price must be positive
ALTER TABLE public.products
  ADD CONSTRAINT chk_products_price_positive
  CHECK (price_pence > 0);

-- Products: compare_at_price must be positive if set
ALTER TABLE public.products
  ADD CONSTRAINT chk_products_compare_price_positive
  CHECK (compare_at_price_pence IS NULL OR compare_at_price_pence > 0);

-- Products: stock quantity must be non-negative
ALTER TABLE public.products
  ADD CONSTRAINT chk_products_stock_nonnegative
  CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

-- Orders: total must be positive
ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_total_positive
  CHECK (total_pence > 0);

-- Orders: subtotal must be non-negative
ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_subtotal_nonnegative
  CHECK (subtotal_pence >= 0);

-- Orders: delivery fee must be non-negative
ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_delivery_fee_nonnegative
  CHECK (delivery_fee_pence >= 0);

-- Order items: quantity must be positive
ALTER TABLE public.order_items
  ADD CONSTRAINT chk_order_items_quantity_positive
  CHECK (quantity > 0);

-- Order items: unit price must be positive
ALTER TABLE public.order_items
  ADD CONSTRAINT chk_order_items_price_positive
  CHECK (unit_price_pence > 0);

-- Coupons: discount value must be positive
ALTER TABLE public.coupons
  ADD CONSTRAINT chk_coupons_discount_positive
  CHECK (discount_value > 0);

-- Coupons: used_count must be non-negative
ALTER TABLE public.coupons
  ADD CONSTRAINT chk_coupons_used_nonnegative
  CHECK (used_count >= 0);

-- Coupons: max_uses must be positive if set
ALTER TABLE public.coupons
  ADD CONSTRAINT chk_coupons_max_uses_positive
  CHECK (max_uses IS NULL OR max_uses > 0);
