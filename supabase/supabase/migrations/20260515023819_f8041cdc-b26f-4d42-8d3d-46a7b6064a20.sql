-- 1) Lock down internal SECURITY DEFINER functions
DO $$
DECLARE
  fn text;
  internal_fns text[] := ARRAY[
    'public.credit_affiliate_wallet(uuid, numeric)',
    'public.ensure_affiliate_wallet(uuid)',
    'public.increment_planta_coins(uuid, integer)',
    'public.cleanup_http_logs()',
    'public.anonymize_old_ot_orders()',
    'public.calculate_doctor_performance(integer, numeric, numeric, text)',
    'public.get_active_contingency_pix()',
    'public.get_pending_urgent_triages()',
    'public.get_payment_status_summary()'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;

-- 2) Public read for avatars bucket
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 3) Token-based read-back for anonymous OT orders
-- Matches by session_token header against ot_access_tokens, where token contact equals order's whatsapp or email
DROP POLICY IF EXISTS "OT orders: token read" ON public.orientacao_tecnica_orders;
CREATE POLICY "OT orders: token read"
ON public.orientacao_tecnica_orders FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ot_access_tokens t
    WHERE t.session_token = current_setting('request.headers', true)::jsonb->>'x-ot-token'
      AND t.verified_at IS NOT NULL
      AND (t.session_expires_at IS NULL OR t.session_expires_at > now())
      AND (
        t.contact = orientacao_tecnica_orders.patient_whatsapp
        OR t.contact = orientacao_tecnica_orders.patient_email
      )
  )
);