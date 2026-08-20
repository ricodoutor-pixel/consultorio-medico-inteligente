-- Drop direct INSERT policy on payment_webhooks entirely.
-- Only the edge function (service_role key) should insert — it bypasses RLS automatically.
-- No client-side role should be able to insert webhook records.
DROP POLICY IF EXISTS "Service role can insert webhooks" ON public.payment_webhooks;
