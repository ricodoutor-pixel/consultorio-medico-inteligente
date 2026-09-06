
-- 1. Remove notifications from realtime publication (delivery uses polling via useRealtimeNotifications)
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;

-- 2. Validate vendor_transactions amounts via trigger
CREATE OR REPLACE FUNCTION public.validate_vendor_transaction_amounts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric;
BEGIN
  -- Allow admins / service role to set arbitrary values (refunds, adjustments)
  IF auth.role() = 'service_role' OR has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Require product reference
  IF NEW.product_id IS NULL THEN
    RAISE EXCEPTION 'product_id is required for buyer-initiated transactions';
  END IF;

  SELECT price INTO v_price
  FROM public.vendor_products
  WHERE id = NEW.product_id
    AND vendor_id = NEW.vendor_id
    AND is_active = true;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Product not found or inactive for vendor';
  END IF;

  IF NEW.amount IS NULL OR NEW.amount <> v_price THEN
    RAISE EXCEPTION 'amount (%) must equal product price (%)', NEW.amount, v_price;
  END IF;

  -- Enforce 5% platform fee / 95% vendor share (rounded to 2 decimals)
  NEW.platform_fee := round(v_price * 0.05, 2);
  NEW.vendor_amount := round(v_price - NEW.platform_fee, 2);
  NEW.status := COALESCE(NEW.status, 'pending');
  NEW.type := COALESCE(NEW.type, 'sale');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_vendor_transaction_amounts ON public.vendor_transactions;
CREATE TRIGGER trg_validate_vendor_transaction_amounts
  BEFORE INSERT ON public.vendor_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_vendor_transaction_amounts();
