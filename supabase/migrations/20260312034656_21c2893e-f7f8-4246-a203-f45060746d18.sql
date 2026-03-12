
-- Recreate financial_reports view with security_invoker to respect underlying table RLS
CREATE OR REPLACE VIEW public.financial_reports
WITH (security_invoker = true)
AS
SELECT
  a.id AS appointment_id,
  a.doctor_id,
  a.patient_id,
  a.amount AS total_value,
  ROUND(a.amount * 0.7, 2) AS doctor_payout,
  ROUND(a.amount * 0.3, 2) AS platform_revenue,
  a.status,
  a.payment_status,
  a.scheduled_at,
  a.created_at
FROM public.appointments a;

-- Revoke all access from anon role
REVOKE ALL ON public.financial_reports FROM anon;

-- Revoke default access from authenticated, then grant select only
REVOKE ALL ON public.financial_reports FROM authenticated;
GRANT SELECT ON public.financial_reports TO authenticated;
