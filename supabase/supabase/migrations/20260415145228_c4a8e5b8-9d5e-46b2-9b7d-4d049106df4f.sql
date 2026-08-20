
-- 1. Fix affiliate_wallets: change policies from {public} to {authenticated}
DROP POLICY IF EXISTS "Admins can manage wallets" ON public.affiliate_wallets;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.affiliate_wallets;

CREATE POLICY "Admins can manage wallets"
  ON public.affiliate_wallets
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own wallet"
  ON public.affiliate_wallets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Fix affiliate_withdrawals: change policies from {public} to {authenticated}
DROP POLICY IF EXISTS "Admins can manage withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Users can request withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.affiliate_withdrawals;

CREATE POLICY "Admins can manage withdrawals"
  ON public.affiliate_withdrawals
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can request withdrawals"
  ON public.affiliate_withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own withdrawals"
  ON public.affiliate_withdrawals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Remove app_downloads from Realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'app_downloads'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.app_downloads;
  END IF;
END $$;

-- 4. Fix payment_webhooks: remove unnecessary INSERT/UPDATE policies
-- Service role bypasses RLS, so no policy needed for backend webhook processing
DROP POLICY IF EXISTS "System can insert webhooks" ON public.payment_webhooks;
DROP POLICY IF EXISTS "System can update webhooks" ON public.payment_webhooks;
