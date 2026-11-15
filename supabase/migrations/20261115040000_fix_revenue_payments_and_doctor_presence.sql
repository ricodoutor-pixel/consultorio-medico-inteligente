-- ============================================================================
-- MIGRATION: 20261115040000_fix_revenue_payments_and_doctor_presence.sql
--
-- Execução dos itens 4 e 7 da Auditoria Técnica de 15/11/2026:
-- 1. Resolução do "Médico Online Falso":
--    - Adiciona `last_seen_online` na tabela de vitrine `public.doctors_public`.
--    - Atualiza o trigger `sync_doctors_public_catalog` para sincronizar o batimento de presença.
--    - Desliga `is_online` de médicos sem presença real nos últimos 2 minutos.
--    - Define DEFAULT false para `is_online`.
-- 2. Registro Real de Receita (Financeiro na Plataforma):
--    - Adiciona índices únicos em `payments(mp_payment_id)` e `consultations(appointment_id)`.
--    - Backfill retroativo de todas as Orientações Técnicas e consultas pagas para `public.payments`
--      e `public.consultations`, permitindo que o /admin e o LiveCommandCenter leiam o faturamento real.
-- ============================================================================

-- 1. Presença real de médicos (Elimina os 71 "online falsos")
ALTER TABLE public.doctors_public ADD COLUMN IF NOT EXISTS last_seen_online TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.sync_doctors_public_catalog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_row record;
BEGIN
  IF NEW.is_verified IS NOT TRUE THEN
    DELETE FROM public.doctors_public WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  SELECT * INTO display_row FROM public.get_doctor_display(NEW.user_id);

  INSERT INTO public.doctors_public (
    id, user_id, specialty, crm, crm_state, rqe, bio, rating,
    consultation_price, is_verified, is_online, plan_tier,
    total_consultations, available_hours, is_available, document_type,
    country, city, price_video_chat, price_chat_only, price_return,
    full_name, avatar_url, created_at, last_seen_online
  ) VALUES (
    NEW.id, NEW.user_id, NEW.specialty, NEW.crm, NEW.crm_state, NEW.rqe,
    NEW.bio, NEW.rating, NEW.consultation_price, NEW.is_verified,
    NEW.is_online, NEW.plan_tier, NEW.total_consultations, NEW.available_hours,
    NEW.is_available, NEW.document_type, NEW.country, NEW.city,
    NEW.price_video_chat, NEW.price_chat_only, NEW.price_return,
    display_row.full_name, display_row.avatar_url, NEW.created_at, NEW.last_seen_online
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    specialty = EXCLUDED.specialty,
    crm = EXCLUDED.crm,
    crm_state = EXCLUDED.crm_state,
    rqe = EXCLUDED.rqe,
    bio = EXCLUDED.bio,
    rating = EXCLUDED.rating,
    consultation_price = EXCLUDED.consultation_price,
    is_verified = EXCLUDED.is_verified,
    is_online = EXCLUDED.is_online,
    plan_tier = EXCLUDED.plan_tier,
    total_consultations = EXCLUDED.total_consultations,
    available_hours = EXCLUDED.available_hours,
    is_available = EXCLUDED.is_available,
    document_type = EXCLUDED.document_type,
    country = EXCLUDED.country,
    city = EXCLUDED.city,
    price_video_chat = EXCLUDED.price_video_chat,
    price_chat_only = EXCLUDED.price_chat_only,
    price_return = EXCLUDED.price_return,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    created_at = EXCLUDED.created_at,
    last_seen_online = EXCLUDED.last_seen_online;
  RETURN NEW;
END;
$$;

-- Desliga is_online de médicos que não têm batimento de presença recente
UPDATE public.doctors
SET is_online = false
WHERE last_seen_online IS NULL OR last_seen_online < now() - INTERVAL '2 minutes';

UPDATE public.doctors_public dp
SET is_online = d.is_online,
    last_seen_online = d.last_seen_online
FROM public.doctors d
WHERE dp.id = d.id;

ALTER TABLE public.doctors ALTER COLUMN is_online SET DEFAULT false;
ALTER TABLE public.doctors_public ALTER COLUMN is_online SET DEFAULT false;

-- 2. Garantia de unicidade para inserções financeiras seguras
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_mp_payment_id_uniq
  ON public.payments(mp_payment_id) WHERE mp_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_consultations_appointment_id_uniq
  ON public.consultations(appointment_id) WHERE appointment_id IS NOT NULL;

-- 3. Backfill retroativo de Orientação Técnica para a tabela `payments`
INSERT INTO public.payments (
  mp_payment_id,
  patient_id,
  doctor_id,
  gross_amount,
  platform_fee_pct,
  platform_fee_amount,
  doctor_net_amount,
  status,
  payment_method,
  paid_at,
  created_at
)
SELECT
  oto.mp_payment_id,
  oto.user_id,
  NULL,
  COALESCE(oto.amount, 30.00),
  7.00,
  COALESCE(oto.platform_fee, ROUND(COALESCE(oto.amount, 30.00) * 0.07, 2)),
  COALESCE(oto.doctor_payout, ROUND(COALESCE(oto.amount, 30.00) * 0.93, 2)),
  'paid',
  'mercadopago',
  COALESCE(oto.paid_at, oto.created_at, now()),
  COALESCE(oto.created_at, now())
FROM public.orientacao_tecnica_orders oto
WHERE (oto.status = 'approved' OR oto.status = 'paid' OR oto.flow_status = 'pago')
  AND oto.mp_payment_id IS NOT NULL AND oto.mp_payment_id <> ''
ON CONFLICT (mp_payment_id) WHERE mp_payment_id IS NOT NULL
DO NOTHING;

-- Backfill retroativo de Consultas pagas para `payments` e `consultations`
INSERT INTO public.consultations (
  appointment_id,
  patient_id,
  doctor_id,
  status,
  modality,
  created_at
)
SELECT
  a.id,
  a.patient_id,
  a.doctor_id,
  'scheduled',
  CASE WHEN a.type = 'chat' THEN 'chat' ELSE 'video' END,
  COALESCE(a.created_at, now())
FROM public.appointments a
WHERE a.payment_status = 'paid'
ON CONFLICT (appointment_id) WHERE appointment_id IS NOT NULL
DO NOTHING;

INSERT INTO public.payments (
  consultation_id,
  patient_id,
  doctor_id,
  gross_amount,
  platform_fee_pct,
  platform_fee_amount,
  doctor_net_amount,
  status,
  payment_method,
  paid_at,
  created_at
)
SELECT
  c.id,
  a.patient_id,
  a.doctor_id,
  COALESCE(a.amount, 150.00),
  7.00,
  ROUND(COALESCE(a.amount, 150.00) * 0.07, 2),
  ROUND(COALESCE(a.amount, 150.00) * 0.93, 2),
  'paid',
  'mercadopago',
  COALESCE(a.created_at, now()),
  COALESCE(a.created_at, now())
FROM public.appointments a
JOIN public.consultations c ON c.appointment_id = a.id
WHERE a.payment_status = 'paid'
ON CONFLICT DO NOTHING;
