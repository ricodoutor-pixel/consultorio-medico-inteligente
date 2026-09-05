CREATE TABLE public.vendor_terms_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  cnpj TEXT,
  signer_name TEXT NOT NULL,
  signer_doc TEXT NOT NULL,
  term_version TEXT NOT NULL DEFAULT 'v2026.1',
  term_hash TEXT NOT NULL,
  accepted_data_truthfulness BOOLEAN NOT NULL DEFAULT false,
  accepted_regulatory BOOLEAN NOT NULL DEFAULT false,
  accepted_liability BOOLEAN NOT NULL DEFAULT false,
  accepted_fees BOOLEAN NOT NULL DEFAULT false,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.vendor_terms_consents TO authenticated;
GRANT ALL ON public.vendor_terms_consents TO service_role;

ALTER TABLE public.vendor_terms_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can register own consent"
  ON public.vendor_terms_consents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Vendors can view own consent"
  ON public.vendor_terms_consents FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all consents"
  ON public.vendor_terms_consents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_vendor_terms_consents_user ON public.vendor_terms_consents(user_id);
CREATE INDEX idx_vendor_terms_consents_vendor ON public.vendor_terms_consents(vendor_id);