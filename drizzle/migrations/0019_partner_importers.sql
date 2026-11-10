CREATE TABLE IF NOT EXISTS public.partner_importers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  cnpj TEXT,
  representative_name TEXT NOT NULL,
  representative_email TEXT NOT NULL,
  representative_phone TEXT NOT NULL,
  country_of_origin TEXT NOT NULL,
  anvisa_homologation_status TEXT NOT NULL DEFAULT 'pending' CHECK (anvisa_homologation_status IN ('pending','approved','rejected')),
  catalog_url TEXT,
  sla_dispatch_days INTEGER DEFAULT 3 CHECK (sla_dispatch_days IS NULL OR sla_dispatch_days BETWEEN 0 AND 120),
  coa_document_urls TEXT[] NOT NULL DEFAULT '{}',
  gmp_certificate_url TEXT,
  contract_signed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT ON public.partner_importers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_importers TO authenticated;
GRANT ALL ON public.partner_importers TO service_role;
ALTER TABLE public.partner_importers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads approved importers" ON public.partner_importers FOR SELECT TO anon, authenticated
  USING (anvisa_homologation_status = 'approved');
CREATE POLICY "Owner reads own importer" ON public.partner_importers FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Owner registers own importer" ON public.partner_importers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND anvisa_homologation_status = 'pending' AND contract_signed = false);
CREATE POLICY "Owner updates own importer" ON public.partner_importers FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage importers" ON public.partner_importers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.guard_partner_importer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NOT public.has_role(auth.uid(),'admin') AND auth.role() <> 'service_role' THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.anvisa_homologation_status := OLD.anvisa_homologation_status;
      NEW.contract_signed := OLD.contract_signed;
      NEW.user_id := OLD.user_id;
    ELSE
      NEW.anvisa_homologation_status := 'pending';
      NEW.contract_signed := false;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_guard_partner_importer BEFORE INSERT OR UPDATE ON public.partner_importers
  FOR EACH ROW EXECUTE FUNCTION public.guard_partner_importer();