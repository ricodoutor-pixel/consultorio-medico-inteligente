CREATE OR REPLACE FUNCTION public.sync_doctors_public_catalog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_row record;
BEGIN
  SELECT * INTO display_row FROM public.get_doctor_display(NEW.user_id);

  INSERT INTO public.doctors_public (
    id, user_id, specialty, crm, crm_state, rqe, bio, rating,
    consultation_price, is_verified, is_online, plan_tier,
    total_consultations, available_hours, is_available, document_type,
    country, city, price_video_chat, price_chat_only, price_return,
    full_name, avatar_url, created_at
  ) VALUES (
    NEW.id, NEW.user_id, NEW.specialty, NEW.crm, NEW.crm_state, NEW.rqe,
    NEW.bio, NEW.rating, NEW.consultation_price, COALESCE(NEW.is_verified, false),
    COALESCE(NEW.is_online, false), NEW.plan_tier, NEW.total_consultations, NEW.available_hours,
    COALESCE(NEW.is_available, false), NEW.document_type, NEW.country, NEW.city,
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

DROP POLICY IF EXISTS "Public can read verified doctor catalog" ON public.doctors_public;
CREATE POLICY "Public can read safe doctor catalog"
  ON public.doctors_public FOR SELECT TO anon, authenticated
  USING (true);

INSERT INTO public.doctors_public (
  id, user_id, specialty, crm, crm_state, rqe, bio, rating,
  consultation_price, is_verified, is_online, plan_tier,
  total_consultations, available_hours, is_available, document_type,
  country, city, price_video_chat, price_chat_only, price_return,
  full_name, avatar_url, created_at
)
SELECT d.id, d.user_id, d.specialty, d.crm, d.crm_state, d.rqe, d.bio, d.rating,
       d.consultation_price, COALESCE(d.is_verified, false), COALESCE(d.is_online, false), d.plan_tier,
       d.total_consultations, d.available_hours, COALESCE(d.is_available, false), d.document_type,
       d.country, d.city, d.price_video_chat, d.price_chat_only, d.price_return,
       disp.full_name, disp.avatar_url, d.created_at
FROM public.doctors d
LEFT JOIN LATERAL public.get_doctor_display(d.user_id) disp ON true
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