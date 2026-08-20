
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Service can upsert wallets" ON public.affiliate_wallets;
DROP POLICY IF EXISTS "Service can update wallets" ON public.affiliate_wallets;

-- The credit_affiliate_wallet function uses SECURITY DEFINER so it bypasses RLS.
-- No need for permissive INSERT/UPDATE policies for service role.
