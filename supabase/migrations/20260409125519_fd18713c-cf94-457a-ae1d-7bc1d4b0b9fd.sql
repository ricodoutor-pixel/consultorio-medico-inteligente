-- Fix: Restrict ai_registry SELECT to admin users only
DROP POLICY IF EXISTS "Anyone can read ai_registry" ON public.ai_registry;

CREATE POLICY "Only admins can read ai_registry"
  ON public.ai_registry
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
