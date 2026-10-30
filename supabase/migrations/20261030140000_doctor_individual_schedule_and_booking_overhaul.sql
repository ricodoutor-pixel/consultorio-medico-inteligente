-- ============================================================================
-- Migração: Sistema de Agenda Individualizada por Médico, Regras Semanais e RPCs de Agendamento
-- Planta y Raíz Ltda — Lovable Cloud Oficial (shmbwdjuddvquszwkvuq)
-- ============================================================================

-- 1. Tabela de regras semanais de atendimento por médico
CREATE TABLE IF NOT EXISTS public.doctor_availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 1=Segunda, 2=Terça, ..., 6=Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT NOT NULL DEFAULT 30,
  break_between_slots_minutes INT NOT NULL DEFAULT 0,
  modalities TEXT[] NOT NULL DEFAULT ARRAY['video', 'chat']::text[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_time_order CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_doc_avail_rules_doc_day ON public.doctor_availability_rules(doctor_id, day_of_week, is_active);

-- 2. Tabela de exceções de agenda (Folgas, Férias ou Horários Extras)
CREATE TABLE IF NOT EXISTS public.doctor_availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id TEXT NOT NULL,
  exception_date DATE NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('day_off', 'extra_slot')),
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_avail_exceptions_doc_date ON public.doctor_availability_exceptions(doctor_id, exception_date);

-- 3. Configurações individuais de agendamento por médico
CREATE TABLE IF NOT EXISTS public.doctor_scheduling_settings (
  doctor_id TEXT PRIMARY KEY,
  min_advance_hours INT NOT NULL DEFAULT 2,
  max_advance_days INT NOT NULL DEFAULT 30,
  daily_consultation_limit INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Constraint / Índice único parcial contra double-booking em appointments
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_booking 
  ON public.appointments (doctor_id, scheduled_at) 
  WHERE status NOT IN ('cancelled', 'rejected');

-- 5. RLS Policies
ALTER TABLE public.doctor_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_scheduling_settings ENABLE ROW LEVEL SECURITY;

-- Leitura pública de regras e exceções para cálculo de slots
CREATE POLICY "Leitura publica de regras de disponibilidade"
  ON public.doctor_availability_rules FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Leitura publica de excecoes de disponibilidade"
  ON public.doctor_availability_exceptions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Leitura publica de configuracoes de agendamento"
  ON public.doctor_scheduling_settings FOR SELECT
  TO public
  USING (true);

-- Médicos autenticados gerenciam a própria agenda
CREATE POLICY "Medicos gerenciam suas proprias regras de disponibilidade"
  ON public.doctor_availability_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_id OR d.user_id = auth.uid())
      AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_id OR d.user_id = auth.uid())
      AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Medicos gerenciam suas proprias excecoes"
  ON public.doctor_availability_exceptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_id OR d.user_id = auth.uid())
      AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_id OR d.user_id = auth.uid())
      AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Medicos gerenciam suas configuracoes de agendamento"
  ON public.doctor_scheduling_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_id OR d.user_id = auth.uid())
      AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE (d.id::text = doctor_id OR d.user_id = auth.uid())
      AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Service role tem acesso irrestrito
CREATE POLICY "Service role tem acesso total a rules"
  ON public.doctor_availability_rules FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role tem acesso total a exceptions"
  ON public.doctor_availability_exceptions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role tem acesso total a settings"
  ON public.doctor_scheduling_settings FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 6. Função RPC: get_available_slots
-- Retorna apenas os horários realmente livres para um médico em uma data e modalidade
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
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_day_of_week INT;
  v_min_advance_hours INT := 2;
  v_max_advance_days INT := 30;
  v_now_sp TIMESTAMPTZ;
  v_min_booking_time TIMESTAMPTZ;
  v_has_day_off BOOLEAN := false;
  v_real_doctor_id TEXT := p_doctor_id;
BEGIN
  -- Resolve docId caso seja slug ou UUID
  SELECT d.id::text INTO v_real_doctor_id
  FROM public.doctors d
  WHERE d.id::text = p_doctor_id OR d.user_id::text = p_doctor_id
  LIMIT 1;

  IF v_real_doctor_id IS NULL THEN
    v_real_doctor_id := p_doctor_id;
  END IF;

  -- Obter fuso de Brasília (America/Sao_Paulo)
  v_now_sp := now() AT TIME ZONE 'America/Sao_Paulo';
  
  -- Ler configurações de antecedência
  SELECT COALESCE(s.min_advance_hours, 2), COALESCE(s.max_advance_days, 30)
  INTO v_min_advance_hours, v_max_advance_days
  FROM public.doctor_scheduling_settings s
  WHERE s.doctor_id = v_real_doctor_id;

  v_min_booking_time := v_now_sp + (v_min_advance_hours || ' hours')::interval;

  -- Se data fora da janela permitida, retorna vazio
  IF p_date < (v_now_sp::date) OR p_date > (v_now_sp::date + v_max_advance_days) THEN
    RETURN;
  END IF;

  -- Verificar se há exceção de Folga (day_off)
  SELECT true INTO v_has_day_off
  FROM public.doctor_availability_exceptions e
  WHERE e.doctor_id = v_real_doctor_id
    AND e.exception_date = p_date
    AND e.exception_type = 'day_off'
  LIMIT 1;

  IF v_has_day_off THEN
    RETURN;
  END IF;

  v_day_of_week := EXTRACT(DOW FROM p_date)::int;

  -- Gera slots a partir das regras semanais ativas
  RETURN QUERY
  WITH generated_slots AS (
    -- Slots normais da regra semanal
    SELECT 
      to_char(slot_time, 'HH24:MI') AS slot_str,
      (p_date + slot_time) AT TIME ZONE 'America/Sao_Paulo' AS slot_dt
    FROM public.doctor_availability_rules r,
    LATERAL (
      SELECT (r.start_time + (n * (r.slot_duration_minutes + r.break_between_slots_minutes) || ' minutes')::interval)::time AS slot_time
      FROM generate_series(0, 48) AS n
      WHERE (r.start_time + (n * (r.slot_duration_minutes + r.break_between_slots_minutes) || ' minutes')::interval + (r.slot_duration_minutes || ' minutes')::interval)::time <= r.end_time
    ) s
    WHERE r.doctor_id = v_real_doctor_id
      AND r.day_of_week = v_day_of_week
      AND r.is_active = true
      AND (p_modality IS NULL OR p_modality = ANY(r.modalities))

    UNION

    -- Slots de exceção do tipo extra_slot
    SELECT 
      to_char(slot_time, 'HH24:MI') AS slot_str,
      (p_date + slot_time) AT TIME ZONE 'America/Sao_Paulo' AS slot_dt
    FROM public.doctor_availability_exceptions ex,
    LATERAL (
      SELECT (ex.start_time + (n * 30 || ' minutes')::interval)::time AS slot_time
      FROM generate_series(0, 48) AS n
      WHERE (ex.start_time + (n * 30 || ' minutes')::interval + interval '30 minutes')::time <= ex.end_time
    ) s
    WHERE ex.doctor_id = v_real_doctor_id
      AND ex.exception_date = p_date
      AND ex.exception_type = 'extra_slot'
  ),
  distinct_slots AS (
    SELECT DISTINCT slot_str, slot_dt FROM generated_slots
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
  WHERE 
    -- 1. Antecedência mínima e horário passado
    ds.slot_dt >= v_min_booking_time
    -- 2. Não possui agendamento confirmado/pendente
    AND NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.doctor_id = v_real_doctor_id
        AND a.scheduled_at = ds.slot_dt
        AND a.status NOT IN ('cancelled', 'rejected')
    )
    -- 3. Não possui hold/reserva temporária ativa em doctor_availability
    AND NOT EXISTS (
      SELECT 1 FROM public.doctor_availability da
      WHERE da.doctor_id = v_real_doctor_id
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


-- 7. Função RPC: get_available_days
-- Retorna quais dias de um determinado mês possuem pelo menos 1 horário livre
CREATE OR REPLACE FUNCTION public.get_available_days(
  p_doctor_id TEXT,
  p_month TEXT, -- formato YYYY-MM
  p_modality TEXT DEFAULT 'video'
)
RETURNS TABLE (
  day_date DATE,
  has_available_slots BOOLEAN,
  slots_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_first_day DATE;
  v_last_day DATE;
  v_curr_date DATE;
  v_slots_count INT;
BEGIN
  v_first_day := to_date(p_month || '-01', 'YYYY-MM-DD');
  v_last_day := (v_first_day + interval '1 month - 1 day')::date;
  
  v_curr_date := v_first_day;
  WHILE v_curr_date <= v_last_day LOOP
    SELECT COUNT(*)::int INTO v_slots_count
    FROM public.get_available_slots(p_doctor_id, v_curr_date, p_modality);

    IF v_slots_count > 0 THEN
      day_date := v_curr_date;
      has_available_slots := true;
      slots_count := v_slots_count;
      RETURN NEXT;
    END IF;

    v_curr_date := v_curr_date + 1;
  END LOOP;
END;
$$;


-- 8. Carga inicial: Regras de Atendimento do Dr. Anderson Mikalauskas
-- Tarde: Seg a Sex 13:00 às 14:00 (slots 13:00 e 13:30)
-- Noite Seg: 19:00 às 20:00 (slots 19:00 e 19:30)
-- Noite Ter e Qui: 20:30 às 22:00 (slots 20:30, 21:00 e 21:30)
-- Manhã: Zero slots

DO $$
DECLARE
  v_anderson_id TEXT := 'f803c35d-31dd-48b6-a7e8-282036ccb389';
  v_slug_id TEXT := 'med-anderson-mikalauskas';
  v_target_id TEXT;
  d INT;
BEGIN
  -- Identifica se o Dr Anderson existe por UUID ou slug
  SELECT id::text INTO v_target_id FROM public.doctors WHERE id::text = v_anderson_id OR id::text = v_slug_id LIMIT 1;
  IF v_target_id IS NULL THEN
    v_target_id := v_anderson_id;
  END IF;

  -- Remove regras antigas caso existam
  DELETE FROM public.doctor_availability_rules WHERE doctor_id IN (v_target_id, v_slug_id, v_anderson_id);
  DELETE FROM public.doctor_scheduling_settings WHERE doctor_id IN (v_target_id, v_slug_id, v_anderson_id);

  -- 1. Regra de Tarde (Segunda a Sexta: 13:00 às 14:00)
  FOR d IN 1..5 LOOP
    INSERT INTO public.doctor_availability_rules (
      doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, modalities, is_active
    ) VALUES (
      v_target_id, d, '13:00'::time, '14:00'::time, 30, ARRAY['video', 'chat']::text[], true
    );
  END LOOP;

  -- 2. Regra de Noite (Segunda-feira: 19:00 às 20:00)
  INSERT INTO public.doctor_availability_rules (
    doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, modalities, is_active
  ) VALUES (
    v_target_id, 1, '19:00'::time, '20:00'::time, 30, ARRAY['video', 'chat']::text[], true
  );

  -- 3. Regra de Noite (Terça-feira: 20:30 às 22:00)
  INSERT INTO public.doctor_availability_rules (
    doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, modalities, is_active
  ) VALUES (
    v_target_id, 2, '20:30'::time, '22:00'::time, 30, ARRAY['video', 'chat']::text[], true
  );

  -- 4. Regra de Noite (Quinta-feira: 20:30 às 22:00)
  INSERT INTO public.doctor_availability_rules (
    doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, modalities, is_active
  ) VALUES (
    v_target_id, 4, '20:30'::time, '22:00'::time, 30, ARRAY['video', 'chat']::text[], true
  );

  -- 5. Configurações: antecedência 2h, janela 30 dias
  INSERT INTO public.doctor_scheduling_settings (
    doctor_id, min_advance_hours, max_advance_days
  ) VALUES (
    v_target_id, 2, 30
  ) ON CONFLICT (doctor_id) DO NOTHING;

END $$;
