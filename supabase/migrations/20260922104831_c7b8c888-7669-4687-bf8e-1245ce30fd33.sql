
-- 1) Convites expiram em 60s (antes 45s) e ganham controle de tentativa
ALTER TABLE public.consultation_offers
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '60 seconds');

ALTER TABLE public.consultation_offers
  ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_token text;

CREATE INDEX IF NOT EXISTS idx_consultation_offers_pending
  ON public.consultation_offers (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_consultation_offers_appointment
  ON public.consultation_offers (appointment_id);

-- 2) Pool ordenado de profissionais aptos (KYC 100% verde primeiro, online primeiro)
CREATE OR REPLACE FUNCTION public.consultation_doctor_pool(_specialty text DEFAULT NULL)
RETURNS TABLE(
  doctor_id uuid,
  user_id uuid,
  full_name text,
  phone text,
  crm text,
  crm_state text,
  specialty text,
  is_online boolean,
  kyc_green boolean,
  approved_docs integer,
  score integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH req AS (
    SELECT unnest(ARRAY['crm_front','crm_back','id_front','cpf_doc','address_proof']) AS kind
  ), pool AS (
    SELECT
      d.id,
      d.user_id,
      p.full_name,
      p.phone,
      d.crm,
      d.crm_state,
      d.specialty,
      COALESCE(d.is_online, false) AS is_online,
      COALESCE(d.total_consultations, 0) AS total_consultations,
      (
        SELECT count(*) FROM public.doctor_kyc_documents k
        WHERE k.doctor_user_id = d.user_id
          AND k.verification_status = 'approved'
          AND k.document_kind IN (SELECT kind FROM req)
      )::int AS approved_docs
    FROM public.doctors d
    JOIN public.profiles p ON p.id = d.user_id
    WHERE COALESCE(d.approval_status, 'pending') = 'approved'
      AND d.is_verified = true
      AND d.suspended_at IS NULL
  ), scored AS (
    SELECT
      pool.*,
      (pool.approved_docs >= 5) AS kyc_green,
      (
        CASE WHEN pool.approved_docs >= 5 THEN 100 ELSE pool.approved_docs * 5 END
        + CASE WHEN pool.is_online THEN 40 ELSE 0 END
        + CASE WHEN pool.phone IS NOT NULL THEN 5 ELSE 0 END
      )::int AS score
    FROM pool
  ), matched AS (
    SELECT * FROM scored
    WHERE _specialty IS NULL OR specialty ILIKE '%' || _specialty || '%'
  )
  SELECT id, user_id, full_name, phone, crm, crm_state, specialty,
         is_online, kyc_green, approved_docs, score
  FROM (
    SELECT * FROM matched
    UNION ALL
    SELECT * FROM scored WHERE NOT EXISTS (SELECT 1 FROM matched)
  ) f
  ORDER BY score DESC, total_consultations ASC, full_name ASC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.consultation_doctor_pool(text) FROM public;
GRANT EXECUTE ON FUNCTION public.consultation_doctor_pool(text) TO service_role;

-- 3) Médico vê e responde apenas os convites dele
DROP POLICY IF EXISTS "Doctors read own offers" ON public.consultation_offers;
CREATE POLICY "Doctors read own offers"
ON public.consultation_offers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = consultation_offers.doctor_id AND d.user_id = auth.uid()
  )
);
