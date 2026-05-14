-- Tabela de log de severidade de triagem
CREATE TABLE public.brisa_triage_severity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,
  whatsapp text,
  symptoms jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity_score numeric NOT NULL DEFAULT 0,
  is_urgent boolean NOT NULL DEFAULT false,
  red_flags text[] DEFAULT ARRAY[]::text[],
  notified_doctor_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brisa_triage_severity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view triage severity"
ON public.brisa_triage_severity FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role inserts triage"
ON public.brisa_triage_severity FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role updates triage"
ON public.brisa_triage_severity FOR UPDATE
TO service_role
USING (true) WITH CHECK (true);

CREATE INDEX idx_brisa_triage_urgent ON public.brisa_triage_severity (is_urgent, created_at DESC) WHERE is_urgent = true;
CREATE INDEX idx_brisa_triage_score ON public.brisa_triage_severity (severity_score DESC, created_at DESC);

-- Lógica Fuzzy
CREATE OR REPLACE FUNCTION public.calculate_fuzzy_severity(symptoms jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_pain numeric := COALESCE((symptoms->>'pain_level')::numeric, 0);
  v_duration numeric := COALESCE((symptoms->>'duration_days')::numeric, 0);
  v_text text := lower(COALESCE(symptoms->>'description', '') || ' ' || COALESCE(symptoms->>'free_text', ''));
  v_score numeric := 0;
  v_flags text[] := ARRAY[]::text[];
  v_red_terms text[] := ARRAY['suicíd','suicid','convuls','sangramento ativ','hemorragia','dor torácica','dor no peito','falta de ar grav','dispneia grav','desmaio','perda de consciência','avc','infarto','overdose','automutilação','autolesão'];
  t text;
BEGIN
  -- Pain (peso 0.4): normaliza 0-10 -> 0-0.4
  v_score := v_score + LEAST(v_pain / 10.0, 1.0) * 0.4;

  -- Duration (peso 0.2): >30 dias = peso máximo
  v_score := v_score + LEAST(v_duration / 30.0, 1.0) * 0.2;

  -- Red flags (peso 0.4 cumulativo, +0.2 por flag até teto)
  FOREACH t IN ARRAY v_red_terms LOOP
    IF v_text LIKE '%' || t || '%' THEN
      v_flags := array_append(v_flags, t);
      v_score := LEAST(v_score + 0.25, 1.0);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'score', round(v_score, 3),
    'is_urgent', v_score >= 0.75,
    'red_flags', v_flags
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pending_urgent_triages()
RETURNS TABLE(id uuid, whatsapp text, severity_score numeric, red_flags text[], symptoms jsonb, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, whatsapp, severity_score, red_flags, symptoms, created_at
  FROM public.brisa_triage_severity
  WHERE is_urgent = true
    AND notified_doctor_at IS NULL
    AND created_at > now() - interval '2 hours'
  ORDER BY severity_score DESC, created_at ASC;
$$;