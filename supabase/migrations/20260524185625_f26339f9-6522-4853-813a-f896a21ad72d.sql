
-- 1) doctor_availability: prevent non-admin from changing immutable columns
CREATE OR REPLACE FUNCTION public.lock_doctor_availability_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  -- Doctor owners can update freely
  IF EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = OLD.doctor_id AND d.user_id = auth.uid()) THEN
    RETURN NEW;
  END IF;
  -- Patients reserving: only status, reserved_by, reserved_until may change
  IF NEW.doctor_id IS DISTINCT FROM OLD.doctor_id
     OR NEW.slot_date IS DISTINCT FROM OLD.slot_date
     OR NEW.time_slot IS DISTINCT FROM OLD.time_slot THEN
    RAISE EXCEPTION 'Not allowed to modify slot identity fields';
  END IF;
  IF NEW.status NOT IN ('reserved','available') THEN
    RAISE EXCEPTION 'Invalid status transition for patient reservation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_doctor_availability_columns ON public.doctor_availability;
CREATE TRIGGER trg_lock_doctor_availability_columns
BEFORE UPDATE ON public.doctor_availability
FOR EACH ROW EXECUTE FUNCTION public.lock_doctor_availability_columns();

-- 2) pacientes_leads: tighten INSERT WITH CHECK (trigger still runs for deep validation)
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.pacientes_leads;
CREATE POLICY "Anyone can insert validated pacientes_leads"
ON public.pacientes_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(nome)) BETWEEN 2 AND 120
  AND length(regexp_replace(coalesce(whatsapp,''), '\D', '', 'g')) BETWEEN 10 AND 15
  AND (sintoma IS NULL OR length(sintoma) <= 500)
  AND (intensidade IS NULL OR (intensidade >= 0 AND intensidade <= 10))
  AND (clinical_score IS NULL OR (clinical_score >= 0 AND clinical_score <= 100))
  AND (email IS NULL OR length(email) <= 255)
);

-- 3) saude_verde_partner_requests: tighten INSERT WITH CHECK
DROP POLICY IF EXISTS public_insert_sv_partner_requests ON public.saude_verde_partner_requests;
CREATE POLICY public_insert_sv_partner_requests
ON public.saude_verde_partner_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(company_name)) BETWEEN 2 AND 200
  AND length(btrim(contact_name)) BETWEEN 2 AND 120
  AND contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(contact_email) <= 255
  AND length(regexp_replace(coalesce(contact_phone,''), '\D', '', 'g')) BETWEEN 10 AND 15
  AND (cnpj IS NULL OR length(regexp_replace(cnpj, '\D', '', 'g')) = 14)
  AND (category IS NULL OR length(category) <= 80)
);
