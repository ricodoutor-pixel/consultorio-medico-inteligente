-- 1) Stop exposing PII (email/whatsapp) on clinic_profiles to anonymous users
DROP POLICY IF EXISTS "Public can view active clinics" ON public.clinic_profiles;

-- Make sure the public branding view exists and is readable by anon/authenticated.
-- Use DROP+CREATE because CREATE OR REPLACE cannot change view shape.
DROP VIEW IF EXISTS public.clinic_profiles_public;
CREATE VIEW public.clinic_profiles_public
WITH (security_invoker = true)
AS
SELECT
  id,
  doctor_name,
  specialty,
  domain,
  slug,
  logo_url,
  primary_color,
  secondary_color,
  tagline,
  description,
  active
FROM public.clinic_profiles
WHERE active = true;

GRANT SELECT ON public.clinic_profiles_public TO anon, authenticated;

-- Allow clinic owners to update their own clinic
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.clinic_profiles'::regclass
      AND polname = 'Owners can update their own clinic'
  ) THEN
    CREATE POLICY "Owners can update their own clinic"
      ON public.clinic_profiles
      FOR UPDATE
      TO authenticated
      USING (owner_user_id = auth.uid())
      WITH CHECK (owner_user_id = auth.uid());
  END IF;
END $$;

-- 2) orientacao-tecnica storage: authenticated patient can read own files (folder = user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname = 'orientacao-tecnica owner read'
  ) THEN
    CREATE POLICY "orientacao-tecnica owner read"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'orientacao-tecnica'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- 3) Reaffirm public marketplace read on doctors_public view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='doctors_public') THEN
    EXECUTE 'GRANT SELECT ON public.doctors_public TO anon, authenticated';
  END IF;
END $$;