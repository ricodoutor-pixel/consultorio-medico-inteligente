-- Revoke EXECUTE from anon + authenticated on sensitive SECURITY DEFINER functions.
-- Service role retains EXECUTE (it bypasses these grants). Triggers still execute as definer.

DO $$
DECLARE
  fn text;
  sigs text[];
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'credit_affiliate_wallet(uuid,numeric)',
    'ensure_affiliate_wallet(uuid)',
    'increment_planta_coins(uuid,integer)',
    'anonymize_old_ot_orders()',
    'increment_site_counter(text)',
    'calculate_doctor_performance(integer,numeric,numeric,text)',
    'handle_new_user()',
    'handle_consultation_rating()',
    'audit_sensitive_access()',
    'prevent_vendor_balance_tampering()',
    'validate_leads_contatos()',
    'validate_nps_response()',
    'update_updated_at_column()',
    'update_brand_identity_updated_at()'
  ])
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM anon, authenticated, PUBLIC', fn);
    EXCEPTION WHEN undefined_function THEN
      -- Skip missing signatures silently
      NULL;
    END;
  END LOOP;
END $$;

-- Keep these callable (used by RLS / app):
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_scientific_articles(text, integer) TO anon, authenticated;