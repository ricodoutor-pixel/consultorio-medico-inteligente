CREATE OR REPLACE FUNCTION public.prevent_vendor_balance_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role / superuser (no auth.uid()) and admins to change financial fields
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.balance IS DISTINCT FROM OLD.balance
     OR NEW.total_sales IS DISTINCT FROM OLD.total_sales
     OR NEW.rating IS DISTINCT FROM OLD.rating THEN
    RAISE EXCEPTION 'Not allowed to modify vendor financial fields directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_vendor_balance_tampering_trg ON public.vendors;
CREATE TRIGGER prevent_vendor_balance_tampering_trg
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.prevent_vendor_balance_tampering();