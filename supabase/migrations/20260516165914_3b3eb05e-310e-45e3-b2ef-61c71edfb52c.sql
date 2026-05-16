
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'orders','orientacao_tecnica_orders','leads','appointments',
    'consultation_queue','audit_log','error_logs',
    'payment_provider_health','notifications','alert_history'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END LOOP;
END $$;
