REVOKE EXECUTE ON FUNCTION public.calculate_fuzzy_severity(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pending_urgent_triages() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_fuzzy_severity(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_urgent_triages() TO service_role;