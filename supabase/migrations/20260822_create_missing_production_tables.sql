-- =================================================================
-- PLANTA Y RAIZ — TABELAS FALTANTES PARA PRODUÇÃO
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =================================================================

-- 1. CONSULTATIONS (Registro de Consultas)
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id),
  doctor_id UUID REFERENCES public.doctors(id),
  appointment_id UUID REFERENCES public.appointments(id),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','cancelled','no_show')),
  modality TEXT DEFAULT 'video' CHECK (modality IN ('video','chat','phone')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INT,
  notes TEXT,
  copilot_summary TEXT,
  patient_rating INT CHECK (patient_rating BETWEEN 1 AND 5),
  patient_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- 2. PAYMENTS (Pagamentos e Split 93/7)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id),
  patient_id UUID REFERENCES auth.users(id),
  doctor_id UUID REFERENCES public.doctors(id),
  gross_amount NUMERIC(10,2) NOT NULL,
  platform_fee_pct NUMERIC(5,2) DEFAULT 7.00,
  platform_fee_amount NUMERIC(10,2) DEFAULT 0,
  doctor_net_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','released','refunded','failed')),
  payment_method TEXT DEFAULT 'mercadopago',
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  pix_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. DOCTOR_WALLETS (Carteira do Médico para Saques PIX)
CREATE TABLE IF NOT EXISTS public.doctor_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  balance NUMERIC(10,2) DEFAULT 0.00,
  total_earned NUMERIC(10,2) DEFAULT 0.00,
  total_withdrawn NUMERIC(10,2) DEFAULT 0.00,
  pix_key TEXT,
  pix_type TEXT CHECK (pix_type IN ('cpf','cnpj','email','phone','random')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doctor_wallets ENABLE ROW LEVEL SECURITY;

-- 4. EMAIL_QUEUE (Fila de E-mails Transacionais)
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  template TEXT,
  body_html TEXT,
  body_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed','cancelled')),
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- 5. ADMIN_FINANCIAL_LEDGER (Livro-Caixa da Plataforma — Taxa 7%)
CREATE TABLE IF NOT EXISTS public.admin_financial_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('platform_fee','doctor_payout','patient_refund','saas_expense','adjustment','revenue')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  balance_after NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_financial_ledger ENABLE ROW LEVEL SECURITY;

-- 6. SAAS_SUBSCRIPTIONS (Controle de Fornecedores SaaS)
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  monthly_cost_brl NUMERIC(10,2),
  monthly_cost_usd NUMERIC(10,2),
  billing_day INT CHECK (billing_day BETWEEN 1 AND 31),
  next_due_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','paused','trial')),
  payment_method TEXT,
  api_key_env_var TEXT,
  dashboard_url TEXT,
  notes TEXT,
  auto_pay BOOLEAN DEFAULT false,
  alert_days_before INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- TRIGGER: Auto-calculate split on payment insert
-- =================================================================
CREATE OR REPLACE FUNCTION calculate_payment_split()
RETURNS TRIGGER AS $$
BEGIN
  NEW.platform_fee_amount := ROUND(NEW.gross_amount * (NEW.platform_fee_pct / 100), 2);
  NEW.doctor_net_amount := NEW.gross_amount - NEW.platform_fee_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_payment_split ON public.payments;
CREATE TRIGGER trg_calculate_payment_split
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION calculate_payment_split();

-- =================================================================
-- TRIGGER: Credit doctor wallet when payment is released
-- =================================================================
CREATE OR REPLACE FUNCTION credit_doctor_wallet_on_release()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'released' AND OLD.status != 'released' THEN
    INSERT INTO public.doctor_wallets (doctor_id, user_id, balance, total_earned, pix_key, pix_type)
    SELECT NEW.doctor_id, d.user_id, NEW.doctor_net_amount, NEW.doctor_net_amount, p.pix_key, p.pix_type
    FROM public.doctors d JOIN public.profiles p ON d.user_id = p.id
    WHERE d.id = NEW.doctor_id
    ON CONFLICT (doctor_id) DO UPDATE SET
      balance = doctor_wallets.balance + NEW.doctor_net_amount,
      total_earned = doctor_wallets.total_earned + NEW.doctor_net_amount,
      updated_at = NOW();

    INSERT INTO public.admin_financial_ledger (entry_type, amount, description, reference_id, reference_type)
    VALUES ('platform_fee', NEW.platform_fee_amount, 'Taxa 7% consulta', NEW.id, 'payment');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_credit_wallet_on_release ON public.payments;
CREATE TRIGGER trg_credit_wallet_on_release
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION credit_doctor_wallet_on_release();
