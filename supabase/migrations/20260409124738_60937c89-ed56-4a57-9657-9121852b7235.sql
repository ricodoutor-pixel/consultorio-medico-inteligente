-- Fix: Restrict user_experiences SELECT to authenticated users only
-- This prevents unauthenticated access to user_id linked with health content

DROP POLICY IF EXISTS "Anyone can view experiences" ON public.user_experiences;

CREATE POLICY "Authenticated users can view experiences"
  ON public.user_experiences
  FOR SELECT
  TO authenticated
  USING (true);
