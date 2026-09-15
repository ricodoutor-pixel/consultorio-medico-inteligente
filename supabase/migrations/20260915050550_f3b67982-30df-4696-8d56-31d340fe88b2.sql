GRANT EXECUTE ON FUNCTION public.get_next_available_doctor() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_doctor_for_country(text) TO anon, authenticated, service_role;