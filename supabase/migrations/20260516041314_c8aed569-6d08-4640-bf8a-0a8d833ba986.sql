
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'unknown',
  lead_score INTEGER NOT NULL DEFAULT 0,
  condition_interest TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON public.leads (whatsapp);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads (source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode criar lead (gate público)
CREATE POLICY "Anyone can create leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- Apenas admins podem ver / editar / deletar
CREATE POLICY "Admins can view leads"
  ON public.leads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
