-- Execute este script no SQL Editor do seu painel Supabase
-- Ele criará as duas médicas (Dra. Olivia e Dra. Suelen) com a senha "Mudar@123"

-- 1. Inserir usuários no auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'olivia@plantayraiz.com.br',
  crypt('Mudar@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'suelen@plantayraiz.com.br',
  crypt('Mudar@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Pegar os IDs gerados para usar nas próximas tabelas
DO $$
DECLARE
    olivia_id UUID;
    suelen_id UUID;
BEGIN
    SELECT id INTO olivia_id FROM auth.users WHERE email = 'olivia@plantayraiz.com.br';
    SELECT id INTO suelen_id FROM auth.users WHERE email = 'suelen@plantayraiz.com.br';

    -- 2. Atualizar ou inserir profiles
    INSERT INTO public.profiles (id, full_name, user_type)
    VALUES 
        (olivia_id, 'Dra. Olivia Zimeri', 'doctor'),
        (suelen_id, 'Dra. Suelen Naves', 'doctor')
    ON CONFLICT (id) DO UPDATE SET user_type = 'doctor';

    -- 3. Inserir na tabela doctors
    INSERT INTO public.doctors (
        user_id, 
        full_name, 
        crm, 
        crm_state, 
        specialty, 
        is_approved, 
        is_online, 
        document_type
    )
    VALUES 
        (olivia_id, 'Dra. Olivia Zimeri', '123456', 'SP', 'Medicina Integrativa', true, true, 'crm'),
        (suelen_id, 'Dra. Suelen Naves', '654321', 'SP', 'Prescritora', true, true, 'crm')
    ON CONFLICT (user_id) DO UPDATE SET is_approved = true, is_online = true;

END $$;
