ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_kyc_status_check;
ALTER TABLE public.doctors ADD CONSTRAINT doctors_kyc_status_check
  CHECK (kyc_status = ANY (ARRAY['pending','verified','approved','rejected','suspended']));

UPDATE public.doctors
   SET kyc_status = 'approved'
 WHERE is_approved_by_admin = true
   AND approval_status = 'approved'
   AND kyc_status = 'verified';

CREATE OR REPLACE FUNCTION public.get_next_available_doctor()
RETURNS TABLE(doctor_id uuid, user_id uuid, specialty text, rating numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.user_id, d.specialty, d.rating
    FROM public.doctors d
   WHERE d.is_online = true
     AND d.is_available = true
     AND d.kyc_status IN ('approved','verified')
     AND COALESCE(d.suspended_at, 'epoch'::timestamptz) < 'epoch'::timestamptz + interval '1 second'
     AND COALESCE(d.fraud_score, 100) >= 50
   ORDER BY
     CASE WHEN d.id = '8b32a5f6-0fce-4c33-a245-2c655764c011' THEN 0 ELSE 1 END,
     d.rating DESC NULLS LAST,
     d.total_consultations DESC
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_doctor_for_country(_country text)
RETURNS TABLE(doctor_id uuid, user_id uuid, specialty text, rating numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.user_id, d.specialty, d.rating
    FROM public.doctors d
   WHERE d.is_online = true
     AND d.is_available = true
     AND d.kyc_status IN ('approved','verified')
     AND COALESCE(d.suspended_at, 'epoch'::timestamptz) < 'epoch'::timestamptz + interval '1 second'
     AND COALESCE(d.fraud_score, 100) >= 50
     AND (
       (_country = 'BO' AND d.country = 'BO')
       OR (_country <> 'BO' AND (d.country = 'BR' OR d.country IS NULL))
     )
   ORDER BY
     CASE
       WHEN _country = 'BO' AND d.id = 'a2a8bd20-31a5-4d02-9c52-b1a177d61a5f' THEN 0
       WHEN _country <> 'BO' AND d.id = '8b32a5f6-0fce-4c33-a245-2c655764c011' THEN 0
       ELSE 1
     END,
     d.rating DESC NULLS LAST,
     d.total_consultations DESC
   LIMIT 1;
$$;