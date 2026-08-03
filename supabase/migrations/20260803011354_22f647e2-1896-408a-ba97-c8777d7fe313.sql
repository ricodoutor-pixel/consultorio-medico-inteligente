ALTER TABLE public.doctors REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='doctors') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors';
  END IF;
END $$;