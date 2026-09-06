
-- 1. Ratings table (1-5 stars)
CREATE TABLE IF NOT EXISTS public.consultation_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  amount numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cratings_pro ON public.consultation_ratings(professional_id);
CREATE INDEX IF NOT EXISTS idx_cratings_consult ON public.consultation_ratings(consultation_id);

ALTER TABLE public.consultation_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patients insert own rating"
  ON public.consultation_ratings FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "view own rating"
  ON public.consultation_ratings FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR professional_id = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE POLICY "admin manage ratings"
  ON public.consultation_ratings FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- 2. Credit audit table
CREATE TABLE IF NOT EXISTS public.consultation_credit_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  rating_id uuid REFERENCES public.consultation_ratings(id) ON DELETE CASCADE,
  stars integer NOT NULL,
  amount numeric(10,2),
  status text NOT NULL CHECK (status IN ('released','under_review','rejected')),
  reason text,
  audit_phone text DEFAULT '5511987131241',
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_audit_status ON public.consultation_credit_audit(status);
CREATE INDEX IF NOT EXISTS idx_credit_audit_pro ON public.consultation_credit_audit(professional_id);

ALTER TABLE public.consultation_credit_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage audit"
  ON public.consultation_credit_audit FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE POLICY "professional view own audit"
  ON public.consultation_credit_audit FOR SELECT TO authenticated
  USING (professional_id = auth.uid());

-- 3. Trigger function: release credit + alert Brisa
CREATE OR REPLACE FUNCTION public.handle_consultation_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_reason text;
BEGIN
  IF NEW.stars >= 5 THEN
    v_status := 'released';
    v_reason := 'Avaliação 5★ — crédito liberado automaticamente pela Enfª Brisa';
  ELSE
    v_status := 'under_review';
    v_reason := format('Avaliação %s★ inferior a 5★ — encaminhado para auditoria do Dr. Edilson (1241)', NEW.stars);
  END IF;

  INSERT INTO public.consultation_credit_audit
    (consultation_id, professional_id, patient_id, rating_id, stars, amount, status, reason)
  VALUES
    (NEW.consultation_id, NEW.professional_id, NEW.patient_id, NEW.id, NEW.stars, NEW.amount, v_status, v_reason);

  -- Alert for Brisa if under review (insert nps_alerts row to reuse existing alert UI)
  IF v_status = 'under_review' THEN
    INSERT INTO public.nps_alerts (response_id, professional_id, alert_type, severity, message, status)
    VALUES (
      NEW.id,
      NEW.professional_id,
      'low_rating_credit_hold',
      CASE WHEN NEW.stars <= 2 THEN 'high' ELSE 'medium' END,
      format('Consulta %s recebeu %s★. Paciente %s. Crédito retido para auditoria. Revisar em /admin/credit-audit/%s',
        NEW.consultation_id, NEW.stars, NEW.patient_id, NEW.id),
      'active'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_release_doctor_credit ON public.consultation_ratings;
CREATE TRIGGER trg_release_doctor_credit
AFTER INSERT ON public.consultation_ratings
FOR EACH ROW EXECUTE FUNCTION public.handle_consultation_rating();
