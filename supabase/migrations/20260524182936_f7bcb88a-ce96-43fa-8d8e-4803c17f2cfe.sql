
-- 1) saude_verde_partners: restrict raw table to admins, expose a public view without phone/whatsapp
DROP POLICY IF EXISTS "public_read_sv_partners" ON public.saude_verde_partners;

CREATE POLICY "admin_read_sv_partners"
ON public.saude_verde_partners
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.saude_verde_partners_public
WITH (security_invoker = true)
AS
SELECT
  id, name, slug, category, subcategory, logo_url,
  address, city, state, country, zipcode, latitude, longitude,
  website, discount_pct, discount_pct_max, price_from_brl,
  rating, total_reviews, is_active, is_verified, accepts_online,
  available_specialties, available_exams, opening_hours, created_at
FROM public.saude_verde_partners
WHERE is_active = true;

GRANT SELECT ON public.saude_verde_partners_public TO anon, authenticated;

-- 2) brand_assets: scrub PII from the public doctor_signature_block description
UPDATE public.brand_assets
SET description = 'Assinatura digital do médico responsável'
WHERE asset_key = 'doctor_signature_block';

-- 3) saude_verde_partner_requests: validation trigger
CREATE OR REPLACE FUNCTION public.validate_sv_partner_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone text;
  v_cnpj text;
  v_recent int;
BEGIN
  IF NEW.company_name IS NULL OR length(btrim(NEW.company_name)) < 2 OR length(NEW.company_name) > 200 THEN
    RAISE EXCEPTION 'Invalid company_name (2-200 chars required)';
  END IF;
  NEW.company_name := btrim(NEW.company_name);

  IF NEW.contact_name IS NULL OR length(btrim(NEW.contact_name)) < 2 OR length(NEW.contact_name) > 120 THEN
    RAISE EXCEPTION 'Invalid contact_name (2-120 chars required)';
  END IF;
  NEW.contact_name := btrim(NEW.contact_name);

  IF NEW.contact_email IS NULL OR length(NEW.contact_email) > 255
     OR NEW.contact_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid contact_email';
  END IF;

  v_phone := regexp_replace(COALESCE(NEW.contact_phone,''), '\D', '', 'g');
  IF v_phone !~ '^\d{10,15}$' THEN
    RAISE EXCEPTION 'Invalid contact_phone';
  END IF;
  NEW.contact_phone := v_phone;

  IF NEW.cnpj IS NOT NULL AND length(NEW.cnpj) > 0 THEN
    v_cnpj := regexp_replace(NEW.cnpj, '\D', '', 'g');
    IF v_cnpj !~ '^\d{14}$' THEN
      RAISE EXCEPTION 'Invalid cnpj';
    END IF;
    NEW.cnpj := v_cnpj;
  END IF;

  IF NEW.category IS NOT NULL AND length(NEW.category) > 80 THEN
    RAISE EXCEPTION 'category too long';
  END IF;

  -- Rate-limit anonymous submissions per phone
  IF auth.uid() IS NULL THEN
    SELECT count(*) INTO v_recent
    FROM public.saude_verde_partner_requests
    WHERE contact_phone = NEW.contact_phone
      AND created_at > now() - interval '10 minutes';
    IF v_recent >= 3 THEN
      RAISE EXCEPTION 'Rate limit exceeded. Try again later.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_sv_partner_request ON public.saude_verde_partner_requests;
CREATE TRIGGER trg_validate_sv_partner_request
BEFORE INSERT ON public.saude_verde_partner_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_sv_partner_request();

-- 4) nps_responses: tighter INSERT policy
DROP POLICY IF EXISTS "Patients can insert own NPS" ON public.nps_responses;

CREATE POLICY "Patients can insert own NPS"
ON public.nps_responses
FOR INSERT
WITH CHECK (
  patient_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.id = nps_responses.consultation_id
      AND a.patient_id = auth.uid()
      AND a.doctor_id = nps_responses.professional_id
  )
);
