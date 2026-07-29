-- =======================================================================================
-- FIX DOCTOR PROFILE: DR. EDILSON (contato@plantayraiz.com.br)
-- =======================================================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Obter o user_id do email contato@plantayraiz.com.br
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'contato@plantayraiz.com.br' LIMIT 1;
  
  -- Se o usuário não existir, interrompemos
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuário contato@plantayraiz.com.br não encontrado em auth.users';
    RETURN;
  END IF;

  -- 2. Garantir as roles necessárias (doctor, admin) em user_roles
  -- Inserir role 'doctor' se não existir
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'doctor') THEN
    INSERT INTO user_roles (user_id, role) VALUES (v_user_id, 'doctor');
  END IF;
  
  -- Inserir role 'admin' se não existir
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role = 'admin') THEN
    INSERT INTO user_roles (user_id, role) VALUES (v_user_id, 'admin');
  END IF;

  -- Atualizar perfil na tabela profiles (apenas garantindo o nome completo)
  UPDATE profiles
  SET full_name = 'Dr. Edilson Bezerra'
  WHERE id = v_user_id;

  -- 3. Atualizar ou Criar registro na tabela doctors
  IF EXISTS (SELECT 1 FROM doctors WHERE user_id = v_user_id) THEN
    -- Atualizar
    UPDATE doctors
    SET 
      full_name = 'Dr. Edilson Bezerra',
      crm = '10963',
      crm_state = 'CE',
      specialty = 'Medicina Canábica / Orientação Técnica',
      is_verified = true,
      is_approved = true,
      is_online = true,
      consultation_fee = 30.00
    WHERE user_id = v_user_id;
  ELSE
    -- Inserir novo
    INSERT INTO doctors (
      user_id, 
      full_name, 
      crm, 
      crm_state, 
      specialty, 
      is_verified, 
      is_approved, 
      is_online, 
      consultation_fee
    ) VALUES (
      v_user_id,
      'Dr. Edilson Bezerra',
      '10963',
      'CE',
      'Medicina Canábica / Orientação Técnica',
      true,
      true,
      true,
      30.00
    );
  END IF;

  RAISE NOTICE 'Perfil médico para Dr. Edilson atualizado com sucesso.';
END $$;
