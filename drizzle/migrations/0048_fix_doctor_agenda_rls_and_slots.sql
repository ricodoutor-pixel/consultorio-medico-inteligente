-- ============================================================================
-- Correção da agenda individual (0047), encontrada na auditoria de 13/11/2026:
-- 1) Segurança: as políticas "médicos gerenciam a própria agenda" aceitavam QUALQUER médico logado
--    (a condição "d.user_id = auth.uid()" dentro do OR sempre valia para o próprio médico), permitindo
--    alterar ou apagar a agenda de colegas. Agora a linha precisa ser do próprio médico.
-- 2) get_available_slots falhava em toda chamada ("operator does not exist: uuid = text") ao comparar
--    appointments.doctor_id / doctor_availability.doctor_id (UUID) com o texto recebido.
-- 3) Fuso: a antecedência mínima usava o horário de Brasília interpretado como UTC (3 h de diferença),
--    podendo oferecer horários já passados. Agora usa now() real + antecedência.
-- ============================================================================

-- 1. Políticas de escrita restritas ao dono da agenda (ou administrador)
DROP POLICY IF EXISTS "Medicos gerenciam suas proprias regras de disponibilidade" ON public.doctor_availability_rules;
CREATE POLICY "Medicos gerenciam suas proprias regras de disponibilidade"
  ON public.doctor_availability_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_availability_rules.doctor_id OR d.user_id::text = doctor_availability_rules.doctor_id)
        AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_availability_rules.doctor_id OR d.user_id::text = doctor_availability_rules.doctor_id)
        AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Medicos gerenciam suas proprias excecoes" ON public.doctor_availability_exceptions;
CREATE POLICY "Medicos gerenciam suas proprias excecoes"
  ON public.doctor_availability_exceptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_availability_exceptions.doctor_id OR d.user_id::text = doctor_availability_exceptions.doctor_id)
        AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_availability_exceptions.doctor_id OR d.user_id::text = doctor_availability_exceptions.doctor_id)
        AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS "Medicos gerenciam suas configuracoes de agendamento" ON public.doctor_scheduling_settings;
CREATE POLICY "Medicos gerenciam suas configuracoes de agendamento"
  ON public.doctor_scheduling_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_scheduling_settings.doctor_id OR d.user_id::text = doctor_scheduling_settings.doctor_id)
        AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_scheduling_settings.doctor_id OR d.user_id::text = doctor_scheduling_settings.doctor_id)
        AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- 2 e 3. Horários livres: comparação por texto e antecedência calculada no instante real
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_doctor_id TEXT,
  p_date DATE,
  p_modality TEXT DEFAULT 'video'
)
RETURNS TABLE (
  time_slot TEXT,
  slot_datetime TIMESTAMPTZ,
  is_available BOOLEAN,
  shift TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_day_of_week INT;
  v_min_advance_hours INT := 2;
  v_max_advance_days INT := 30;
  v_today_sp DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_min_booking_time TIMESTAMPTZ;
  v_has_day_off BOOLEAN := false;
  v_real_doctor_id TEXT := NULL;
BEGIN
  -- Aceita o id do médico ou o user_id; regras podem estar gravadas com qualquer um dos dois
  SELECT d.id::text INTO v_real_doctor_id
  FROM public.doctors d
  WHERE d.id::text = p_doctor_id OR d.user_id::text = p_doctor_id
  LIMIT 1;
  IF v_real_doctor_id IS NULL THEN
    v_real_doctor_id := p_doctor_id;
  END IF;

  SELECT COALESCE(s.min_advance_hours, 2), COALESCE(s.max_advance_days, 30)
  INTO v_min_advance_hours, v_max_advance_days
  FROM public.doctor_scheduling_settings s
  WHERE s.doctor_id IN (v_real_doctor_id, p_doctor_id)
  LIMIT 1;
  v_min_advance_hours := COALESCE(v_min_advance_hours, 2);
  v_max_advance_days := COALESCE(v_max_advance_days, 30);

  v_min_booking_time := now() + make_interval(hours => v_min_advance_hours);

  IF p_date < v_today_sp OR p_date > v_today_sp + v_max_advance_days THEN
    RETURN;
  END IF;

  SELECT true INTO v_has_day_off
  FROM public.doctor_availability_exceptions e
  WHERE e.doctor_id IN (v_real_doctor_id, p_doctor_id)
    AND e.exception_date = p_date
    AND e.exception_type = 'day_off'
  LIMIT 1;
  IF v_has_day_off THEN
    RETURN;
  END IF;

  v_day_of_week := EXTRACT(DOW FROM p_date)::int;

  RETURN QUERY
  WITH generated_slots AS (
    SELECT
      to_char(s.slot_time, 'HH24:MI') AS slot_str,
      (p_date + s.slot_time) AT TIME ZONE 'America/Sao_Paulo' AS slot_dt
    FROM public.doctor_availability_rules r,
    LATERAL (
      SELECT (r.start_time + (n * (r.slot_duration_minutes + r.break_between_slots_minutes) || ' minutes')::interval)::time AS slot_time
      FROM generate_series(0, 48) AS n
      WHERE (r.start_time + (n * (r.slot_duration_minutes + r.break_between_slots_minutes) || ' minutes')::interval + (r.slot_duration_minutes || ' minutes')::interval)::time <= r.end_time
    ) s
    WHERE r.doctor_id IN (v_real_doctor_id, p_doctor_id)
      AND r.day_of_week = v_day_of_week
      AND r.is_active = true
      AND (p_modality IS NULL OR p_modality = ANY(r.modalities))

    UNION

    SELECT
      to_char(s.slot_time, 'HH24:MI') AS slot_str,
      (p_date + s.slot_time) AT TIME ZONE 'America/Sao_Paulo' AS slot_dt
    FROM public.doctor_availability_exceptions ex,
    LATERAL (
      SELECT (ex.start_time + (n * 30 || ' minutes')::interval)::time AS slot_time
      FROM generate_series(0, 48) AS n
      WHERE (ex.start_time + (n * 30 || ' minutes')::interval + interval '30 minutes')::time <= ex.end_time
    ) s
    WHERE ex.doctor_id IN (v_real_doctor_id, p_doctor_id)
      AND ex.exception_date = p_date
      AND ex.exception_type = 'extra_slot'
  ),
  distinct_slots AS (
    SELECT DISTINCT g.slot_str, g.slot_dt FROM generated_slots g
  )
  SELECT
    ds.slot_str AS time_slot,
    ds.slot_dt AS slot_datetime,
    true AS is_available,
    CASE
      WHEN ds.slot_str < '12:00' THEN 'manha'
      WHEN ds.slot_str < '18:00' THEN 'tarde'
      ELSE 'noite'
    END AS shift
  FROM distinct_slots ds
  WHERE ds.slot_dt >= v_min_booking_time
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.doctor_id::text = v_real_doctor_id
        AND a.scheduled_at = ds.slot_dt
        AND a.status NOT IN ('cancelled', 'rejected')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.doctor_availability da
      WHERE da.doctor_id::text = v_real_doctor_id
        AND da.slot_date = p_date
        AND da.time_slot = ds.slot_str
        AND (
          da.status = 'booked'
          OR (da.status = 'reserved' AND da.reserved_until > now())
        )
    )
  ORDER BY ds.slot_str ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_slots(TEXT, DATE, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_available_days(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
