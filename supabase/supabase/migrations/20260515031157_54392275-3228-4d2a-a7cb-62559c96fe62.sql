-- ============================================================
-- Lock down SECURITY DEFINER functions: revoke EXECUTE from
-- anon/authenticated/public on functions that must NEVER be
-- called directly by clients. RLS-critical helpers and
-- intentionally-public functions keep their grants.
-- ============================================================

-- Privileged: only service_role / triggers should call these
DO $$
DECLARE
  fn text;
  privileged text[] := ARRAY[
    'public.cleanup_http_logs()',
    'public.get_cron_health(integer)',
    'public.credit_affiliate_wallet(uuid, numeric)',
    'public.ensure_affiliate_wallet(uuid)',
    'public.increment_planta_coins(uuid, integer)',
    'public.anonymize_old_ot_orders()',
    'public.handle_new_user()',
    'public.handle_consultation_rating()',
    'public.audit_sensitive_access()',
    'public.block_doctor_sensitive_update()',
    'public.prevent_vendor_balance_tampering()',
    'public.enforce_vendor_transaction_amount()',
    'public.validate_leads_contatos()',
    'public.validate_ot_order_insert()',
    'public.validate_nps_response()',
    'public.calculate_doctor_performance(integer, numeric, numeric, text)',
    'public.update_brand_identity_updated_at()',
    'public.update_updated_at_column()',
    'public.get_payment_status_summary()',
    'public.get_pending_urgent_triages()'
  ];
BEGIN
  FOREACH fn IN ARRAY privileged LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Skipping missing function: %', fn;
    END;
  END LOOP;
END $$;

-- Keep these EXECUTABLE by anon/authenticated (used by RLS policies
-- or intentionally public, return only non-sensitive aggregated data):
--   has_role, has_active_subscription          -- RLS critical
--   get_active_contingency_pix                  -- public PIX fallback
--   increment_site_counter                      -- public counters
--   calculate_fuzzy_severity                    -- pure function
--   search_scientific_articles                  -- public catalog
--   get_ot_order_by_token                       -- token-gated, validates internally