-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Pricing Dinâmico e Sistema de Participação nos Lucros
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) Adicionar campos de pricing dinâmico à tabela doctors
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS consultation_price_video NUMERIC NOT NULL DEFAULT 150.00,
ADD COLUMN IF NOT EXISTS consultation_price_chat NUMERIC NOT NULL DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS technical_guidance_fee NUMERIC NOT NULL DEFAULT 30.00,
ADD COLUMN IF NOT EXISTS platform_commission_percentage NUMERIC NOT NULL DEFAULT 20.00;

-- 2) Criar tabela de performance bonus (participação nos lucros)
CREATE TABLE IF NOT EXISTS public.doctor_performance_bonus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_consultations INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  platform_commission NUMERIC NOT NULL DEFAULT 0,
  doctor_earnings NUMERIC NOT NULL DEFAULT 0,
  performance_bonus NUMERIC NOT NULL DEFAULT 0,
  bonus_percentage NUMERIC NOT NULL DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, month)
);

ALTER TABLE public.doctor_performance_bonus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own performance" ON public.doctor_performance_bonus 
  FOR SELECT TO authenticated 
  USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage performance" ON public.doctor_performance_bonus 
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin')) 
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) Adicionar campos de pricing à tabela appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'video' CHECK (consultation_type IN ('video', 'chat', 'technical_guidance')),
ADD COLUMN IF NOT EXISTS doctor_defined_price NUMERIC,
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS doctor_earnings NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_technical_guidance BOOLEAN NOT NULL DEFAULT false;

-- 4) Criar tabela de chat exclusivo com Dr. Edilson para suporte
CREATE TABLE IF NOT EXISTS public.dr_edilson_support_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'assistant', 'system')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'clinical_note', 'protocol', 'alert')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dr_edilson_support_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own support chat" ON public.dr_edilson_support_chat 
  FOR SELECT TO authenticated 
  USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can send messages" ON public.dr_edilson_support_chat 
  FOR INSERT TO authenticated 
  WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update own messages" ON public.dr_edilson_support_chat 
  FOR UPDATE TO authenticated 
  USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- 5) Criar tabela para armazenar alertas da Enf. Brisa
CREATE TABLE IF NOT EXISTS public.nurse_brisa_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('new_appointment', 'urgent', 'follow_up', 'document_ready')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

ALTER TABLE public.nurse_brisa_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own alerts" ON public.nurse_brisa_alerts 
  FOR SELECT TO authenticated 
  USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can mark alerts as read" ON public.nurse_brisa_alerts 
  FOR UPDATE TO authenticated 
  USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- 6) Adicionar realtime para as novas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_performance_bonus;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dr_edilson_support_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nurse_brisa_alerts;

-- 7) Criar função para calcular performance bonus mensal
CREATE OR REPLACE FUNCTION public.calculate_monthly_performance_bonus(
  p_doctor_id UUID,
  p_month DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_consultations INTEGER;
  v_total_revenue NUMERIC;
  v_commission_percentage NUMERIC;
  v_platform_fee NUMERIC;
  v_doctor_earnings NUMERIC;
  v_bonus_percentage NUMERIC;
  v_bonus_amount NUMERIC;
BEGIN
  -- Contar consultas do mês
  SELECT COUNT(*) INTO v_consultations
  FROM public.appointments
  WHERE doctor_id = p_doctor_id
    AND DATE_TRUNC('month', scheduled_at) = DATE_TRUNC('month', p_month)
    AND status = 'completed';

  -- Calcular receita total
  SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue
  FROM public.appointments
  WHERE doctor_id = p_doctor_id
    AND DATE_TRUNC('month', scheduled_at) = DATE_TRUNC('month', p_month)
    AND status = 'completed';

  -- Obter percentual de comissão
  SELECT platform_commission_percentage INTO v_commission_percentage
  FROM public.doctors
  WHERE id = p_doctor_id;

  -- Calcular taxa da plataforma
  v_platform_fee := v_total_revenue * (v_commission_percentage / 100);
  v_doctor_earnings := v_total_revenue - v_platform_fee;

  -- Calcular bonus por desempenho (escalonado)
  IF v_consultations >= 50 THEN
    v_bonus_percentage := 15;
  ELSIF v_consultations >= 30 THEN
    v_bonus_percentage := 10;
  ELSIF v_consultations >= 15 THEN
    v_bonus_percentage := 5;
  ELSE
    v_bonus_percentage := 0;
  END IF;

  v_bonus_amount := v_doctor_earnings * (v_bonus_percentage / 100);

  -- Inserir ou atualizar registro
  INSERT INTO public.doctor_performance_bonus (
    doctor_id, month, total_consultations, total_revenue,
    platform_commission, doctor_earnings, performance_bonus,
    bonus_percentage, final_amount
  ) VALUES (
    p_doctor_id, p_month, v_consultations, v_total_revenue,
    v_platform_fee, v_doctor_earnings, v_bonus_amount,
    v_bonus_percentage, v_doctor_earnings + v_bonus_amount
  )
  ON CONFLICT (doctor_id, month) DO UPDATE SET
    total_consultations = v_consultations,
    total_revenue = v_total_revenue,
    platform_commission = v_platform_fee,
    doctor_earnings = v_doctor_earnings,
    performance_bonus = v_bonus_amount,
    bonus_percentage = v_bonus_percentage,
    final_amount = v_doctor_earnings + v_bonus_amount,
    updated_at = now();

  RETURN v_doctor_earnings + v_bonus_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date 
  ON public.appointments(doctor_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_dr_edilson_support_doctor 
  ON public.dr_edilson_support_chat(doctor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nurse_brisa_alerts_doctor 
  ON public.nurse_brisa_alerts(doctor_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_bonus_doctor_month 
  ON public.doctor_performance_bonus(doctor_id, month DESC);
