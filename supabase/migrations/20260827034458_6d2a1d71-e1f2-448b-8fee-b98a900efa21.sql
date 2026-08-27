DROP VIEW IF EXISTS public.doctors_public;

CREATE TABLE public.doctors_public (
  id uuid PRIMARY KEY REFERENCES public.doctors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE,
  specialty text NOT NULL,
  crm text NOT NULL,
  crm_state text NOT NULL,
  rqe text,
  bio text,
  rating numeric,
  consultation_price numeric NOT NULL,
  is_verified boolean NOT NULL,
  is_online boolean NOT NULL,
  plan_tier text NOT NULL,
  total_consultations integer,
  available_hours jsonb,
  is_available boolean NOT NULL,
  document_type text NOT NULL,
  country text,
  city text,
  price_video_chat numeric NOT NULL,
  price_chat_only numeric NOT NULL,
  price_return numeric NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL
);

GRANT SELECT ON public.doctors_public TO anon, authenticated;
GRANT ALL ON public.doctors_public TO service_role;

ALTER TABLE public.doctors_public ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read verified doctor catalog"
  ON public.doctors_public FOR SELECT TO anon, authenticated
  USING (is_verified = true);

CREATE OR REPLACE FUNCTION public.sync_doctors_public_catalog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_row record;
BEGIN
  IF NEW.is_verified IS NOT TRUE THEN
    DELETE FROM public.doctors_public WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  SELECT * INTO display_row FROM public.get_doctor_display(NEW.user_id);

  INSERT INTO public.doctors_public (
    id, user_id, specialty, crm, crm_state, rqe, bio, rating,
    consultation_price, is_verified, is_online, plan_tier,
    total_consultations, available_hours, is_available, document_type,
    country, city, price_video_chat, price_chat_only, price_return,
    full_name, avatar_url, created_at
  ) VALUES (
    NEW.id, NEW.user_id, NEW.specialty, NEW.crm, NEW.crm_state, NEW.rqe,
    NEW.bio, NEW.rating, NEW.consultation_price, NEW.is_verified,
    NEW.is_online, NEW.plan_tier, NEW.total_consultations, NEW.available_hours,
    NEW.is_available, NEW.document_type, NEW.country, NEW.city,
    NEW.price_video_chat, NEW.price_chat_only, NEW.price_return,
    display_row.full_name, display_row.avatar_url, NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    specialty = EXCLUDED.specialty,
    crm = EXCLUDED.crm,
    crm_state = EXCLUDED.crm_state,
    rqe = EXCLUDED.rqe,
    bio = EXCLUDED.bio,
    rating = EXCLUDED.rating,
    consultation_price = EXCLUDED.consultation_price,
    is_verified = EXCLUDED.is_verified,
    is_online = EXCLUDED.is_online,
    plan_tier = EXCLUDED.plan_tier,
    total_consultations = EXCLUDED.total_consultations,
    available_hours = EXCLUDED.available_hours,
    is_available = EXCLUDED.is_available,
    document_type = EXCLUDED.document_type,
    country = EXCLUDED.country,
    city = EXCLUDED.city,
    price_video_chat = EXCLUDED.price_video_chat,
    price_chat_only = EXCLUDED.price_chat_only,
    price_return = EXCLUDED.price_return,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    created_at = EXCLUDED.created_at;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_doctors_public_catalog() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_doctors_public_catalog() TO service_role;

DROP TRIGGER IF EXISTS trg_sync_doctors_public_catalog ON public.doctors;
CREATE TRIGGER trg_sync_doctors_public_catalog
  AFTER INSERT OR UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.sync_doctors_public_catalog();

-- Populate the sanitized catalog from existing verified doctors.
INSERT INTO public.doctors_public (
  id, user_id, specialty, crm, crm_state, rqe, bio, rating,
  consultation_price, is_verified, is_online, plan_tier,
  total_consultations, available_hours, is_available, document_type,
  country, city, price_video_chat, price_chat_only, price_return,
  full_name, avatar_url, created_at
)
SELECT d.id, d.user_id, d.specialty, d.crm, d.crm_state, d.rqe, d.bio, d.rating,
       d.consultation_price, d.is_verified, d.is_online, d.plan_tier,
       d.total_consultations, d.available_hours, d.is_available, d.document_type,
       d.country, d.city, d.price_video_chat, d.price_chat_only, d.price_return,
       disp.full_name, disp.avatar_url, d.created_at
FROM public.doctors d
LEFT JOIN LATERAL public.get_doctor_display(d.user_id) disp ON true
WHERE d.is_verified = true;

-- No public or generic authenticated read path remains on the internal table.
DROP POLICY IF EXISTS "Public can view verified doctors" ON public.doctors;
REVOKE ALL ON public.doctors FROM anon;
REVOKE SELECT ON public.doctors FROM authenticated;
GRANT INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;