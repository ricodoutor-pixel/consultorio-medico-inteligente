
CREATE POLICY "orientacao_tecnica_admin_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'orientacao-tecnica' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "orientacao_tecnica_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'orientacao-tecnica' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'orientacao-tecnica' AND public.has_role(auth.uid(), 'admin'::app_role));
