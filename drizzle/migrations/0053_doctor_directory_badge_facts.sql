CREATE OR REPLACE FUNCTION public.doctor_directory_badge_facts()
RETURNS TABLE(doctor_id uuid, paid_until timestamptz, registration_complete boolean, documents_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT c.id,
 (SELECT max(s.current_period_end) FROM public.subscriptions s
  WHERE s.user_id=c.user_id AND s.environment='live' AND s.status='active'
    AND s.stripe_subscription_id LIKE 'mp_%' AND s.price_id LIKE 'plano_medico%'
    AND s.current_period_end > now()),
 (nullif(trim(p.full_name),'') IS NOT NULL AND nullif(trim(p.phone),'') IS NOT NULL
  AND nullif(trim(p.cpf),'') IS NOT NULL AND p.date_of_birth IS NOT NULL
  AND nullif(trim(d.crm),'') IS NOT NULL AND nullif(trim(d.specialty),'') IS NOT NULL
  AND nullif(trim(d.bio),'') IS NOT NULL AND nullif(trim(p.avatar_url),'') IS NOT NULL
  AND nullif(trim(p.address_street),'') IS NOT NULL AND nullif(trim(p.address_number),'') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM unnest(ARRAY['crm_front','crm_back','id_front','cpf_doc','address_proof']) required(kind)
     WHERE NOT EXISTS (SELECT 1 FROM public.doctor_kyc_documents k
       WHERE k.doctor_user_id=c.user_id AND k.document_kind=required.kind
       AND nullif(trim(k.storage_path),'') IS NOT NULL AND k.verification_status IS DISTINCT FROM 'rejected'))),
 (SELECT count(DISTINCT k.document_kind)::integer FROM public.doctor_kyc_documents k
    WHERE k.doctor_user_id=c.user_id AND nullif(trim(k.storage_path),'') IS NOT NULL
    AND k.verification_status IS DISTINCT FROM 'rejected' AND k.document_kind <> 'vip_receipt')
 FROM public.doctors_public c JOIN public.doctors d ON d.id=c.id
 JOIN public.profiles p ON p.id=c.user_id;
$$;
REVOKE ALL ON FUNCTION public.doctor_directory_badge_facts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.doctor_directory_badge_facts() TO anon, authenticated, service_role;