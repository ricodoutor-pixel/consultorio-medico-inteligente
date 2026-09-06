-- Fix: Buyers can view their own transactions
CREATE POLICY "Buyers can view own transactions"
  ON public.vendor_transactions
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());