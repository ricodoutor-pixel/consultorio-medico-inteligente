-- Guardião das consultas (docs/FLUXO_CONSULTAS.md, seção 9): roda a cada 5 minutos, registra cada anomalia
-- uma única vez (dedupe_key), corrige sozinho apenas casos seguros e avisa os administradores.

-- updated_at confiável em appointments: marca o início real da consulta (status -> in_progress).
CREATE OR REPLACE FUNCTION public.touch_appointments_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS appointments_touch_updated_at ON public.appointments;
CREATE TRIGGER appointments_touch_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.touch_appointments_updated_at();

CREATE TABLE IF NOT EXISTS public.consultation_guardian_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  message text NOT NULL,
  auto_fixed boolean NOT NULL DEFAULT false,
  dedupe_key text NOT NULL UNIQUE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);
CREATE INDEX IF NOT EXISTS consultation_guardian_events_open_idx
  ON public.consultation_guardian_events (created_at DESC) WHERE resolved_at IS NULL;

ALTER TABLE public.consultation_guardian_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.consultation_guardian_events FROM anon;
GRANT SELECT, UPDATE ON public.consultation_guardian_events TO authenticated;
GRANT ALL ON public.consultation_guardian_events TO service_role;
DROP POLICY IF EXISTS consultation_guardian_admin_read ON public.consultation_guardian_events;
CREATE POLICY consultation_guardian_admin_read ON public.consultation_guardian_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS consultation_guardian_admin_resolve ON public.consultation_guardian_events;
CREATE POLICY consultation_guardian_admin_resolve ON public.consultation_guardian_events
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DO $$ BEGIN PERFORM cron.unschedule('consultation_guardian'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('consultation_guardian', '*/5 * * * *', $cron$
  SELECT net.http_post(
    url := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/consultation-guardian',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ',
      'x-cron-secret', COALESCE(public.private_get_brisa_cron_secret(), '')
    ),
    body := '{}'::jsonb
  );
$cron$);
