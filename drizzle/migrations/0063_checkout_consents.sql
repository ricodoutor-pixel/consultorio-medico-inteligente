-- Aceite de Termos de Uso, Política de Privacidade (LGPD) e Termo de Telemedicina (Res. CFM 2.314/2022)
-- registrado em cada checkout. Só o servidor grava (checkout-express); o paciente lê os próprios aceites.
CREATE TABLE IF NOT EXISTS public.checkout_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product text NOT NULL,
  terms_version text NOT NULL,
  accepted_terms boolean NOT NULL,
  accepted_privacy boolean NOT NULL,
  accepted_telemedicine boolean NOT NULL,
  ip text,
  user_agent text,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checkout_consents_user_idx ON public.checkout_consents (user_id, created_at DESC);

ALTER TABLE public.checkout_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_consents FROM anon, authenticated;
GRANT SELECT ON public.checkout_consents TO authenticated;

DROP POLICY IF EXISTS checkout_consents_own_read ON public.checkout_consents;
CREATE POLICY checkout_consents_own_read ON public.checkout_consents
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS checkout_consents_admin_read ON public.checkout_consents;
CREATE POLICY checkout_consents_admin_read ON public.checkout_consents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Busca de CPF já cadastrado no checkout expresso.
CREATE INDEX IF NOT EXISTS profiles_cpf_idx ON public.profiles (cpf) WHERE cpf IS NOT NULL;
