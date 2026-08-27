-- Public catalog is a deliberately sanitized view. It executes with the view owner's
-- read permission so callers never need access to the sensitive base table.
ALTER VIEW public.doctors_public SET (security_invoker = off);
GRANT SELECT ON public.doctors_public TO anon, authenticated;

-- Remove every public/verified-row policy from the sensitive base table.
DROP POLICY IF EXISTS "Public can view verified doctors" ON public.doctors;
DROP POLICY IF EXISTS "anon_only_verified_doctors" ON public.doctors;
DROP POLICY IF EXISTS "Authenticated users can view verified doctors" ON public.doctors;
DROP POLICY IF EXISTS "Authenticated can view verified doctors" ON public.doctors;

-- Anonymous callers have no direct base-table access. Authenticated access remains
-- subject to owner/admin RLS policies already present on public.doctors.
REVOKE ALL ON public.doctors FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;

-- Do not broadcast sensitive doctors rows through Realtime.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'doctors'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.doctors';
  END IF;
END $$;