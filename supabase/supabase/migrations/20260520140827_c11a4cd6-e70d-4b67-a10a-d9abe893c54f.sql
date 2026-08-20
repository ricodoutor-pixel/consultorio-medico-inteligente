
-- Revoke EXECUTE on admin/internal SECURITY DEFINER functions from authenticated and anon
REVOKE EXECUTE ON FUNCTION public.calculate_doctor_performance(integer, numeric, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_cron_health(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_next_available_doctor() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_payment_status_summary() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_planta_coins(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_affiliate_wallet(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_affiliate_wallet(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_referral_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_brisa_social_post(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_brisa_vault_secret(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.private_get_brisa_cron_secret() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_http_logs() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.anonymize_old_ot_orders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_edge_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;

-- Defense-in-depth: explicit restrictive SELECT policies blocking anon on sensitive tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='whatsapp_conversations' AND policyname='deny_anon_select_whatsapp_conversations') THEN
    EXECUTE 'CREATE POLICY deny_anon_select_whatsapp_conversations ON public.whatsapp_conversations AS RESTRICTIVE FOR SELECT TO anon USING (false)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payment_contingency_config' AND policyname='deny_anon_select_pcc') THEN
    EXECUTE 'CREATE POLICY deny_anon_select_pcc ON public.payment_contingency_config AS RESTRICTIVE FOR SELECT TO anon USING (false)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='brisa_triage_severity' AND policyname='deny_anon_select_triage') THEN
    EXECUTE 'CREATE POLICY deny_anon_select_triage ON public.brisa_triage_severity AS RESTRICTIVE FOR SELECT TO anon USING (false)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='doctors_financial' AND policyname='deny_anon_select_doctors_financial') THEN
    EXECUTE 'CREATE POLICY deny_anon_select_doctors_financial ON public.doctors_financial AS RESTRICTIVE FOR SELECT TO anon USING (false)';
  END IF;
END $$;
