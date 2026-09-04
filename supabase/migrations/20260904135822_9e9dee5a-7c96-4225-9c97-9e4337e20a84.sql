GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_doctor_performance(integer, numeric, numeric, text) TO authenticated;