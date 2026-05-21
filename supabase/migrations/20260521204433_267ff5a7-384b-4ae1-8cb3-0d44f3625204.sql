
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins write system_settings" ON public.system_settings;

CREATE POLICY "Admins read system_settings"
  ON public.system_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins write system_settings"
  ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS system_settings_updated_at ON public.system_settings;
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);

CREATE TABLE IF NOT EXISTS public.remote_command_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  key text,
  payload jsonb,
  source_ip text,
  success boolean NOT NULL DEFAULT true,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.remote_command_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read remote_command_log" ON public.remote_command_log;
CREATE POLICY "Admins read remote_command_log"
  ON public.remote_command_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.system_settings (key, value, description) VALUES
  ('brisa_system_prompt', '{"prompt": null, "version": "v0.3"}'::jsonb,
   'Override do system prompt da Enf. Brisa. Se prompt=null, usa BRISA_PERSONA do código.'),
  ('brisa_pricing', '{"orientacao_tecnica_brl": 30, "orientacao_tecnica_usd": 10}'::jsonb,
   'Preços dinâmicos da Orientação Técnica.'),
  ('brisa_lead_rules', '{"daily_target": 100, "conversion_target_pct": 50}'::jsonb,
   'Regras de filtragem e meta diária de leads.')
ON CONFLICT (key) DO NOTHING;
