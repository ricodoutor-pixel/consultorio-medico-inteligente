ALTER TABLE public.leads_contatos
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS idioma text DEFAULT 'pt';

CREATE INDEX IF NOT EXISTS idx_leads_contatos_email ON public.leads_contatos(email);
CREATE INDEX IF NOT EXISTS idx_leads_contatos_categoria ON public.leads_contatos(categoria);