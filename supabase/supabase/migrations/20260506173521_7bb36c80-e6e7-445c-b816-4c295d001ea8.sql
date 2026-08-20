-- 1) Tabela conversion_leads (usada por recuperação de carrinho da farmácia e auditoria de eventos)
CREATE TABLE IF NOT EXISTS public.conversion_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  source text NOT NULL,
  event_type text NOT NULL,
  reference_id uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.conversion_leads ENABLE ROW LEVEL SECURITY;

-- Apenas admins veem; sistema (service role) escreve
CREATE POLICY "Admins can view conversion leads"
  ON public.conversion_leads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update conversion leads"
  ON public.conversion_leads FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_conversion_leads_status ON public.conversion_leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_leads_event ON public.conversion_leads(event_type);

-- 2) Garante coluna payout_status em consultation_credit_audit (libera saque apenas após 5★)
ALTER TABLE public.consultation_credit_audit
  ADD COLUMN IF NOT EXISTS payout_status text NOT NULL DEFAULT 'locked';
-- locked | released | under_review

CREATE INDEX IF NOT EXISTS idx_credit_audit_payout_status
  ON public.consultation_credit_audit(payout_status, created_at DESC);