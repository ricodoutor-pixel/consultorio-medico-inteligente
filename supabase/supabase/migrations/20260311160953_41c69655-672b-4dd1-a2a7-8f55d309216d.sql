
-- Add minimum amount constraint to btc_subscriptions
ALTER TABLE public.btc_subscriptions ADD CONSTRAINT btc_subscriptions_amount_positive CHECK (amount > 0);

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit BTC subscription" ON public.btc_subscriptions;

-- Create a more restrictive INSERT policy requiring authentication
CREATE POLICY "Authenticated users can submit BTC subscription"
  ON public.btc_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
