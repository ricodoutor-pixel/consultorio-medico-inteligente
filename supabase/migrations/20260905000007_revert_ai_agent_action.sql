-- ======================================================================
-- MIGRATION: REVERSÃO MANUAL DE AÇÕES DE AGENTES IA (HITL - Prompt 3.2)
-- Data: 2026-09-05
-- ======================================================================

-- 1. Atualizar restrição de status para incluir 'reverted'
ALTER TABLE public.ai_agent_actions DROP CONSTRAINT IF EXISTS ai_agent_actions_status_check;
ALTER TABLE public.ai_agent_actions ADD CONSTRAINT ai_agent_actions_status_check 
  CHECK (status IN ('success', 'failed', 'flagged_for_review', 'pending', 'reverted'));

-- 2. Adicionar colunas de rastreamento de intervenção humana (Human-in-the-Loop)
ALTER TABLE public.ai_agent_actions ADD COLUMN IF NOT EXISTS reverted_at TIMESTAMPTZ;
ALTER TABLE public.ai_agent_actions ADD COLUMN IF NOT EXISTS reverted_by UUID;
ALTER TABLE public.ai_agent_actions ADD COLUMN IF NOT EXISTS reversion_reason TEXT;

-- 3. Função RPC para reversão segura por administradores
CREATE OR REPLACE FUNCTION public.revert_ai_agent_action(
  p_action_id UUID,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_target_action RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'Justificativa clínica ou regulatória obrigatória (mínimo de 5 caracteres).';
  END IF;

  SELECT * INTO v_target_action FROM public.ai_agent_actions WHERE id = p_action_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ação de IA % não localizada.', p_action_id;
  END IF;

  IF v_target_action.status = 'reverted' THEN
    RAISE EXCEPTION 'Esta ação já foi revertida anteriormente em %.', v_target_action.reverted_at;
  END IF;

  UPDATE public.ai_agent_actions
  SET 
    status = 'reverted',
    reverted_at = now(),
    reverted_by = v_user_id,
    reversion_reason = trim(p_reason)
  WHERE id = p_action_id;

  RETURN jsonb_build_object(
    'success', true,
    'action_id', p_action_id,
    'status', 'reverted',
    'reverted_at', now(),
    'reverted_by', v_user_id,
    'reason', trim(p_reason)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.revert_ai_agent_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.revert_ai_agent_action TO service_role;
