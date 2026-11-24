CREATE TABLE public.clicksign_document_bindings (
  document_key text PRIMARY KEY,
  owner_user_id uuid NOT NULL,
  prescription_id uuid,
  patient_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.clicksign_document_bindings TO service_role;
ALTER TABLE public.clicksign_document_bindings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.doctor_directory_badge_facts()
RETURNS TABLE(doctor_id uuid, paid_until timestamptz, registration_complete boolean, documents_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
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
 JOIN public.profiles p ON p.id=c.user_id
 WHERE auth.uid()=c.user_id OR public.has_role(auth.uid(),'admin'::public.app_role) OR auth.role()='service_role';
$function$;
REVOKE ALL ON FUNCTION public.doctor_directory_badge_facts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.doctor_directory_badge_facts() TO authenticated, service_role;

CREATE FUNCTION public.doctor_directory_public_badges()
RETURNS TABLE(doctor_id uuid, badge text, directory_rank integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $function$
 WITH facts AS (
 SELECT c.id,
 EXISTS (SELECT 1 FROM public.subscriptions s
  WHERE s.user_id=c.user_id AND s.environment='live' AND s.status='active'
    AND s.stripe_subscription_id LIKE 'mp_%' AND s.price_id LIKE 'plano_medico%'
    AND s.current_period_end > now()) AS premium,
 (nullif(trim(p.full_name),'') IS NOT NULL AND nullif(trim(p.phone),'') IS NOT NULL
  AND nullif(trim(p.cpf),'') IS NOT NULL AND p.date_of_birth IS NOT NULL
  AND nullif(trim(d.crm),'') IS NOT NULL AND nullif(trim(d.specialty),'') IS NOT NULL
  AND nullif(trim(d.bio),'') IS NOT NULL AND nullif(trim(p.avatar_url),'') IS NOT NULL
  AND nullif(trim(p.address_street),'') IS NOT NULL AND nullif(trim(p.address_number),'') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM unnest(ARRAY['crm_front','crm_back','id_front','cpf_doc','address_proof']) required(kind)
    WHERE NOT EXISTS (SELECT 1 FROM public.doctor_kyc_documents k
      WHERE k.doctor_user_id=c.user_id AND k.document_kind=required.kind
      AND nullif(trim(k.storage_path),'') IS NOT NULL AND k.verification_status IS DISTINCT FROM 'rejected'))) AS vip,
 (SELECT count(DISTINCT k.document_kind)::integer FROM public.doctor_kyc_documents k
   WHERE k.doctor_user_id=c.user_id AND nullif(trim(k.storage_path),'') IS NOT NULL
   AND k.verification_status IS DISTINCT FROM 'rejected' AND k.document_kind <> 'vip_receipt') AS count
 FROM public.doctors_public c JOIN public.doctors d ON d.id=c.id JOIN public.profiles p ON p.id=c.user_id
 ), ranked AS (
 SELECT id, CASE WHEN premium THEN 'premium' WHEN vip THEN 'vip' ELSE NULL END AS badge,
 CASE WHEN premium THEN 0 WHEN vip THEN 1 ELSE 2 END AS group_rank, count FROM facts
 )
 SELECT id, badge, dense_rank() OVER (ORDER BY group_rank, count DESC)::integer FROM ranked;
$function$;
REVOKE ALL ON FUNCTION public.doctor_directory_public_badges() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.doctor_directory_public_badges() TO anon, authenticated, service_role;