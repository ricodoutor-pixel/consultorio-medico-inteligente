CREATE TABLE IF NOT EXISTS public.payment_provider_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  status text NOT NULL CHECK (status IN ('operational','degraded','down')),
  latency_ms integer,
  error_rate numeric(5,2) DEFAULT 0,
  last_error text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pph_provider_checked ON public.payment_provider_health(provider, checked_at DESC);

ALTER TABLE public.payment_provider_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY pph_admin_read ON public.payment_provider_health FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY pph_service_write ON public.payment_provider_health FOR INSERT TO service_role WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.payment_contingency_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pix_key text NOT NULL,
  pix_key_type text NOT NULL CHECK (pix_key_type IN ('cpf','cnpj','email','phone','random')),
  beneficiary_name text NOT NULL,
  beneficiary_doc text,
  whatsapp_proof_number text NOT NULL DEFAULT '5511991363154',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_contingency_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY pcc_admin_all ON public.payment_contingency_config FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE OR REPLACE FUNCTION public.get_payment_status_summary()
RETURNS TABLE(provider text, status text, latency_ms integer, error_rate numeric, checked_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT DISTINCT ON (provider) provider, status, latency_ms, error_rate, checked_at
  FROM public.payment_provider_health
  WHERE checked_at > now() - interval '30 minutes'
  ORDER BY provider, checked_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_payment_status_summary() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_active_contingency_pix()
RETURNS TABLE(pix_key text, pix_key_type text, beneficiary_name text, whatsapp_proof_number text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_mp_down boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.payment_provider_health
    WHERE provider = 'mercado_pago'
      AND status = 'down'
      AND checked_at > now() - interval '15 minutes'
  ) INTO v_mp_down;

  IF NOT v_mp_down THEN RETURN; END IF;

  RETURN QUERY
  SELECT c.pix_key, c.pix_key_type, c.beneficiary_name, c.whatsapp_proof_number
  FROM public.payment_contingency_config c
  WHERE c.is_active = true
  LIMIT 1;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_active_contingency_pix() TO anon, authenticated, service_role;

INSERT INTO public.payment_contingency_config (pix_key, pix_key_type, beneficiary_name, whatsapp_proof_number)
VALUES ('contato@plantayraiz.com.br', 'email', 'Planta y Raiz - Mega Clinica Digital', '5511991363154')
ON CONFLICT DO NOTHING;