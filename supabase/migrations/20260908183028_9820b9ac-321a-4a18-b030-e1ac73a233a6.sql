CREATE OR REPLACE FUNCTION public.sync_doctors_public_catalog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name text;
  display_avatar text;
BEGIN
  SELECT p.full_name,
         CASE
           WHEN p.avatar_url LIKE 'data:%' THEN NULL
           ELSE p.avatar_url
         END
    INTO display_name, display_avatar
  FROM public.profiles p
  WHERE p.id = NEW.user_id;

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
    display_name, display_avatar, NEW.created_at
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