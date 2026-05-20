
-- 1) Tabela infra_services
CREATE TABLE IF NOT EXISTS public.infra_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  provider text,
  expires_at timestamptz,
  cost_brl numeric(10,2),
  renewal_url text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  last_alert_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infra_services_expiring
  ON public.infra_services (expires_at) WHERE is_active = true;

ALTER TABLE public.infra_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage infra_services"
  ON public.infra_services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_infra_services_updated
  BEFORE UPDATE ON public.infra_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial (datas em branco — admin preenche)
INSERT INTO public.infra_services (name, category, provider, notes) VALUES
  ('Hostinger Hospedagem',         'hosting',   'Hostinger',     'Plano principal frontend'),
  ('VPS Evolution API',            'vps',       'Hostinger VPS', 'Container Evolution + Traefik (api.plantayraiz.com.br)'),
  ('Domínio plantayraiz.com.br',   'domain',    'Hostinger',     'Renovação anual obrigatória'),
  ('Supabase Pro',                 'database',  'Supabase',      'Plano Pro Lovable Cloud'),
  ('Meta Long-Lived Token',        'api_token', 'Meta/Facebook', 'Page Access Token — expira ~60 dias'),
  ('OpenAI API Key',               'api_token', 'OpenAI',        'Billing mensal'),
  ('Gemini / Google AI API',       'api_token', 'Google',        'Billing mensal')
ON CONFLICT DO NOTHING;

-- 2) Cron: brisa-silence-watchdog (a cada 10min)
DO $$
DECLARE v_secret text; v_url text := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1';
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'BRISA_CEO_SECRET_KEY' LIMIT 1;

  PERFORM cron.unschedule('brisa-silence-watchdog-10min') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'brisa-silence-watchdog-10min'
  );
  PERFORM cron.schedule(
    'brisa-silence-watchdog-10min',
    '*/10 * * * *',
    format($f$ SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', %L),
        body := '{}'::jsonb
      ); $f$, v_url || '/brisa-silence-watchdog', COALESCE(v_secret,''))
  );

  -- 3) Cron: infra-expiry-monitor (diário 12:00 UTC = 09:00 BRT)
  PERFORM cron.unschedule('infra-expiry-monitor-daily') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'infra-expiry-monitor-daily'
  );
  PERFORM cron.schedule(
    'infra-expiry-monitor-daily',
    '0 12 * * *',
    format($f$ SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', %L),
        body := '{}'::jsonb
      ); $f$, v_url || '/infra-expiry-monitor', COALESCE(v_secret,''))
  );
END $$;
