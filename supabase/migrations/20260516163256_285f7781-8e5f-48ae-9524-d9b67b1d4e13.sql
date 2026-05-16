
-- ============ MANUS GROWTH CEO ============
CREATE TABLE public.manus_growth_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  pages_analyzed int DEFAULT 0,
  pages_optimized int DEFAULT 0,
  posts_generated int DEFAULT 0,
  errors_count int DEFAULT 0,
  summary_md text,
  metrics jsonb DEFAULT '{}'::jsonb,
  triggered_by text DEFAULT 'cron'
);

CREATE TABLE public.manus_growth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.manus_growth_runs(id) ON DELETE SET NULL,
  phase text NOT NULL,
  url text,
  action text NOT NULL,
  before_state jsonb,
  after_state jsonb,
  kpi_delta jsonb,
  status text NOT NULL DEFAULT 'ok',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.manus_growth_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL DEFAULT current_date,
  url text NOT NULL,
  query text,
  clicks int DEFAULT 0,
  impressions int DEFAULT 0,
  ctr numeric(5,4) DEFAULT 0,
  position numeric(6,2) DEFAULT 0,
  conv_rate numeric(5,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_date, url, query)
);
CREATE INDEX idx_growth_kpis_url_date ON public.manus_growth_kpis(url, snapshot_date DESC);

CREATE TABLE public.manus_seo_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL UNIQUE,
  meta_title text,
  meta_description text,
  h1 text,
  h2_list jsonb,
  schema_org jsonb,
  body_injection text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_run uuid REFERENCES public.manus_growth_runs(id) ON DELETE SET NULL
);
CREATE TRIGGER trg_seo_overrides_updated_at
  BEFORE UPDATE ON public.manus_seo_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.manus_social_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  topic text,
  script text NOT NULL,
  caption text,
  hashtags text[],
  status text NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_run uuid REFERENCES public.manus_growth_runs(id) ON DELETE SET NULL
);

CREATE TABLE public.manus_growth_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body_md text NOT NULL,
  proposed_files jsonb,
  github_issue_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ RLS ============
ALTER TABLE public.manus_growth_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manus_growth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manus_growth_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manus_seo_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manus_social_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manus_growth_proposals ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT em todas
CREATE POLICY "admin_select" ON public.manus_growth_runs FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_select" ON public.manus_growth_logs FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_select" ON public.manus_growth_kpis FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_select" ON public.manus_seo_overrides FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_select" ON public.manus_social_queue FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_select" ON public.manus_growth_proposals FOR SELECT USING (has_role(auth.uid(),'admin'::app_role));

-- Admin-only manage (UPDATE/DELETE em runs/overrides/queue/proposals)
CREATE POLICY "admin_manage" ON public.manus_growth_runs FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_manage" ON public.manus_seo_overrides FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_manage" ON public.manus_social_queue FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_manage" ON public.manus_growth_proposals FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Logs e KPIs: apenas admin INSERT (service role bypassa RLS)
CREATE POLICY "admin_insert" ON public.manus_growth_logs FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "admin_insert" ON public.manus_growth_kpis FOR INSERT WITH CHECK (has_role(auth.uid(),'admin'::app_role));
-- Logs imutáveis (sem UPDATE/DELETE para ninguém via RLS — apenas service_role)
