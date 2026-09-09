CREATE TABLE IF NOT EXISTS public.ot_agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone text NOT NULL,
  patient_name text,
  agent text NOT NULL DEFAULT 'dr_edilson_on',
  payment_row_id uuid REFERENCES public.brisa_orientacao_payments(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orientacao_tecnica_orders(id) ON DELETE SET NULL,
  external_reference text,
  duration_minutes integer NOT NULL DEFAULT 30,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes',
  closed_at timestamptz,
  closing_notice_sent_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','closed')),
  messages_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ot_agent_sessions_phone_status ON public.ot_agent_sessions (patient_phone, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ot_agent_sessions_payment_active ON public.ot_agent_sessions (payment_row_id) WHERE payment_row_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ot_agent_sessions_expires ON public.ot_agent_sessions (expires_at) WHERE status = 'active';

GRANT ALL ON public.ot_agent_sessions TO service_role;
GRANT SELECT ON public.ot_agent_sessions TO authenticated;

ALTER TABLE public.ot_agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all orientation sessions"
ON public.ot_agent_sessions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_ot_agent_sessions_updated_at ON public.ot_agent_sessions;
CREATE TRIGGER trg_ot_agent_sessions_updated_at
BEFORE UPDATE ON public.ot_agent_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Abre (ou devolve) a sessão de 30 minutos vinculada a um pagamento aprovado
CREATE OR REPLACE FUNCTION public.open_ot_agent_session(_phone text, _name text DEFAULT NULL, _minutes integer DEFAULT 30)
RETURNS TABLE (
  session_id uuid,
  status text,
  started_at timestamptz,
  expires_at timestamptz,
  seconds_left integer,
  opened_now boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_digits text := regexp_replace(COALESCE(_phone,''), '\D', '', 'g');
  v_sess RECORD;
  v_pay RECORD;
BEGIN
  IF v_digits = '' THEN RETURN; END IF;

  -- expira sessões vencidas desse telefone
  UPDATE public.ot_agent_sessions s
     SET status = 'expired', closed_at = COALESCE(s.closed_at, now())
   WHERE s.patient_phone = v_digits AND s.status = 'active' AND s.expires_at <= now();

  SELECT * INTO v_sess FROM public.ot_agent_sessions s
   WHERE s.patient_phone = v_digits AND s.status = 'active'
   ORDER BY s.started_at DESC LIMIT 1;

  IF v_sess.id IS NOT NULL THEN
    RETURN QUERY SELECT v_sess.id, v_sess.status, v_sess.started_at, v_sess.expires_at,
      GREATEST(0, EXTRACT(EPOCH FROM (v_sess.expires_at - now()))::int), false;
    RETURN;
  END IF;

  -- procura pagamento aprovado ainda não consumido por nenhuma sessão
  SELECT p.* INTO v_pay
    FROM public.brisa_orientacao_payments p
   WHERE regexp_replace(COALESCE(p.patient_phone,''), '\D', '', 'g') LIKE '%' || right(v_digits, 8)
     AND p.status = 'approved'
     AND NOT EXISTS (SELECT 1 FROM public.ot_agent_sessions s WHERE s.payment_row_id = p.id)
   ORDER BY p.created_at DESC LIMIT 1;

  IF v_pay.id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.ot_agent_sessions (patient_phone, patient_name, payment_row_id, external_reference, duration_minutes, expires_at)
  VALUES (v_digits, _name, v_pay.id, v_pay.external_reference, GREATEST(5, LEAST(120, COALESCE(_minutes,30))), now() + make_interval(mins => GREATEST(5, LEAST(120, COALESCE(_minutes,30)))))
  RETURNING * INTO v_sess;

  RETURN QUERY SELECT v_sess.id, v_sess.status, v_sess.started_at, v_sess.expires_at,
    GREATEST(0, EXTRACT(EPOCH FROM (v_sess.expires_at - now()))::int), true;
END;
$$;

-- Fecha sessões vencidas (usado pelo watchdog)
CREATE OR REPLACE FUNCTION public.expire_ot_agent_sessions()
RETURNS TABLE (session_id uuid, patient_phone text, patient_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.ot_agent_sessions s
     SET status = 'expired', closed_at = COALESCE(s.closed_at, now())
   WHERE s.status = 'active' AND s.expires_at <= now()
  RETURNING s.id, s.patient_phone, s.patient_name;
END;
$$;

REVOKE ALL ON FUNCTION public.open_ot_agent_session(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_ot_agent_sessions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_ot_agent_session(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_ot_agent_sessions() TO service_role;