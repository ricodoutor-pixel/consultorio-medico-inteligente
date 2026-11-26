DROP POLICY IF EXISTS "Users create own orders" ON public.orders;

CREATE OR REPLACE FUNCTION public.guard_vendor_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.is_active := false;
    NEW.balance := 0;
    NEW.total_sales := 0;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_vendor_insert() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_vendor_insert_trg ON public.vendors;
CREATE TRIGGER guard_vendor_insert_trg BEFORE INSERT ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.guard_vendor_insert();