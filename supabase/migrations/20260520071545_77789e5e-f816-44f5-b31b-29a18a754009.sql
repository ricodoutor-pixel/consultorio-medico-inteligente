
-- 1) CAPTION HASH + DEDUP
ALTER TABLE public.manus_social_queue
  ADD COLUMN IF NOT EXISTS caption_hash text;

CREATE OR REPLACE FUNCTION public.set_caption_hash()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.caption_hash := encode(digest(lower(btrim(COALESCE(NEW.caption, NEW.script, ''))), 'sha256'), 'hex');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_caption_hash ON public.manus_social_queue;
CREATE TRIGGER trg_set_caption_hash
BEFORE INSERT OR UPDATE OF caption, script ON public.manus_social_queue
FOR EACH ROW EXECUTE FUNCTION public.set_caption_hash();

UPDATE public.manus_social_queue
SET caption_hash = encode(digest(lower(btrim(COALESCE(caption, script, ''))), 'sha256'), 'hex')
WHERE caption_hash IS NULL;

-- Mark older duplicates as 'duplicate' so they don't break the unique index
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY platform, caption_hash ORDER BY
    CASE status WHEN 'posted' THEN 0 WHEN 'scheduled' THEN 1 WHEN 'approved' THEN 2 WHEN 'draft' THEN 3 ELSE 4 END,
    created_at ASC
  ) AS rn
  FROM public.manus_social_queue
  WHERE caption_hash IS NOT NULL
)
UPDATE public.manus_social_queue q
SET status = 'duplicate'
FROM ranked r
WHERE q.id = r.id AND r.rn > 1 AND q.status <> 'duplicate';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_manus_queue_platform_hash
  ON public.manus_social_queue (platform, caption_hash)
  WHERE status <> 'duplicate';

-- 2) IMAGE POOL
CREATE TABLE IF NOT EXISTS public.brisa_image_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL UNIQUE,
  prompt text NOT NULL,
  theme text,
  used_count int NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brisa_image_pool ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_manage_image_pool" ON public.brisa_image_pool;
CREATE POLICY "admin_manage_image_pool" ON public.brisa_image_pool
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_image_pool_usage ON public.brisa_image_pool (used_count ASC, last_used_at ASC NULLS FIRST);

-- 3) BTC VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.btc_payment_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  btc_address text NOT NULL,
  expected_amount_btc numeric(18,8) NOT NULL,
  tx_hash text,
  confirmations int NOT NULL DEFAULT 0,
  confirmed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.btc_payment_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_btc_ver" ON public.btc_payment_verifications;
CREATE POLICY "admin_select_btc_ver" ON public.btc_payment_verifications
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_btc_ver_status ON public.btc_payment_verifications (status, created_at DESC);

-- 4) search_path nas funções de fila de e-mail
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.proname='enqueue_email'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;
END $$;

-- 5) Revogar EXECUTE de todas SECURITY DEFINER do public; religar whitelist
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef = true
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, PUBLIC', r.sig);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

DO $$
DECLARE r record;
DECLARE fn_names text[] := ARRAY[
  'get_cron_health','calculate_doctor_performance','get_next_available_doctor',
  'has_role','get_active_contingency_pix','get_payment_status_summary',
  'ensure_referral_code','ensure_affiliate_wallet','increment_planta_coins'
];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef = true AND p.proname = ANY(fn_names)
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
  END LOOP;
END $$;

DO $$
DECLARE r record;
DECLARE fn_names text[] := ARRAY[
  'increment_site_counter','get_passport_by_token','get_ot_order_by_token','calculate_fuzzy_severity'
];
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef = true AND p.proname = ANY(fn_names)
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', r.sig);
  END LOOP;
END $$;
