CREATE POLICY "deny_non_admin_select_meta_token_storage"
  ON public.meta_token_storage AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "deny_non_admin_select_agent_registry"
  ON public.agent_registry AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "deny_non_admin_select_ai_personas"
  ON public.ai_personas AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "deny_non_admin_select_sv_partners"
  ON public.saude_verde_partners AS RESTRICTIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
