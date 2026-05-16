
-- 1) Function to generate / fetch short referral code per user
CREATE OR REPLACE FUNCTION public.ensure_referral_code(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_try int := 0;
BEGIN
  SELECT code INTO v_code FROM public.referral_links WHERE user_id = _user_id LIMIT 1;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    v_try := v_try + 1;
    v_code := upper(substring(replace(encode(gen_random_bytes(6),'base64'),'/',''),1,6));
    BEGIN
      INSERT INTO public.referral_links (user_id, code) VALUES (_user_id, v_code);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      IF v_try > 5 THEN
        RAISE EXCEPTION 'Could not generate unique referral code';
      END IF;
    END;
  END LOOP;
END;
$$;

-- 2) Ebook funnel tracking table
CREATE TABLE IF NOT EXISTS public.ebook_funnel_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp text NOT NULL,
  name text,
  email text,
  profession text,
  ebook_slug text NOT NULL DEFAULT 'cannabis-medicinal-2026',
  source text DEFAULT 'landing',
  pdf_sent_at timestamptz,
  followup_sent_at timestamptz,
  converted_at timestamptz,
  conversion_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ebook_funnel_log_whatsapp ON public.ebook_funnel_log(whatsapp);
CREATE INDEX IF NOT EXISTS idx_ebook_funnel_log_followup ON public.ebook_funnel_log(created_at) WHERE followup_sent_at IS NULL;

ALTER TABLE public.ebook_funnel_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view ebook funnel" ON public.ebook_funnel_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service inserts ebook funnel" ON public.ebook_funnel_log
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TRIGGER ebook_funnel_log_updated
BEFORE UPDATE ON public.ebook_funnel_log
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
