-- Adicionar plano 'free' na constraint 'valid_plan_tier' da tabela 'doctors'
ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS valid_plan_tier;
ALTER TABLE public.doctors ADD CONSTRAINT valid_plan_tier CHECK (plan_tier IN ('free', 'basic', 'professional', 'premium', 'enterprise'));

-- Atualizar o default do plano para free
ALTER TABLE public.doctors ALTER COLUMN plan_tier SET DEFAULT 'free';
