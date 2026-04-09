
-- 1. Fix site_counters: replace permissive UPDATE policy with admin-only
DROP POLICY IF EXISTS "Authenticated users can update counters" ON public.site_counters;

CREATE POLICY "Admins can update counters"
  ON public.site_counters
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create safe increment function for authenticated users
CREATE OR REPLACE FUNCTION public.increment_site_counter(_counter_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.site_counters
  SET count = count + 1, updated_at = now()
  WHERE id = _counter_id;
$$;

-- 2. Fix financial_reports view: recreate with security_invoker
DROP VIEW IF EXISTS public.financial_reports;

CREATE VIEW public.financial_reports
WITH (security_invoker = true)
AS
SELECT
  a.id AS appointment_id,
  a.doctor_id,
  a.patient_id,
  a.amount AS total_value,
  e.doctor_payout,
  (a.amount - COALESCE(e.doctor_payout, (0)::numeric)) AS platform_revenue,
  a.scheduled_at,
  a.created_at,
  a.status,
  a.payment_status
FROM appointments a
LEFT JOIN escrow_transactions e ON e.appointment_id = a.id;
