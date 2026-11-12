DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('credit_health_card_wallet','debit_health_card_wallet','upsert_unified_contact','log_unified_message')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.force_free_plan_tier_on_doctor_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('anon', 'authenticated')
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.plan_tier := 'free';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_force_free_plan_tier ON public.doctors;
CREATE TRIGGER trg_force_free_plan_tier BEFORE INSERT ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.force_free_plan_tier_on_doctor_insert();