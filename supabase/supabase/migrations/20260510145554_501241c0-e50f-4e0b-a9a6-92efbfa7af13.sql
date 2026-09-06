
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
  SELECT
    j.jobname::text,
    j.schedule::text,
    j.active,
    r.last_run_at,
    r.last_status,
    CASE
      WHEN r.last_run_at IS NULL THEN NULL
      ELSE round(EXTRACT(EPOCH FROM (now() - r.last_run_at)) / 3600.0, 2)
    END AS hours_since_last_run,
    (r.last_run_at IS NULL OR r.last_run_at < now() - make_interval(hours => _window_hours)) AS is_overdue
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT start_time AS last_run_at, status AS last_status
    FROM cron.job_run_details d
    WHERE d.jobid = j.jobid
    ORDER BY d.start_time DESC
    LIMIT 1
  ) r ON true
  WHERE j.active = true
  ORDER BY j.jobname;
$$;

REVOKE ALL ON FUNCTION public.get_cron_health(int) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_health(int) TO service_role;
