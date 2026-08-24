CREATE OR REPLACE FUNCTION public.register_new_doctor(
  p_user_id UUID, p_full_name TEXT, p_phone TEXT, p_cpf TEXT, p_country TEXT, p_city TEXT, p_region TEXT, p_crm TEXT, p_crm_state TEXT, p_specialty TEXT, p_bio TEXT, p_document_type TEXT, p_plan_tier TEXT, p_price_video_chat NUMERIC, p_avatar_url TEXT, p_pix_key TEXT, p_pix_type TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- O usuário precisa existir no auth
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  -- Chamada autenticada: só o próprio usuário. Chamada anônima (signup sem sessão):
  -- apenas dentro da janela de 30 min após a criação da conta.
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = p_user_id AND created_at > now() - interval '30 minutes'
    ) THEN
      RAISE EXCEPTION 'signup_window_expired';
    END IF;
  END IF;

  -- Cria o Perfil
  INSERT INTO public.profiles (id, full_name, phone, cpf, country, city, region, user_type, signup_role, avatar_url, pix_key, pix_type)
  VALUES (p_user_id, p_full_name, p_phone, p_cpf, p_country, p_city, p_region, 'doctor', 'doctor', p_avatar_url, p_pix_key, p_pix_type)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, cpf = EXCLUDED.cpf, user_type = 'doctor', signup_role = 'doctor', avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url), pix_key = EXCLUDED.pix_key, pix_type = EXCLUDED.pix_type;

  -- Cria o Registro Médico (nunca sobrescreve um registro médico existente)
  INSERT INTO public.doctors (user_id, crm, crm_state, specialty, bio, consultation_price, price_video_chat, price_chat_only, price_return, is_approved_by_admin, approval_status, document_type, country, city, is_verified, is_online, is_available, kyc_status, plan_tier)
  VALUES (p_user_id, p_crm, p_crm_state, p_specialty, p_bio, 150.00, p_price_video_chat, 150.00, 90.00, false, 'pending', p_document_type, p_country, p_city, false, false, false, 'pending', p_plan_tier)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.register_new_doctor(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_new_doctor(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;