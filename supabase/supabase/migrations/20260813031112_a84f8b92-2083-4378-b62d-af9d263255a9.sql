CREATE POLICY "admins_select_kyc"
ON public.doctor_kyc_documents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));