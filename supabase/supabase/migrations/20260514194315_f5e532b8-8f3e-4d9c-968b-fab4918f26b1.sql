-- Restrict system_settings to admins only (contained PIX keys, MP contingency flags, internal infra metrics)
DROP POLICY IF EXISTS "Anyone can read system_settings" ON public.system_settings;

-- Admins-only management policy already exists; ensure it covers SELECT explicitly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.system_settings'::regclass
      AND polname = 'Admins read system_settings'
  ) THEN
    CREATE POLICY "Admins read system_settings"
      ON public.system_settings FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;