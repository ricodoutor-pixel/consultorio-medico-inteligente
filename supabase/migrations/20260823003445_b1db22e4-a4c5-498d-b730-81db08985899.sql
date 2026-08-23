-- Revogar EXECUTE público das funções de trigger (só disparam via trigger, nunca via RPC)
REVOKE EXECUTE ON FUNCTION public.calculate_payment_split() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.credit_doctor_wallet_on_release() FROM anon, authenticated, PUBLIC;

-- email_queue é exclusiva do backend (service_role ignora RLS); política de negação explícita
CREATE POLICY "Deny all client access to email queue" ON public.email_queue
  FOR ALL TO authenticated, anon
  USING (false)
  WITH CHECK (false);