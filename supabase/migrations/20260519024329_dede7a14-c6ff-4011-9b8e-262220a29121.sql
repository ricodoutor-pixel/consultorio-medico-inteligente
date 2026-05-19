
SELECT cron.unschedule('brisa-ig-auto-post-30min');
SELECT cron.unschedule('brisa-fb-auto-post-30min');

SELECT cron.schedule(
  'brisa-ig-auto-post-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/brisa-ig-auto-post',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret','gJXdGY_G9vZaQ_Ygo8lr6M0Q1BB-0fEjG0CxfGq1Z8WMf-Fq'
    ),
    body:=jsonb_build_object('source','cron','at',now())
  );
  $$
);

SELECT cron.schedule(
  'brisa-fb-auto-post-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://shmbwdjuddvquszwkvuq.supabase.co/functions/v1/brisa-fb-auto-post',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret','gJXdGY_G9vZaQ_Ygo8lr6M0Q1BB-0fEjG0CxfGq1Z8WMf-Fq'
    ),
    body:=jsonb_build_object('source','cron','at',now())
  );
  $$
);
