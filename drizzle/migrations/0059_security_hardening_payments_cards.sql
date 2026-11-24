-- 1) Appointments: patients cannot self-mark as paid
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
CREATE POLICY "Patients can create appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    patient_id = auth.uid()
    AND coalesce(payment_status, 'pending') = 'pending'
    AND coalesce(status, 'scheduled') = 'scheduled'
    AND payment_id IS NULL
  );

-- 2) Affiliate wallets: admins read-only; refunds through guarded RPC
DROP POLICY IF EXISTS "Admins can manage wallets" ON public.affiliate_wallets;
CREATE POLICY "Admins can view wallets" ON public.affiliate_wallets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.admin_reject_affiliate_withdrawal(_withdrawal_id uuid, _reason text DEFAULT 'Reprovado pelo admin')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_w RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT id, user_id, amount, status INTO v_w
    FROM public.affiliate_withdrawals WHERE id = _withdrawal_id FOR UPDATE;
  IF v_w.id IS NULL OR v_w.status <> 'pending' THEN
    RETURN false;
  END IF;
  IF v_w.user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_review_own_withdrawal';
  END IF;
  UPDATE public.affiliate_withdrawals
     SET status = 'rejected', rejected_reason = left(coalesce(_reason, 'Reprovado pelo admin'), 300)
   WHERE id = v_w.id;
  UPDATE public.affiliate_wallets
     SET available_balance = available_balance + v_w.amount, updated_at = now()
   WHERE user_id = v_w.user_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reject_affiliate_withdrawal(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_affiliate_withdrawal(uuid, text) TO authenticated, service_role;

-- 3) Prescriptions: signed file path is server-only
CREATE OR REPLACE FUNCTION public.guard_prescription_signed_path()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(current_setting('request.jwt.claim.role', true), '') IN ('anon', 'authenticated')
     OR coalesce((current_setting('request.jwt.claims', true))::jsonb ->> 'role', '') IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' AND NEW.signed_pdf_path IS NOT NULL THEN
      RAISE EXCEPTION 'signed_pdf_path is server-managed';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.signed_pdf_path IS DISTINCT FROM OLD.signed_pdf_path THEN
      RAISE EXCEPTION 'signed_pdf_path is server-managed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_prescription_signed_path ON public.prescriptions;
CREATE TRIGGER guard_prescription_signed_path
  BEFORE INSERT OR UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.guard_prescription_signed_path();

-- 4) Health card: server-issued HMAC tokens
CREATE TABLE IF NOT EXISTS public.health_card_token_secrets (
  subscription_id uuid PRIMARY KEY,
  secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.health_card_token_secrets TO service_role;
ALTER TABLE public.health_card_token_secrets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.issue_card_token()
RETURNS TABLE(card_number text, token text, window_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_secret text;
  v_win bigint := floor(EXTRACT(EPOCH FROM now()) / 300)::bigint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT s.id, s.card_number INTO v_sub
    FROM public.health_card_subscriptions s
   WHERE s.user_id = auth.uid() AND s.status = 'active'
     AND (s.current_period_end IS NULL OR s.current_period_end > now())
   ORDER BY s.created_at DESC LIMIT 1;
  IF v_sub.id IS NULL THEN RETURN; END IF;
  INSERT INTO public.health_card_token_secrets(subscription_id) VALUES (v_sub.id)
    ON CONFLICT (subscription_id) DO NOTHING;
  SELECT t.secret INTO v_secret FROM public.health_card_token_secrets t WHERE t.subscription_id = v_sub.id;
  RETURN QUERY SELECT v_sub.card_number,
    v_win::text || '.' || left(encode(extensions.hmac(v_sub.card_number || '.' || v_win::text, v_secret, 'sha256'), 'hex'), 24),
    300;
END;
$$;
REVOKE ALL ON FUNCTION public.issue_card_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_card_token() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.validate_card_token(_card_number text, _token text, _window_seconds integer DEFAULT 300)
RETURNS TABLE(valid boolean, user_id uuid, plan_type text, status text, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_sub RECORD;
  v_win BIGINT;
  v_now_win BIGINT := floor(EXTRACT(EPOCH FROM now()) / 300)::bigint;
  v_secret text;
  v_expected text;
BEGIN
  SELECT s.id, s.user_id, s.plan_type, s.status, s.current_period_end
    INTO v_sub
  FROM public.health_card_subscriptions s
  WHERE s.card_number = _card_number
  LIMIT 1;

  IF v_sub.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, 'card_not_found'; RETURN;
  END IF;
  IF v_sub.status <> 'active' THEN
    RETURN QUERY SELECT false, v_sub.user_id, v_sub.plan_type, v_sub.status, 'subscription_not_active'; RETURN;
  END IF;
  IF v_sub.current_period_end IS NOT NULL AND v_sub.current_period_end < now() THEN
    RETURN QUERY SELECT false, v_sub.user_id, v_sub.plan_type, v_sub.status, 'subscription_expired'; RETURN;
  END IF;

  BEGIN
    v_win := split_part(_token, '.', 1)::BIGINT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, v_sub.user_id, v_sub.plan_type, v_sub.status, 'invalid_token_format'; RETURN;
  END;
  IF v_win NOT IN (v_now_win, v_now_win - 1) THEN
    RETURN QUERY SELECT false, v_sub.user_id, v_sub.plan_type, v_sub.status, 'token_expired'; RETURN;
  END IF;

  SELECT t.secret INTO v_secret FROM public.health_card_token_secrets t WHERE t.subscription_id = v_sub.id;
  IF v_secret IS NULL THEN
    RETURN QUERY SELECT false, v_sub.user_id, v_sub.plan_type, v_sub.status, 'invalid_token'; RETURN;
  END IF;
  v_expected := left(encode(extensions.hmac(_card_number || '.' || v_win::text, v_secret, 'sha256'), 'hex'), 24);
  IF split_part(_token, '.', 2) IS DISTINCT FROM v_expected THEN
    RETURN QUERY SELECT false, v_sub.user_id, v_sub.plan_type, v_sub.status, 'invalid_token'; RETURN;
  END IF;

  RETURN QUERY SELECT true, v_sub.user_id, v_sub.plan_type, v_sub.status, 'ok';
END;
$function$;
REVOKE ALL ON FUNCTION public.validate_card_token(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_card_token(text, text, integer) TO service_role;

-- 5) Directory badges: no exact subscription end dates
CREATE OR REPLACE FUNCTION public.doctor_directory_badge_facts()
 RETURNS TABLE(doctor_id uuid, paid_until timestamp with time zone, registration_complete boolean, documents_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 SELECT c.id,
 CASE WHEN EXISTS (SELECT 1 FROM public.subscriptions s
  WHERE s.user_id=c.user_id AND s.environment='live' AND s.status='active'
    AND s.stripe_subscription_id LIKE 'mp_%' AND s.price_id LIKE 'plano_medico%'
    AND s.current_period_end > now()) THEN date_trunc('hour', now()) + interval '2 hours' ELSE NULL END,
 (nullif(trim(p.full_name),'') IS NOT NULL AND nullif(trim(p.phone),'') IS NOT NULL
  AND nullif(trim(p.cpf),'') IS NOT NULL AND p.date_of_birth IS NOT NULL
  AND nullif(trim(d.crm),'') IS NOT NULL AND nullif(trim(d.specialty),'') IS NOT NULL
  AND nullif(trim(d.bio),'') IS NOT NULL AND nullif(trim(p.avatar_url),'') IS NOT NULL
  AND nullif(trim(p.address_street),'') IS NOT NULL AND nullif(trim(p.address_number),'') IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM unnest(ARRAY['crm_front','crm_back','id_front','cpf_doc','address_proof']) required(kind)
     WHERE NOT EXISTS (SELECT 1 FROM public.doctor_kyc_documents k
       WHERE k.doctor_user_id=c.user_id AND k.document_kind=required.kind
       AND nullif(trim(k.storage_path),'') IS NOT NULL AND k.verification_status IS DISTINCT FROM 'rejected'))),
 LEAST((SELECT count(DISTINCT k.document_kind)::integer FROM public.doctor_kyc_documents k
    WHERE k.doctor_user_id=c.user_id AND nullif(trim(k.storage_path),'') IS NOT NULL
    AND k.verification_status IS DISTINCT FROM 'rejected' AND k.document_kind <> 'vip_receipt'), 5)
 FROM public.doctors_public c JOIN public.doctors d ON d.id=c.id
 JOIN public.profiles p ON p.id=c.user_id;
$function$;