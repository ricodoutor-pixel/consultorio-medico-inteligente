
-- 1) Remove duplicate test entry "olivia zimeri" (cb 12345)
DELETE FROM public.doctors WHERE id = '262988d8-b577-48ab-bbfd-874765909dc3';

-- 2) Fix Suelen avatar cache-bust (force browser refresh with reframed image)
UPDATE public.profiles
   SET avatar_url = '/avatars/dra-suelen.png?v=20260711b'
 WHERE id = '51c28fdd-ccd4-4b84-a0da-3cf604233804';

-- 3) Auto VIP trial (30 days, plan_tier=premium) for every new doctor
CREATE OR REPLACE FUNCTION public.grant_vip_trial_on_new_doctor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.medical_subscriptions (doctor_id, plan_tier, status, amount, started_at, expires_at)
  VALUES (NEW.id, 'premium', 'active', 0, now(), now() + interval '30 days')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_vip_trial ON public.doctors;
CREATE TRIGGER trg_grant_vip_trial
AFTER INSERT ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.grant_vip_trial_on_new_doctor();

-- 4) Backfill VIP trials for Suelen & Olivia (only if they don't already have an active premium sub)
INSERT INTO public.medical_subscriptions (doctor_id, plan_tier, status, amount, started_at, expires_at)
SELECT d.id, 'premium', 'active', 0, now(), now() + interval '30 days'
  FROM public.doctors d
 WHERE d.id IN ('8b32a5f6-0fce-4c33-a245-2c655764c011','a2a8bd20-31a5-4d02-9c52-b1a177d61a5f')
   AND NOT EXISTS (
     SELECT 1 FROM public.medical_subscriptions s
      WHERE s.doctor_id = d.id AND s.status = 'active'
   );

-- 5) Route consultations by country: BR → Dra. Suelen, BO → Dra. Olivia (until further notice)
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
     AND d.kyc_status = 'approved'
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
     AND d.kyc_status = 'approved'
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

GRANT EXECUTE ON FUNCTION public.get_doctor_for_country(text) TO anon, authenticated;
