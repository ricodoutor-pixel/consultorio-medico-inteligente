-- 1) Rotina de escolha do profissional de plantão pelo cadastro mais completo
CREATE OR REPLACE FUNCTION public.route_consultation_doctor(_specialty text DEFAULT NULL)
RETURNS TABLE(
  doctor_id uuid,
  user_id uuid,
  full_name text,
  crm text,
  crm_state text,
  specialty text,
  readiness_score integer,
  docs_count integer,
  is_online boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH pool AS (
    SELECT
      d.id,
      d.user_id,
      p.full_name,
      d.crm,
      d.crm_state,
      d.specialty,
      d.is_online,
      d.total_consultations,
      (SELECT count(*) FROM public.doctor_kyc_documents k WHERE k.doctor_user_id = d.user_id)::int AS docs,
      (
        (SELECT count(*) FROM public.doctor_kyc_documents k WHERE k.doctor_user_id = d.user_id)::int
        + CASE WHEN d.signature_url IS NOT NULL THEN 5 ELSE 0 END
        + CASE WHEN p.pix_key IS NOT NULL THEN 3 ELSE 0 END
        + CASE WHEN d.is_verified THEN 2 ELSE 0 END
        + CASE WHEN d.kyc_status = 'verified' THEN 2 ELSE 0 END
        + CASE WHEN d.mp_collector_id IS NOT NULL THEN 2 ELSE 0 END
        + CASE WHEN p.phone IS NOT NULL THEN 1 ELSE 0 END
        + CASE WHEN d.is_available THEN 1 ELSE 0 END
        + CASE WHEN d.is_online THEN 1 ELSE 0 END
      )::int AS score
    FROM public.doctors d
    JOIN public.profiles p ON p.id = d.user_id
    WHERE COALESCE(d.approval_status, 'pending') = 'approved'
      AND d.is_verified = true
      AND d.suspended_at IS NULL
  ), matched AS (
    SELECT * FROM pool
    WHERE _specialty IS NULL
       OR specialty ILIKE '%' || _specialty || '%'
  )
  SELECT id, user_id, full_name, crm, crm_state, specialty, score, docs, is_online
  FROM (
    SELECT * FROM matched
    UNION ALL
    SELECT * FROM pool WHERE NOT EXISTS (SELECT 1 FROM matched)
  ) final
  ORDER BY score DESC, COALESCE(total_consultations, 0) ASC, full_name ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.route_consultation_doctor(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.route_consultation_doctor(text) TO authenticated, anon, service_role;

-- 2) Abertura automática de horários de atendimento
CREATE OR REPLACE FUNCTION public.ensure_doctor_availability(_doctor_id uuid, _days integer DEFAULT 45)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted integer := 0;
BEGIN
  INSERT INTO public.doctor_availability (doctor_id, slot_date, time_slot, status)
  SELECT _doctor_id, d::date, to_char(t, 'HH24:MI'), 'available'
  FROM generate_series(current_date, current_date + (_days || ' days')::interval, '1 day') AS d
  CROSS JOIN generate_series(
    timestamp '2000-01-01 09:00',
    timestamp '2000-01-01 17:30',
    interval '30 minutes'
  ) AS t
  WHERE extract(isodow FROM d) BETWEEN 1 AND 6
    AND NOT EXISTS (
      SELECT 1 FROM public.doctor_availability a
      WHERE a.doctor_id = _doctor_id
        AND a.slot_date = d::date
        AND a.time_slot = to_char(t, 'HH24:MI')
    );
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_doctor_availability(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_doctor_availability(uuid, integer) TO service_role;

-- 3) Rotina diária que mantém a agenda do profissional de plantão sempre aberta
CREATE OR REPLACE FUNCTION public.refresh_routing_doctor_availability()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
  created integer := 0;
BEGIN
  SELECT doctor_id INTO target FROM public.route_consultation_doctor(NULL);
  IF target IS NULL THEN
    RETURN 0;
  END IF;
  created := public.ensure_doctor_availability(target, 45);
  RETURN created;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_routing_doctor_availability() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_routing_doctor_availability() TO service_role;

-- 4) Parâmetros de atendimento do Dr. Daniel Kobayashi Colombo (plantão atual)
UPDATE public.doctors
SET is_online = true,
    is_available = true,
    kyc_status = 'verified',
    approval_status = 'approved',
    is_verified = true,
    consultation_price = COALESCE(consultation_price, 180),
    price_video_chat = COALESCE(price_video_chat, 180),
    price_chat_only = COALESCE(price_chat_only, 100),
    price_return = COALESCE(price_return, 90),
    last_seen_online = now(),
    updated_at = now()
WHERE id = '31613ce7-6116-4eee-9d58-3c699282b670';

-- 5) Abre a agenda imediatamente e agenda a manutenção diária
SELECT public.refresh_routing_doctor_availability();

SELECT cron.schedule(
  'routing-doctor-availability-daily',
  '10 4 * * *',
  $cron$SELECT public.refresh_routing_doctor_availability();$cron$
);