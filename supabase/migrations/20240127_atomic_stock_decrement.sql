-- Atomic stock decrement function to prevent race conditions
-- Called from webhook when order is confirmed
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(stock_quantity - p_quantity, 0),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic coupon usage increment to prevent concurrent bypass
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_used INT;
  v_max_uses INT;
BEGIN
  SELECT used_count, max_uses INTO v_current_used, v_max_uses
  FROM coupons
  WHERE id = p_coupon_id
  FOR UPDATE; -- Row-level lock

  IF v_max_uses IS NOT NULL AND v_current_used >= v_max_uses THEN
    RETURN FALSE; -- Coupon exhausted
  END IF;

  UPDATE coupons
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = p_coupon_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
