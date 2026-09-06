DROP VIEW IF EXISTS public.doctors_public CASCADE;
CREATE VIEW public.doctors_public
WITH (security_invoker=on) AS
SELECT id, user_id, specialty, crm, crm_state, rqe, bio, rating, consultation_price,
       is_verified, is_online, plan_tier, total_consultations, available_hours,
       is_available, document_type, country, city, created_at
FROM public.doctors
WHERE is_verified = true;

GRANT SELECT ON public.doctors_public TO anon, authenticated;