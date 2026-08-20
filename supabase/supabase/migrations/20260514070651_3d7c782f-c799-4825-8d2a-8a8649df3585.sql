
CREATE TABLE IF NOT EXISTS public.whatsapp_brisa_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  message TEXT NOT NULL,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_brisa_log_phone_created
  ON public.whatsapp_brisa_log (phone, created_at DESC);

ALTER TABLE public.whatsapp_brisa_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read brisa log" ON public.whatsapp_brisa_log;
CREATE POLICY "admins read brisa log"
  ON public.whatsapp_brisa_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
