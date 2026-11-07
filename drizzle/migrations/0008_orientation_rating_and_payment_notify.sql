CREATE TABLE public.avaliacoes_orientacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ot_web_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating IN (1, 2, 3)),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

GRANT SELECT, INSERT ON public.avaliacoes_orientacao TO authenticated;
GRANT ALL ON public.avaliacoes_orientacao TO service_role;

ALTER TABLE public.avaliacoes_orientacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avaliacoes_orientacao_insert_own"
  ON public.avaliacoes_orientacao FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "avaliacoes_orientacao_select_own"
  ON public.avaliacoes_orientacao FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.payment_notify_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_reference TEXT NOT NULL UNIQUE,
  recipient TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_notify_log TO authenticated;
GRANT ALL ON public.payment_notify_log TO service_role;

ALTER TABLE public.payment_notify_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_notify_log_admin_read"
  ON public.payment_notify_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));