-- Advances the consultation queue every minute, independent of the patient's page being open:
-- expires unanswered 5-minute offers, invites the next doctor and restarts waiting-room consultations
-- whose retry time arrived (docs/FLUXO_CONSULTAS.md, section 3). The anon key below is the public client key.
DO $$ BEGIN PERFORM cron.unschedule('consultation_queue_sweep'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule('consultation_queue_sweep', '* * * * *', $cron$
  SELECT net.http_post(
    url := 'https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/consultation-offer?action=sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWJ3ZGp1ZGR2cXVzendrdnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE4MDksImV4cCI6MjA4Nzg2NzgwOX0.wGL0NQi2gKWyiC4L1ca1xxzSvEbvq2Uc8jvM7XOH9xQ',
      'x-cron-secret', COALESCE(public.private_get_brisa_cron_secret(), '')
    ),
    body := '{}'::jsonb
  );
$cron$);
