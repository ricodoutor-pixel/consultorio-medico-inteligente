
-- Marketing KPI baseline & daily targets for the Manus Growth CEO agent
CREATE TABLE IF NOT EXISTS public.marketing_kpi_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL UNIQUE DEFAULT 'global',
  baseline_visitors integer NOT NULL DEFAULT 118,
  baseline_set_at timestamptz NOT NULL DEFAULT now(),
  daily_new_visitors_target integer NOT NULL DEFAULT 100,
  signup_conversion_target numeric NOT NULL DEFAULT 0.50,
  orientacao_conversion_target numeric NOT NULL DEFAULT 0.30,
  lead_nurture_target numeric NOT NULL DEFAULT 0.20,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.marketing_kpi_targets (scope, baseline_visitors, daily_new_visitors_target, signup_conversion_target, orientacao_conversion_target, lead_nurture_target, notes)
VALUES ('global', 118, 100, 0.50, 0.30, 0.20, 'Baseline definida pelo Dr. Edilson em 17/05/2026: 118 visitantes Published. Meta: +100/dia, conv 50% cadastro, 30% orientação, 20% nutrição.')
ON CONFLICT (scope) DO NOTHING;

ALTER TABLE public.marketing_kpi_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage marketing kpi targets"
ON public.marketing_kpi_targets FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read marketing kpi targets"
ON public.marketing_kpi_targets FOR SELECT
TO authenticated
USING (true);

-- Daily aggregate snapshot of visitors / conversions vs target
CREATE TABLE IF NOT EXISTS public.marketing_daily_snapshot (
  snapshot_date date PRIMARY KEY,
  visitors_total integer NOT NULL DEFAULT 0,
  visitors_new integer NOT NULL DEFAULT 0,
  signups integer NOT NULL DEFAULT 0,
  orientacao_starts integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  target_new_visitors integer NOT NULL DEFAULT 100,
  delta_vs_target integer NOT NULL DEFAULT 0,
  on_track boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_daily_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read daily snapshot"
ON public.marketing_daily_snapshot FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
