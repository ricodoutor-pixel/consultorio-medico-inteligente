DROP VIEW IF EXISTS public.doctors_public CASCADE;
CREATE VIEW public.doctors_public AS
SELECT d.id, d.user_id, d.specialty, d.crm, d.crm_state, d.rqe, d.bio, d.rating,
       d.consultation_price, d.is_verified, d.is_online, d.plan_tier,
       d.total_consultations, d.available_hours, d.is_available,
       d.document_type, d.country, d.city, d.created_at,
       p.full_name, p.avatar_url
FROM public.doctors d
LEFT JOIN public.profiles p ON p.id = d.user_id
WHERE d.is_verified = true;

GRANT SELECT ON public.doctors_public TO anon, authenticated;