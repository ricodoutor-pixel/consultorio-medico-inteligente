
-- 1) Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.orientacao_tecnica_orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.audit_log;
ALTER PUBLICATION supabase_realtime DROP TABLE public.leads;
ALTER PUBLICATION supabase_realtime DROP TABLE public.error_logs;

-- 2) Restrict ebook_funnel_log INSERT to service_role only
DROP POLICY IF EXISTS "Service inserts ebook funnel" ON public.ebook_funnel_log;
CREATE POLICY "Service inserts ebook funnel"
  ON public.ebook_funnel_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3) Rate limit table for public edge functions
CREATE TABLE IF NOT EXISTS public.edge_rate_limit (
  id BIGSERIAL PRIMARY KEY,
  bucket TEXT NOT NULL,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_rate_limit_lookup
  ON public.edge_rate_limit (bucket, key, created_at DESC);

ALTER TABLE public.edge_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads rate limit"
  ON public.edge_rate_limit
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Helper function: check & log a rate-limit hit. Returns true if allowed.
CREATE OR REPLACE FUNCTION public.check_edge_rate_limit(
  p_bucket TEXT,
  p_key TEXT,
  p_max_hits INT,
  p_window_seconds INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM public.edge_rate_limit
   WHERE bucket = p_bucket
     AND key = p_key
     AND created_at > now() - make_interval(secs => p_window_seconds);

  IF v_count >= p_max_hits THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.edge_rate_limit (bucket, key) VALUES (p_bucket, p_key);

  -- Opportunistic cleanup of rows older than 24h
  DELETE FROM public.edge_rate_limit
   WHERE created_at < now() - INTERVAL '24 hours';

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.check_edge_rate_limit(TEXT, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_edge_rate_limit(TEXT, TEXT, INT, INT) TO service_role;
