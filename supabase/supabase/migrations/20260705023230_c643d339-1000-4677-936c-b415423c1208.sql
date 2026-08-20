-- Fix SECURITY DEFINER view: force security_invoker so RLS/permissions
-- of the querying user apply.
ALTER VIEW public.doctors_public SET (security_invoker = on);

-- Defense-in-depth: explicit RESTRICTIVE deny-anon on whatsapp_messages,
-- matching the pattern already applied to whatsapp_conversations /
-- brisa_unified_conversations. Existing PERMISSIVE admin policies keep working.
DROP POLICY IF EXISTS "Deny anon read whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Deny anon read whatsapp_messages"
  ON public.whatsapp_messages
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (false);