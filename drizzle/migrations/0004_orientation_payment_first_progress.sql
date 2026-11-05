ALTER TABLE public.orientacao_tecnica_orders ADD COLUMN IF NOT EXISTS triagem jsonb NOT NULL DEFAULT '{}'::jsonb, ADD COLUMN IF NOT EXISTS flow_status text NOT NULL DEFAULT 'aguardando_pagamento', ADD COLUMN IF NOT EXISTS paid_at timestamptz, ADD COLUMN IF NOT EXISTS triage_completed_at timestamptz;
COMMENT ON COLUMN public.orientacao_tecnica_orders.flow_status IS 'Payment-first progress; status remains the legacy payment ledger status for administrative compatibility.';
CREATE OR REPLACE FUNCTION public.validate_ot_order_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_phone text; v_recent int;
BEGIN
 IF NEW.patient_name IS NULL OR length(btrim(NEW.patient_name)) < 2 OR length(NEW.patient_name) > 120 THEN RAISE EXCEPTION 'Invalid patient_name: must be 2-120 characters'; END IF;
 NEW.patient_name := btrim(NEW.patient_name);
 v_phone := regexp_replace(COALESCE(NEW.patient_whatsapp,''), '\D', '', 'g');
 IF v_phone = '' THEN
   IF NEW.user_id IS NULL OR NEW.patient_email IS NULL THEN RAISE EXCEPTION 'Contact required'; END IF;
 ELSIF v_phone !~ '^\d{10,15}$' THEN RAISE EXCEPTION 'Invalid patient_whatsapp format'; END IF;
 NEW.patient_whatsapp := v_phone;
 IF NEW.patient_email IS NOT NULL AND length(NEW.patient_email) > 0 THEN
   IF length(NEW.patient_email) > 255 OR NEW.patient_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Invalid patient_email'; END IF;
 END IF;
 IF length(COALESCE(NEW.topic,'')) > 500 THEN RAISE EXCEPTION 'topic too long'; END IF;
 IF auth.uid() IS NULL THEN
   SELECT count(*) INTO v_recent FROM public.orientacao_tecnica_orders WHERE ((v_phone <> '' AND patient_whatsapp=v_phone) OR (NEW.user_id IS NOT NULL AND user_id=NEW.user_id)) AND created_at>now()-interval '10 minutes';
   IF v_recent >= 3 THEN RAISE EXCEPTION 'Rate limit exceeded. Try again later.'; END IF;
 END IF;
 RETURN NEW;
END; $$;