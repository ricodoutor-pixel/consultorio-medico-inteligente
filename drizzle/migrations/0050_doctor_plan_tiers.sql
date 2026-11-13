-- ============================================================================
-- Planos do médico: Premium R$ 99 + Ouro R$ 199, Platina R$ 349, Diamante R$ 599, Elite R$ 999, Black R$ 1.500.
-- Fonte única de benefícios: supabase/functions/_shared/doctor-plans.ts.
-- ============================================================================

-- 1. Catálogo de cobrança (mp-checkout lê os preços daqui; recorrência mensal via Mercado Pago)
INSERT INTO public.payment_services (code, display_name, amount_brl, descriptor, recurring, active)
VALUES
  ('plano_medico_ouro',     'Plano Médico Ouro — Planta y Raiz',     199.00,  'PLANTAYRAIZ', true, true),
  ('plano_medico_platina',  'Plano Médico Platina — Planta y Raiz',  349.00,  'PLANTAYRAIZ', true, true),
  ('plano_medico_diamante', 'Plano Médico Diamante — Planta y Raiz', 599.00,  'PLANTAYRAIZ', true, true),
  ('plano_medico_elite',    'Plano Médico Elite — Planta y Raiz',    999.00,  'PLANTAYRAIZ', true, true),
  ('plano_medico_black',    'Plano Médico Black — Planta y Raiz',    1500.00, 'PLANTAYRAIZ', true, true)
ON CONFLICT (code) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      amount_brl = EXCLUDED.amount_brl,
      recurring = EXCLUDED.recurring,
      active = EXCLUDED.active;

UPDATE public.payment_services
   SET display_name = 'Plano Médico Premium — Planta y Raiz'
 WHERE code = 'plano_medico';

-- 2. Nomes de plano aceitos (inclui os antigos já gravados; NOT VALID não reprocessa linhas existentes)
ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS valid_plan_tier;
ALTER TABLE public.doctors ADD CONSTRAINT valid_plan_tier CHECK (plan_tier IS NULL OR plan_tier IN (
  'free', 'basic', 'professional', 'premium', 'enterprise', 'vip', 'vip_prescritor',
  'ouro', 'platina', 'diamante', 'elite', 'black'
)) NOT VALID;

ALTER TABLE public.medical_subscriptions DROP CONSTRAINT IF EXISTS valid_plan_tier;
ALTER TABLE public.medical_subscriptions ADD CONSTRAINT valid_plan_tier CHECK (plan_tier IN (
  'free', 'basic', 'professional', 'premium', 'enterprise', 'vip',
  'ouro', 'platina', 'diamante', 'elite', 'black'
)) NOT VALID;

-- 3. Uso das ferramentas exclusivas dos planos (doctor-pro-tools) conta como 'pro'
ALTER TABLE public.doctor_ai_usage DROP CONSTRAINT IF EXISTS doctor_ai_usage_tool_check;
ALTER TABLE public.doctor_ai_usage
  ADD CONSTRAINT doctor_ai_usage_tool_check CHECK (tool IN ('copiloto', 'juridico', 'escriba', 'pro'));
