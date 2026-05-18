-- LGPD: allow admins to delete ebook_funnel_log entries for right-to-erasure requests
DROP POLICY IF EXISTS "ebook_funnel_log_admin_delete" ON public.ebook_funnel_log;
CREATE POLICY "ebook_funnel_log_admin_delete"
ON public.ebook_funnel_log FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));