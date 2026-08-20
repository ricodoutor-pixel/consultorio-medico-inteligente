
-- 1. Colunas no contato unificado
ALTER TABLE public.brisa_unified_contacts
  ADD COLUMN IF NOT EXISTS prefers_audio boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS age_bracket text NOT NULL DEFAULT 'unknown'
    CHECK (age_bracket IN ('adult','senior','unknown'));

-- 2. Singleton de configuração / kill-switch
CREATE TABLE IF NOT EXISTS public.brisa_audio_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  audio_enabled boolean NOT NULL DEFAULT true,
  monthly_budget_brl numeric(10,2) NOT NULL DEFAULT 300.00,
  paused_reason text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

INSERT INTO public.brisa_audio_config (id) VALUES (true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.brisa_audio_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audio config"
  ON public.brisa_audio_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins update audio config"
  ON public.brisa_audio_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3. Log de uso (auditoria + custo)
CREATE TABLE IF NOT EXISTS public.brisa_audio_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.brisa_unified_contacts(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  phone text,
  text_length int NOT NULL,
  voice_id text NOT NULL,
  cost_brl numeric(10,4) NOT NULL DEFAULT 0,
  intent text,
  reason text,
  success boolean NOT NULL DEFAULT true,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audio_usage_created ON public.brisa_audio_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audio_usage_contact ON public.brisa_audio_usage(contact_id);

ALTER TABLE public.brisa_audio_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read audio usage"
  ON public.brisa_audio_usage FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
