-- Onda 3: AI Error Gateway autocura
CREATE TABLE IF NOT EXISTS public.error_autohealing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,                  -- 'edge_function' | 'frontend' | 'cron' | 'webhook'
  source_ref text,                       -- function name / route / cron job
  error_type text,                       -- TypeError, NetworkError, ValidationError...
  error_message text NOT NULL,
  stack text,
  context jsonb DEFAULT '{}'::jsonb,     -- payload, user_id, url etc
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  ai_diagnosis text,                     -- explicação da IA
  ai_suggested_fix text,                 -- patch sugerido
  ai_confidence numeric(3,2),            -- 0.00 - 1.00
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','analyzing','resolved','ignored')),
  fingerprint text,                      -- hash p/ deduplicação
  occurrences int NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_error_autohealing_fingerprint ON public.error_autohealing(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_autohealing_status ON public.error_autohealing(status, severity, last_seen_at DESC);

ALTER TABLE public.error_autohealing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read errors"
  ON public.error_autohealing FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update errors"
  ON public.error_autohealing FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));