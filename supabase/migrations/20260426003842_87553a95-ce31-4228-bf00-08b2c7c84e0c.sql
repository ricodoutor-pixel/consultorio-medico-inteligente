-- Garante REPLICA IDENTITY FULL (necessário para payloads completos no Realtime)
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Adiciona notifications ao publication do Realtime (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- Mesma garantia para consultation_queue (já está no publication, falta REPLICA IDENTITY FULL)
ALTER TABLE public.consultation_queue REPLICA IDENTITY FULL;

-- E para appointments (alertas de agendamento confirmado)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='appointments') THEN
    EXECUTE 'ALTER TABLE public.appointments REPLICA IDENTITY FULL';
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'appointments'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments';
    END IF;
  END IF;
END $$;