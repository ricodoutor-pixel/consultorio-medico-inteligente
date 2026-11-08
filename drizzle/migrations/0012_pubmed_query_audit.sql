-- Auditoria das consultas ao PubMed: apenas termos clínicos genéricos, hora e total.
CREATE TABLE IF NOT EXISTS public.pubmed_query_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid,
  source text NOT NULL DEFAULT 'orientacao',
  query text NOT NULL,
  total integer,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pubmed_query_audit_session ON public.pubmed_query_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_pubmed_query_audit_created ON public.pubmed_query_audit(created_at DESC);

ALTER TABLE public.pubmed_query_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read pubmed audit" ON public.pubmed_query_audit
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE ALL ON public.pubmed_query_audit FROM PUBLIC, anon;
GRANT SELECT ON public.pubmed_query_audit TO authenticated;
GRANT INSERT ON public.pubmed_query_audit TO service_role;