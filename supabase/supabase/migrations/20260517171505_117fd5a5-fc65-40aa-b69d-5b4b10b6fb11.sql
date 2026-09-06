
-- Conversion events
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT,
  session_id TEXT,
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conv_events_created ON public.conversion_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_events_type ON public.conversion_events(event_type, created_at DESC);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert conversion events"
  ON public.conversion_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read conversion events"
  ON public.conversion_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Uptime log
CREATE TABLE IF NOT EXISTS public.uptime_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL,
  url TEXT NOT NULL,
  status_code INT,
  latency_ms INT,
  is_up BOOLEAN NOT NULL,
  error TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_uptime_log_route_time ON public.uptime_log(route, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_uptime_log_time ON public.uptime_log(checked_at DESC);

ALTER TABLE public.uptime_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read uptime log"
  ON public.uptime_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Uptime alerts
CREATE TABLE IF NOT EXISTS public.uptime_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL,
  status_code INT,
  error TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_uptime_alerts_unresolved ON public.uptime_alerts(created_at DESC) WHERE resolved_at IS NULL;

ALTER TABLE public.uptime_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read uptime alerts"
  ON public.uptime_alerts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
