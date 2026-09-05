-- ======================================================================
-- MIGRATION: ORQUESTRAÇÃO E AUDITORIA DE AGENTES IA (Tarefa 1.1)
-- Data: 2026-09-05
-- ======================================================================

CREATE TABLE IF NOT EXISTS public.ai_agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name VARCHAR(50) NOT NULL,
  action_type VARCHAR(80) NOT NULL,
  input_payload JSONB DEFAULT '{}'::jsonb,
  output_payload JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC(4,3),
  executed_at TIMESTAMPTZ DEFAULT now(),
  triggered_by TEXT,
  status TEXT CHECK (status IN ('success', 'failed', 'flagged_for_review', 'pending')) DEFAULT 'success',
  error_message TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance na consulta de trilha de auditoria
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_agent_name ON public.ai_agent_actions(agent_name);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_executed_at ON public.ai_agent_actions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_status ON public.ai_agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_action_type ON public.ai_agent_actions(action_type);

-- RLS
ALTER TABLE public.ai_agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all AI agent actions" ON public.ai_agent_actions;
CREATE POLICY "Admins can view all AI agent actions"
  ON public.ai_agent_actions FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'contato@plantayraiz.com.br' OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role can insert AI agent actions" ON public.ai_agent_actions;
CREATE POLICY "Service role can insert AI agent actions"
  ON public.ai_agent_actions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.ai_agent_actions IS 'Registro imutável de ações executadas pelos agentes de IA da plataforma para governança clínica e auditoria CFM.';
