-- =======================================================================================
-- ADD TITULAR DOCTORS TO PRODUCTION
-- =======================================================================================

DO $$
DECLARE
  v_suelen_id UUID;
  v_olivia_id UUID;
  v_edilson_id UUID;
BEGIN
  -- 1. Create or GET Auth Users
  
  -- Dra. Suelen
  SELECT id INTO v_suelen_id FROM auth.users WHERE email = 'dra.suelen@plantayraiz.com.br' LIMIT 1;
  IF v_suelen_id IS NULL THEN
    v_suelen_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_suelen_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dra.suelen@plantayraiz.com.br', crypt('MudarSenha123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dra. Suelen Naves Rodrigues"}', now(), now());
  END IF;

  -- Dra. Olívia
  SELECT id INTO v_olivia_id FROM auth.users WHERE email = 'dra.olivia@plantayraiz.com.br' LIMIT 1;
  IF v_olivia_id IS NULL THEN
    v_olivia_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_olivia_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dra.olivia@plantayraiz.com.br', crypt('MudarSenha123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dra. Olívia"}', now(), now());
  END IF;

  -- Dr. Edilson
  SELECT id INTO v_edilson_id FROM auth.users WHERE email = 'contato@plantayraiz.com.br' LIMIT 1;
  IF v_edilson_id IS NULL THEN
    v_edilson_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_edilson_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'contato@plantayraiz.com.br', crypt('MudarSenha123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Edilson Bezerra"}', now(), now());
  END IF;

  -- 2. Add Roles
  INSERT INTO public.user_roles (user_id, role) VALUES (v_suelen_id, 'doctor') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_olivia_id, 'doctor') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_edilson_id, 'doctor') ON CONFLICT DO NOTHING;

  -- 3. Update or Insert Profiles
  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (v_suelen_id, 'Dra. Suelen Naves Rodrigues', 'dra.suelen@plantayraiz.com.br', 'doctor', NULL)
  ON CONFLICT (id) DO UPDATE SET full_name = 'Dra. Suelen Naves Rodrigues', role = 'doctor';

  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (v_olivia_id, 'Dra. Olívia', 'dra.olivia@plantayraiz.com.br', 'doctor', NULL)
  ON CONFLICT (id) DO UPDATE SET full_name = 'Dra. Olívia', role = 'doctor';

  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (v_edilson_id, 'Dr. Edilson Bezerra', 'contato@plantayraiz.com.br', 'doctor', NULL)
  ON CONFLICT (id) DO UPDATE SET full_name = 'Dr. Edilson Bezerra', role = 'doctor';

  -- 4. Update or Insert Doctors
  INSERT INTO public.doctors (user_id, full_name, crm, crm_state, specialty, bio, is_verified, is_approved, is_online, consultation_fee)
  VALUES (
    v_suelen_id, 'Dra. Suelen Naves Rodrigues', '49354', 'PR', 'Cannabis Medicinal',
    'Especialista em medicina canabinoide e supervisora técnica da Planta y Raiz.',
    true, true, true, 50.00
  )
  ON CONFLICT (user_id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, crm = EXCLUDED.crm, specialty = EXCLUDED.specialty, is_online = true, is_approved = true;

  INSERT INTO public.doctors (user_id, full_name, crm, crm_state, specialty, bio, is_verified, is_approved, is_online, consultation_fee)
  VALUES (
    v_olivia_id, 'Dra. Olívia', '00000', 'SP', 'Cannabis Medicinal / Terapia Analgésica',
    'Especialista em prescrição canabinoide.',
    true, true, true, 50.00
  )
  ON CONFLICT (user_id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, specialty = EXCLUDED.specialty, is_online = true, is_approved = true;

  INSERT INTO public.doctors (user_id, full_name, crm, crm_state, specialty, bio, is_verified, is_approved, is_online, consultation_fee)
  VALUES (
    v_edilson_id, 'Dr. Edilson Bezerra', '10963', 'CE', 'Medicina Canábica / Orientação Técnica',
    'Foco em qualidade de vida com terapia fitocanabinoide.',
    true, true, true, 30.00
  )
  ON CONFLICT (user_id) DO UPDATE SET 
    full_name = EXCLUDED.full_name, crm = EXCLUDED.crm, specialty = EXCLUDED.specialty, is_online = true, is_approved = true;

END $$;
