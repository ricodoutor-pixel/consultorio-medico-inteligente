-- ======================================================================
-- MIGRATION: RPC SERVER-SIDE PARA ASSINATURA DE CONTRATOS (Prompt 1.2)
-- Data: 2026-09-05
-- ======================================================================

CREATE OR REPLACE FUNCTION public.sign_doctor_contract(
  p_doctor_id UUID,
  p_contract_version TEXT,
  p_sha512_hash TEXT,
  p_signer_name TEXT,
  p_signer_cpf TEXT,
  p_signer_crm TEXT,
  p_signer_crm_uf TEXT,
  p_signer_ip TEXT,
  p_signer_user_agent TEXT,
  p_pdf_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_contract_id UUID;
  v_ip TEXT;
  v_ip_failed BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    -- Fallback: busca user_id associado ao médico na tabela doctors
    SELECT user_id INTO v_user_id FROM public.doctors WHERE id = p_doctor_id;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autorizado: Usuário não autenticado para assinar o contrato.';
  END IF;

  v_ip := NULLIF(trim(p_signer_ip), '');
  v_ip_failed := (v_ip IS NULL OR v_ip = 'IP não capturado');

  -- Insere ou atualiza o contrato assinado com carimbo server-side
  INSERT INTO public.doctor_contracts (
    doctor_id,
    user_id,
    contract_version,
    doctor_full_name,
    doctor_cpf,
    doctor_crm,
    doctor_crm_uf,
    status,
    signed_at,
    signer_ip,
    signer_user_agent,
    pdf_url,
    sha512_hash,
    ip_capture_failed,
    is_active
  ) VALUES (
    p_doctor_id,
    v_user_id,
    COALESCE(p_contract_version, 'v1.0'),
    p_signer_name,
    p_signer_cpf,
    p_signer_crm,
    p_signer_crm_uf,
    'signed',
    now(),
    v_ip,
    p_signer_user_agent,
    p_pdf_url,
    p_sha512_hash,
    v_ip_failed,
    true
  )
  RETURNING id INTO v_contract_id;

  -- Sincroniza o registro do médico
  UPDATE public.doctors
  SET 
    is_contract_signed = true,
    contract_signed_at = now(),
    contract_ip = v_ip,
    contract_hash = p_sha512_hash,
    contract_version = COALESCE(p_contract_version, 'v1.0'),
    ip_capture_failed = v_ip_failed
  WHERE id = p_doctor_id;

  RETURN jsonb_build_object(
    'success', true,
    'contract_id', v_contract_id,
    'signed_at', now(),
    'sha512_hash', p_sha512_hash,
    'ip', v_ip
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.sign_doctor_contract TO authenticated;
GRANT EXECUTE ON FUNCTION public.sign_doctor_contract TO service_role;
