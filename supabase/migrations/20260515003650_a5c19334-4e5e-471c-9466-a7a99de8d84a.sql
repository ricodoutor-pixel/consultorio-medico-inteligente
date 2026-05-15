CREATE OR REPLACE FUNCTION public.block_doctor_sensitive_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role (no auth.uid()) and admins
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.plan_tier IS DISTINCT FROM OLD.plan_tier
     OR NEW.kyc_status IS DISTINCT FROM OLD.kyc_status
     OR NEW.fraud_score IS DISTINCT FROM OLD.fraud_score
     OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
     OR NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.crm IS DISTINCT FROM OLD.crm
     OR NEW.crm_state IS DISTINCT FROM OLD.crm_state THEN
    RAISE EXCEPTION 'Not allowed to modify privileged doctor fields (plan_tier, kyc_status, fraud_score, suspension, verification, CRM)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_doctor_sensitive_fields ON public.doctors;
CREATE TRIGGER protect_doctor_sensitive_fields
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW
  EXECUTE FUNCTION public.block_doctor_sensitive_update();