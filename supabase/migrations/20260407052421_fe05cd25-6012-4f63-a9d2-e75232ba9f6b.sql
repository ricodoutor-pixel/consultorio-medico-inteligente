
-- 1. Fix club_notifications INSERT policy
DROP POLICY IF EXISTS "Auth users can create notifications" ON public.club_notifications;
CREATE POLICY "Auth users can create notifications" ON public.club_notifications
  FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Remove sensitive tables from Realtime publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'doctors'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.doctors;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.appointments;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'ai_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.ai_events;
  END IF;
END $$;

-- 3. Fix experience-images storage policies
DROP POLICY IF EXISTS "Authenticated users can upload experience images" ON storage.objects;
CREATE POLICY "Authenticated users can upload experience images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'experience-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own experience images" ON storage.objects;
CREATE POLICY "Users can delete own experience images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'experience-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Add UPDATE policy for experience-images storage
DROP POLICY IF EXISTS "Users can update own experience images" ON storage.objects;
CREATE POLICY "Users can update own experience images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'experience-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'experience-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Fix btc_subscriptions user_id to NOT NULL
ALTER TABLE public.btc_subscriptions ALTER COLUMN user_id SET NOT NULL;
