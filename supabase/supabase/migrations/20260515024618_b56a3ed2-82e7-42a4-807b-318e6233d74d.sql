-- 1) Queue acceptance: require verified + KYC approved
DROP POLICY IF EXISTS "Doctors can accept queue entries" ON public.consultation_queue;
CREATE POLICY "Doctors can accept queue entries"
ON public.consultation_queue FOR UPDATE
TO authenticated
USING (
  status = 'waiting'
  AND EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.user_id = auth.uid()
      AND d.is_verified = true
      AND d.kyc_status = 'approved'
      AND d.suspended_at IS NULL
  )
)
WITH CHECK (
  matched_doctor_id IN (
    SELECT d.id FROM public.doctors d
    WHERE d.user_id = auth.uid()
      AND d.is_verified = true
      AND d.kyc_status = 'approved'
      AND d.suspended_at IS NULL
  )
);

-- 2) Realtime: restrict broadcast on public:* to admins/service; allow user/doctor own-scoped topics
DROP POLICY IF EXISTS "Authenticated users can broadcast to own-scoped topics" ON realtime.messages;
CREATE POLICY "Authenticated users can broadcast to own-scoped topics"
ON realtime.messages FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('user:' || auth.uid()::text)
  OR realtime.topic() LIKE ('doctor:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('doctor:' || auth.uid()::text)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3) OT orders: replace broad token policy with a SECURITY DEFINER function exposing only safe columns
DROP POLICY IF EXISTS "OT orders: token read" ON public.orientacao_tecnica_orders;

CREATE TABLE IF NOT EXISTS public.ot_token_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  session_token_hash text NOT NULL,
  ip text,
  accessed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ot_token_access_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ot_token_access_log admin read" ON public.ot_token_access_log;
CREATE POLICY "ot_token_access_log admin read"
ON public.ot_token_access_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_ot_order_by_token(_session_token text)
RETURNS TABLE (
  id uuid,
  status text,
  payment_status text,
  amount numeric,
  pdf_url text,
  qr_code text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact text;
  v_order_id uuid;
BEGIN
  IF _session_token IS NULL OR length(_session_token) < 16 THEN
    RETURN;
  END IF;

  SELECT t.contact INTO v_contact
  FROM public.ot_access_tokens t
  WHERE t.session_token = _session_token
    AND t.verified_at IS NOT NULL
    AND (t.session_expires_at IS NULL OR t.session_expires_at > now())
  LIMIT 1;

  IF v_contact IS NULL THEN
    RETURN;
  END IF;

  FOR id, status, payment_status, amount, pdf_url, qr_code, created_at, updated_at IN
    SELECT o.id, o.status, o.payment_status, o.amount, o.pdf_url, o.qr_code, o.created_at, o.updated_at
    FROM public.orientacao_tecnica_orders o
    WHERE o.patient_whatsapp = v_contact OR o.patient_email = v_contact
    ORDER BY o.created_at DESC
  LOOP
    v_order_id := id;
    INSERT INTO public.ot_token_access_log (order_id, session_token_hash)
    VALUES (v_order_id, encode(digest(_session_token, 'sha256'), 'hex'));
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ot_order_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ot_order_by_token(text) TO anon, authenticated;

-- 4) Public buckets: drop broad SELECT policies (objects remain reachable via public URL/CDN, but list is blocked)
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;