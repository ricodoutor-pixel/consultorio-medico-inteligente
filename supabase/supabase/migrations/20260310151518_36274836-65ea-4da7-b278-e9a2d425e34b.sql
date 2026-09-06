
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Users can notify themselves only"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
