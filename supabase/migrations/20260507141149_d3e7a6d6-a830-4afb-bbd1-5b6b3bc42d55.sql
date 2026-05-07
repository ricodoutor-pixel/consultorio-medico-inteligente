-- 1) ai_personas: restrict reads to admins; expose safe view
DROP POLICY IF EXISTS "Authenticated can read active personas" ON public.ai_personas;

CREATE POLICY "Admins can read personas"
  ON public.ai_personas FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.ai_personas_public
WITH (security_invoker = true) AS
SELECT id, persona_key, display_name, avatar_url, voice_tone,
       triggers_intents, requires_payment, active, channel
FROM public.ai_personas
WHERE active = true;

GRANT SELECT ON public.ai_personas_public TO anon, authenticated;

-- 2) vendor_transactions: enforce server-side amount based on product price
CREATE OR REPLACE FUNCTION public.enforce_vendor_transaction_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric;
BEGIN
  -- Service role / admins bypass the check
  IF auth.uid() IS NULL OR has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  SELECT price INTO v_price
  FROM public.vendor_products
  WHERE id = NEW.product_id
    AND vendor_id = NEW.vendor_id
    AND is_active = true;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Invalid product or inactive vendor product';
  END IF;

  -- Authoritative server-side amounts (5% platform fee)
  NEW.amount := v_price;
  NEW.platform_fee := round(v_price * 0.05, 2);
  NEW.vendor_amount := round(v_price - NEW.platform_fee, 2);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_vendor_transaction_amount() FROM anon, authenticated, PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_vendor_transaction_amount ON public.vendor_transactions;
CREATE TRIGGER trg_enforce_vendor_transaction_amount
  BEFORE INSERT ON public.vendor_transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_vendor_transaction_amount();