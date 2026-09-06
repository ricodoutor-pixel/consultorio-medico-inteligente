
-- 1. Adiciona status ao leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','qualified','converted','lost'));

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);

-- 2. Tabela de eventos de funil (rastreamento público)
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  funnel TEXT NOT NULL,
  session_id TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_funnel ON public.funnel_events (funnel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_event ON public.funnel_events (event_name);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session ON public.funnel_events (session_id);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Visitantes anônimos podem inserir eventos validados (lista branca)
CREATE POLICY "Public can insert validated funnel events"
  ON public.funnel_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    funnel IN ('protocol_calculator','ebook_gate')
    AND char_length(event_name) BETWEEN 2 AND 60
    AND (session_id IS NULL OR char_length(session_id) BETWEEN 8 AND 80)
  );

-- Apenas admins visualizam
CREATE POLICY "Admins can view funnel events"
  ON public.funnel_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
