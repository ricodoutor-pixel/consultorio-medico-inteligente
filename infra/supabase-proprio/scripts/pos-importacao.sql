-- Run ONCE on the new Supabase project, right after importing the Lovable Cloud dump.
-- Points the pg_cron jobs and stored URLs at our address instead of the old Lovable project.
-- Review each output before the COMMIT.

BEGIN;

-- 1. Cron jobs that call functions by URL
SELECT jobid, jobname, schedule, left(command, 160) AS command_before
FROM cron.job
WHERE command ILIKE '%shmbwdjuddvquszwkvuq%';

UPDATE cron.job
SET command = replace(command, 'https://shmbwdjuddvquszwkvuq.supabase.co', 'https://banco.plantayraiz.com.br')
WHERE command ILIKE '%shmbwdjuddvquszwkvuq%';

-- 2. Anything else still mentioning the old project (list only; fix case by case)
SELECT n.nspname, p.proname
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosrc ILIKE '%shmbwdjuddvquszwkvuq%';

-- 3. Sanity counts to compare with the Lovable export
SELECT
  (SELECT count(*) FROM auth.users)                 AS auth_users,
  (SELECT count(*) FROM public.doctors)             AS doctors,
  (SELECT count(*) FROM public.appointments)        AS appointments,
  (SELECT count(*) FROM public.payments)            AS payments,
  (SELECT count(*) FROM public.orientacao_tecnica_orders) AS ot_orders,
  (SELECT count(*) FROM storage.objects)            AS storage_objects,
  (SELECT count(*) FROM cron.job)                   AS cron_jobs;

-- COMMIT;  -- only after the numbers above match the export
