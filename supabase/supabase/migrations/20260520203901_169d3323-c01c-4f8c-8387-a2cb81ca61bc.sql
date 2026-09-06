DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT jobid, jobname FROM cron.job 
    WHERE jobname ~* 'fb-auto|ig-auto|social|seniors|brisa-fb|brisa-ig|manus-social'
  LOOP
    PERFORM cron.unschedule(r.jobid);
    RAISE NOTICE 'Unscheduled: % (id=%)', r.jobname, r.jobid;
  END LOOP;
END $$;

-- Pausar fila: marcar pendentes como paused
UPDATE public.manus_social_queue
SET status = 'paused'
WHERE status IN ('approved','scheduled','draft');