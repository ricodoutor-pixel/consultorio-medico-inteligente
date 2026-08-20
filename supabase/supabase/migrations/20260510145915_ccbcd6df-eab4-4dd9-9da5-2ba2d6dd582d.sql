
CREATE OR REPLACE FUNCTION public.get_cron_health(_window_hours int DEFAULT 26)
RETURNS TABLE (
  jobname text,
  schedule text,
  active boolean,
  last_run_at timestamptz,
  last_status text,
  hours_since_last_run numeric,
  is_overdue boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, cron
AS $$
  WITH recent AS (
    SELECT DISTINCT ON (jobid)
      jobid, start_time, status
    FROM cron.job_run_details
    WHERE start_time > now() - interval '35 days'
    ORDER BY jobid, start_time DESC
  )
  SELECT
    j.jobname::text,
    j.schedule::text,
    j.active,
    r.start_time AS last_run_at,
    r.status::text AS last_status,
    CASE
      WHEN r.start_time IS NULL THEN NULL
      ELSE round(EXTRACT(EPOCH FROM (now() - r.start_time)) / 3600.0, 2)
    END AS hours_since_last_run,
    (r.start_time IS NULL OR r.start_time < now() - make_interval(hours => _window_hours)) AS is_overdue
  FROM cron.job j
  LEFT JOIN recent r ON r.jobid = j.jobid
  WHERE j.active = true
  ORDER BY j.jobname;
$$;
