ALTER TABLE public.vendor_products
  ADD COLUMN IF NOT EXISTS endorsed_by_doctor BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_vendor_products_endorsed
  ON public.vendor_products (endorsed_by_doctor)
  WHERE endorsed_by_doctor = true;

-- Restrict toggling of endorsement to admins only
CREATE OR REPLACE FUNCTION public.block_vendor_product_endorsement_tamper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.endorsed_by_doctor := false;
    RETURN NEW;
  END IF;

  IF NEW.endorsed_by_doctor IS DISTINCT FROM OLD.endorsed_by_doctor THEN
    RAISE EXCEPTION 'Not allowed to modify endorsed_by_doctor (admin only)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_vp_endorsement_tamper ON public.vendor_products;
CREATE TRIGGER trg_block_vp_endorsement_tamper
  BEFORE INSERT OR UPDATE ON public.vendor_products
  FOR EACH ROW
  EXECUTE FUNCTION public.block_vendor_product_endorsement_tamper();