DROP FUNCTION IF EXISTS public.get_cron_health(integer);

CREATE FUNCTION public.get_cron_health(_window_hours integer DEFAULT NULL)
RETURNS TABLE(jobname text, schedule text, active boolean, last_run_at timestamptz, last_status text, hours_since_last_run numeric, expected_window_hours integer, is_overdue boolean)
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public','cron' AS $$
  WITH recent AS (
    SELECT DISTINCT ON (jobid) jobid, start_time, status
    FROM cron.job_run_details
    WHERE start_time > now() - interval '60 days'
    ORDER BY jobid, start_time DESC
  ),
  jobs AS (
    SELECT j.jobid, j.jobname::text AS jobname, j.schedule::text AS schedule, j.active,
      CASE
        WHEN _window_hours IS NOT NULL THEN _window_hours
        WHEN j.schedule ~ '^\*/[0-9]+ ' THEN 2
        WHEN j.schedule ~ '^[0-9]+ [0-9]+ \* \* \*$' THEN 26
        WHEN j.schedule ~ '^[0-9]+ [0-9]+ \* \* [0-9]+$' THEN 192
        WHEN j.schedule ~ '^[0-9]+ [0-9]+ [0-9]+ \* \*$' THEN 768
        ELSE 26
      END AS expected_window_hours
    FROM cron.job j
  )
  SELECT j.jobname, j.schedule, j.active, r.start_time,
    r.status::text,
    CASE WHEN r.start_time IS NULL THEN NULL
         ELSE round(EXTRACT(EPOCH FROM (now() - r.start_time))/3600.0, 2) END,
    j.expected_window_hours,
    (j.active AND (r.start_time IS NULL OR r.start_time < now() - make_interval(hours => j.expected_window_hours)))
  FROM jobs j LEFT JOIN recent r ON r.jobid = j.jobid
  WHERE j.active = true
  ORDER BY j.jobname;
$$;

GRANT EXECUTE ON FUNCTION public.get_cron_health(integer) TO authenticated, anon, service_role;