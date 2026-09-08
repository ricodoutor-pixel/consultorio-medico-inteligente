GRANT SELECT, INSERT, UPDATE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.doctor_kyc_documents TO authenticated;
GRANT ALL ON public.doctor_kyc_documents TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;