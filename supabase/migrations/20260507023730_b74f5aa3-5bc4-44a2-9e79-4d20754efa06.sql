
ALTER PUBLICATION supabase_realtime DROP TABLE public.appointments;
ALTER PUBLICATION supabase_realtime DROP TABLE public.appointment_alerts;

CREATE OR REPLACE FUNCTION public.validate_leads_contatos()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  cleaned_phone text;
  allowed_origens text[] := ARRAY['chat','whatsapp','instagram','web','landing','manychat','cron','n8n','import'];
  tag text;
  recent_count int;
BEGIN
  IF NEW.nome IS NULL OR length(btrim(NEW.nome)) < 2 OR length(NEW.nome) > 120 THEN
    RAISE EXCEPTION 'Invalid nome: must be 2-120 characters';
  END IF;
  NEW.nome := btrim(NEW.nome);

  IF NEW.telefone IS NULL THEN
    RAISE EXCEPTION 'telefone is required';
  END IF;
  cleaned_phone := regexp_replace(NEW.telefone, '\D', '', 'g');
  IF cleaned_phone !~ '^\d{10,15}$' THEN
    RAISE EXCEPTION 'Invalid telefone format';
  END IF;
  NEW.telefone := cleaned_phone;

  IF NEW.origem IS NULL OR NOT (NEW.origem = ANY(allowed_origens)) THEN
    RAISE EXCEPTION 'Invalid origem: %', NEW.origem;
  END IF;

  IF NEW.tags IS NOT NULL THEN
    IF array_length(NEW.tags, 1) > 30 THEN
      RAISE EXCEPTION 'Too many tags (max 30)';
    END IF;
    FOREACH tag IN ARRAY NEW.tags LOOP
      IF length(tag) > 40 THEN
        RAISE EXCEPTION 'Tag too long (max 40 chars)';
      END IF;
    END LOOP;

    IF auth.uid() IS NULL AND array_length(NEW.tags, 1) > 5 THEN
      RAISE EXCEPTION 'Anonymous submissions limited to 5 tags';
    END IF;
  END IF;

  IF auth.uid() IS NULL THEN
    SELECT count(*) INTO recent_count
    FROM public.leads_contatos
    WHERE telefone = NEW.telefone
      AND created_at > now() - interval '10 minutes';
    IF recent_count >= 3 THEN
      RAISE EXCEPTION 'Rate limit exceeded for this phone number. Try again later.';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
