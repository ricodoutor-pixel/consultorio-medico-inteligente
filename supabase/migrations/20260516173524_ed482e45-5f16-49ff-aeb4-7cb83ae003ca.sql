
CREATE TABLE IF NOT EXISTS public.monitoring_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  err_critical_max int NOT NULL DEFAULT 0,
  err_total_max int NOT NULL DEFAULT 20,
  queue_stuck_minutes int NOT NULL DEFAULT 30,
  queue_stuck_max int NOT NULL DEFAULT 0,
  conv_drop_ratio numeric NOT NULL DEFAULT 0.5,
  conv_min_baseline int NOT NULL DEFAULT 5,
  cron_overdue_max int NOT NULL DEFAULT 0,
  mp_error_rate_max numeric NOT NULL DEFAULT 0.1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS monitoring_profiles_one_active
  ON public.monitoring_profiles (is_active) WHERE is_active = true;

ALTER TABLE public.monitoring_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage monitoring_profiles"
  ON public.monitoring_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_monitoring_profiles_updated_at
  BEFORE UPDATE ON public.monitoring_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.sentinel_escalation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_code text NOT NULL UNIQUE,
  description text,
  primary_channel text NOT NULL DEFAULT 'whatsapp',
  primary_target text NOT NULL,
  secondary_channel text,
  secondary_target text,
  consecutive_threshold int NOT NULL DEFAULT 2,
  cooldown_minutes int NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  last_escalated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sentinel_escalation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage sentinel_escalation_rules"
  ON public.sentinel_escalation_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_sentinel_escalation_updated_at
  BEFORE UPDATE ON public.sentinel_escalation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.manus_sentinel_runs
  ADD COLUMN IF NOT EXISTS is_simulation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS triggered_by text DEFAULT 'cron';

CREATE INDEX IF NOT EXISTS manus_sentinel_runs_ran_at_idx
  ON public.manus_sentinel_runs (ran_at DESC);

INSERT INTO public.monitoring_profiles (name, is_active, notes)
SELECT 'Padrão', true, 'Perfil inicial. Edite os limiares conforme necessário.'
WHERE NOT EXISTS (SELECT 1 FROM public.monitoring_profiles);

INSERT INTO public.sentinel_escalation_rules (issue_code, description, primary_channel, primary_target, secondary_channel, secondary_target, consecutive_threshold)
VALUES
  ('MP_DOWN', 'Mercado Pago offline', 'whatsapp', '5511987131241', 'whatsapp', '5511991363154', 1),
  ('QUEUE_STUCK', 'Pacientes >30min na fila', 'whatsapp', '5511987131241', 'whatsapp', '5511991363154', 2),
  ('ERR_CRITICAL', 'Erros críticos em 15min', 'whatsapp', '5511987131241', 'whatsapp', '5511991363154', 1),
  ('CONV_DROP', 'Queda de conversão >50%', 'whatsapp', '5511987131241', NULL, NULL, 3),
  ('CRON_OVERDUE', 'Cron jobs atrasados', 'whatsapp', '5511987131241', NULL, NULL, 2)
ON CONFLICT (issue_code) DO NOTHING;
