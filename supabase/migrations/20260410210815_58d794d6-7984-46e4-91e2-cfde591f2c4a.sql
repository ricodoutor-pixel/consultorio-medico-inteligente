
-- ============================================
-- PHASE 3: Cache, Job Queue, Monitoring Tables
-- ============================================

-- 1. SYSTEM CACHE TABLE
CREATE TABLE IF NOT EXISTS public.system_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  namespace TEXT NOT NULL,
  cache_value JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_cache_key ON public.system_cache (cache_key);
CREATE INDEX idx_system_cache_namespace ON public.system_cache (namespace);
CREATE INDEX idx_system_cache_expires ON public.system_cache (expires_at);

ALTER TABLE public.system_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for cache"
  ON public.system_cache FOR ALL
  USING (false)
  WITH CHECK (false);

-- 2. JOB QUEUE TABLE
CREATE TABLE IF NOT EXISTS public.job_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_log TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_queue_status ON public.job_queue (status);
CREATE INDEX idx_job_queue_queue ON public.job_queue (queue);
CREATE INDEX idx_job_queue_scheduled ON public.job_queue (scheduled_for) WHERE status = 'pending';

ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for jobs"
  ON public.job_queue FOR ALL
  USING (false)
  WITH CHECK (false);

-- 3. SYSTEM ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_alerts_resolved ON public.system_alerts (resolved) WHERE resolved = false;
CREATE INDEX idx_system_alerts_severity ON public.system_alerts (severity);

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alerts"
  ON public.system_alerts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role inserts alerts"
  ON public.system_alerts FOR INSERT
  WITH CHECK (false);

-- 4. SYSTEM ERRORS TABLE
CREATE TABLE IF NOT EXISTS public.system_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_message TEXT NOT NULL,
  stack TEXT,
  context JSONB,
  endpoint TEXT,
  user_id UUID,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_errors_resolved ON public.system_errors (resolved) WHERE resolved = false;

ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view errors"
  ON public.system_errors FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role inserts errors"
  ON public.system_errors FOR INSERT
  WITH CHECK (false);
