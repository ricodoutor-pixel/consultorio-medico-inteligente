
-- Fix: recreate view with SECURITY INVOKER to respect RLS of querying user
CREATE OR REPLACE VIEW public.financial_reports 
WITH (security_invoker = true) AS
SELECT 
  id as appointment_id,
  doctor_id,
  patient_id,
  amount as total_value,
  ROUND((amount * 0.93)::numeric, 2) as doctor_payout,
  ROUND((amount * 0.07)::numeric, 2) as platform_revenue,
  status,
  payment_status,
  scheduled_at,
  created_at
FROM public.appointments;
