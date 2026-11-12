-- Kit do Assinante: registro de uso das ferramentas de IA do médico (copiloto clínico, assistente jurídico)
-- para limites diários e auditoria. Só o servidor grava; o médico lê o próprio uso e o admin lê tudo.
CREATE TABLE IF NOT EXISTS public.doctor_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool text NOT NULL CHECK (tool IN ('copiloto', 'juridico')),
  question text,
  answer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS doctor_ai_usage_user_tool_day_idx ON public.doctor_ai_usage (user_id, tool, created_at DESC);

ALTER TABLE public.doctor_ai_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.doctor_ai_usage FROM anon;
GRANT SELECT ON public.doctor_ai_usage TO authenticated;
GRANT ALL ON public.doctor_ai_usage TO service_role;
DROP POLICY IF EXISTS doctor_ai_usage_owner_or_admin_read ON public.doctor_ai_usage;
CREATE POLICY doctor_ai_usage_owner_or_admin_read ON public.doctor_ai_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
