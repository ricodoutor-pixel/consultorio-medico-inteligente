
-- Block client writes on ot_access_tokens (only service_role should write)
CREATE POLICY "ot_access_tokens block client insert"
  ON public.ot_access_tokens AS RESTRICTIVE FOR INSERT
  TO anon, authenticated WITH CHECK (false);
CREATE POLICY "ot_access_tokens block client update"
  ON public.ot_access_tokens AS RESTRICTIVE FOR UPDATE
  TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "ot_access_tokens block client delete"
  ON public.ot_access_tokens AS RESTRICTIVE FOR DELETE
  TO anon, authenticated USING (false);

-- Block client writes on whatsapp_brisa_log
CREATE POLICY "whatsapp_brisa_log block client insert"
  ON public.whatsapp_brisa_log AS RESTRICTIVE FOR INSERT
  TO anon, authenticated WITH CHECK (false);
CREATE POLICY "whatsapp_brisa_log block client update"
  ON public.whatsapp_brisa_log AS RESTRICTIVE FOR UPDATE
  TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "whatsapp_brisa_log block client delete"
  ON public.whatsapp_brisa_log AS RESTRICTIVE FOR DELETE
  TO anon, authenticated USING (false);

-- Tighten club_notifications insert to prevent triggered_by_user_id spoofing
DROP POLICY IF EXISTS "Auth users can create notifications" ON public.club_notifications;
CREATE POLICY "Auth users can create notifications"
  ON public.club_notifications FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
    AND (
      triggered_by_user_id IS NULL
      OR triggered_by_user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );
