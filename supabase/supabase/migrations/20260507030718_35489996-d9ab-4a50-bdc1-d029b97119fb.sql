
-- Drop misleadingly-named "Service role" policies that actually granted ALL/INSERT to every role.
-- Service role bypasses RLS, so these policies were unnecessary and dangerous.

DROP POLICY IF EXISTS "Service role can manage social interactions" ON public.social_interactions;
DROP POLICY IF EXISTS "Service role full access" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Service role inserts routing log" ON public.whatsapp_routing_log;
DROP POLICY IF EXISTS "Service role can insert alert history" ON public.alert_history;
DROP POLICY IF EXISTS "pagamentos_audit service_role insert" ON public.pagamentos_audit;
DROP POLICY IF EXISTS "webhook_events service_role insert" ON public.webhook_events;

-- Replace with admin-only management policies (service role still bypasses RLS).
CREATE POLICY "Admins manage social_interactions" ON public.social_interactions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage whatsapp_conversations" ON public.whatsapp_conversations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read whatsapp_routing_log" ON public.whatsapp_routing_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read alert_history" ON public.alert_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read pagamentos_audit" ON public.pagamentos_audit
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read webhook_events" ON public.webhook_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
