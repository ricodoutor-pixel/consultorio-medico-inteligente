
DROP POLICY IF EXISTS "Personas readable by authenticated users" ON public.ai_personas;

DROP POLICY IF EXISTS "Anon can insert tracking events" ON public.social_interactions;

CREATE POLICY "Anon/auth tracking insert without PII"
  ON public.social_interactions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    subscriber_phone IS NULL
    AND subscriber_name IS NULL
    AND message_content IS NULL
    AND (subscriber_id IS NULL OR subscriber_id = auth.uid()::text)
  );

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'anonymize_ot_orders_daily') THEN
    PERFORM cron.schedule(
      'anonymize_ot_orders_daily',
      '15 3 * * *',
      $cron$ SELECT public.anonymize_old_ot_orders(); $cron$
    );
  END IF;
END $$;
