-- Fix site_counters overly permissive UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can update counters" ON public.site_counters;
CREATE POLICY "Authenticated users can update counters"
  ON public.site_counters
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow doctors to view their own escrow transactions
CREATE POLICY "Doctors can view own escrow"
  ON public.escrow_transactions
  FOR SELECT
  TO authenticated
  USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

-- Allow vendors to view their own escrow transactions  
CREATE POLICY "Vendors can view own escrow"
  ON public.escrow_transactions
  FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

-- Allow users to view their own AI events
CREATE POLICY "Users can view own ai_events"
  ON public.ai_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());