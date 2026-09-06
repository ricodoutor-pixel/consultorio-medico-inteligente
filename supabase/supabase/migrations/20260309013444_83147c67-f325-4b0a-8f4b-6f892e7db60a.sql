-- Fix payment_webhooks INSERT policy: restrict to authenticated users only
-- Previously allowed anon role which enabled payment fraud

DROP POLICY IF EXISTS "Service role can insert webhooks" ON public.payment_webhooks;

CREATE POLICY "Service role can insert webhooks"
ON public.payment_webhooks
FOR INSERT
TO authenticated
WITH CHECK (true);
